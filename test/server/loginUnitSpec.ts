import chai = require('chai')
const expect = chai.expect
import sinon = require('sinon')
const login = require('../../routes/login')
import models = require('../../models/index')
import { BasketModel } from '../../models/basket'
import { UserModel } from '../../models/user'
const security = require('../../lib/insecurity')

describe('routes/login', () => {
  let req: any
  let res: any
  let next: sinon.SinonSpy

  beforeEach(() => {
    req = {
      body: {},
      headers: {}
    }
    res = {
      json: sinon.spy(),
      status: sinon.stub().returns({ json: sinon.spy(), send: sinon.spy() }),
      send: sinon.spy(),
      __: sinon.stub().returnsArg(0)
    }
    next = sinon.spy()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should login successfully and return a token when credentials are valid', async () => {
    const user = { id: 1, email: 'admin@juice-sh.op', totpSecret: '' }
    const basket = { id: 10 }

    sinon.stub(models.sequelize, 'query').resolves(user)
    sinon.stub(BasketModel, 'findOrCreate').resolves([basket, true] as any)
    sinon.stub(security, 'authorize').returns('fake-token')
    sinon.stub(security.authenticatedUsers, 'put')

    await login()(req, res, next)

    expect(res.json.calledOnce).to.be.true
    const responseData = res.json.getCall(0).args[0]
    expect(responseData.authentication.token).to.equal('fake-token')
    expect(responseData.authentication.umail).to.equal('admin@juice-sh.op')
  })

  it('should return 401 when email or password is missing/invalid', async () => {
    sinon.stub(models.sequelize, 'query').resolves(null)

    await login()(req, res, next)

    expect(res.status.calledWith(401)).to.be.true
  })

  it('should return totp_token_required when user has TOTP enabled', async () => {
    const user = { id: 2, email: 'totp@juice-sh.op', totpSecret: process.env.TOTP_SECRET }
    sinon.stub(models.sequelize, 'query').resolves(user)
    sinon.stub(security, 'authorize').returns('tmp-token')

    await login()(req, res, next)

    expect(res.status.calledWith(401)).to.be.true
    const responseJson = res.status.getCall(0).returnValue.json
    expect(responseJson.calledWith(sinon.match({ status: 'totp_token_required' }))).to.be.true
  })

  it('should handle database query errors', async () => {
    const error = new Error('DB Error')
    sinon.stub(models.sequelize, 'query').rejects(error)

    await login()(req, res, next)

    expect(next.calledWith(error)).to.be.true
  })

  // Edge Case: SQL Injection vulnerability path (logic gap verification)
  it('should allow SQL injection due to lack of input sanitization in query', async () => {
    // This test documents the logical gap where user input is directly concatenated into SQL
    const queryStub = sinon.stub(models.sequelize, 'query').resolves(null)
    req.body.email = "' OR 1=1--"
    req.body.password = 'anything'

    await login()(req, res, next)

    const sql = queryStub.getCall(0).args[0]
    expect(sql).to.contain("email = '' OR 1=1--'")
  })

  it('should handle basket creation failures after successful query', async () => {
    const user = { id: 1, email: 'test@test.com', totpSecret: '' }
    const error = new Error('Basket Error')
    sinon.stub(models.sequelize, 'query').resolves(user)
    sinon.stub(BasketModel, 'findOrCreate').rejects(error)

    await login()(req, res, next)

    // Using a small delay because afterLogin is async
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(next.calledWith(error)).to.be.true
  })
})
