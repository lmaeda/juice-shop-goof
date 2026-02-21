import chai = require('chai')
const expect = chai.expect
import sinon = require('sinon')

// We need to stub dependencies before requiring the module to avoid sqlite3 load errors
import models = require('../../models/index')
const security = require('../../lib/insecurity')
const challengeUtils = require('../../lib/challengeUtils')

describe('routes/search', () => {
  let req: any
  let res: any
  let next: sinon.SinonSpy
  let searchProducts: any

  beforeEach(() => {
    // Reset stubs and setup req/res mocks
    sinon.restore()
    req = {
      query: {},
      __: sinon.stub().returnsArg(0)
    }
    res = {
      json: sinon.spy(),
      status: sinon.stub().returns({ json: sinon.spy() })
    }
    next = sinon.spy()

    // Import the module inside beforeEach to ensure stubs are active
    // We use require to bypass some TS strictness for the purpose of this unit test setup
    searchProducts = require('../../routes/search')
  })

  it('should return products based on search criteria', async () => {
    const products = [{ name: 'Apple Juice', description: 'Fresh' }]
    const queryStub = sinon.stub(models.sequelize, 'query').resolves([products, null])
    req.query.q = 'apple'

    await searchProducts()(req, res, next)

    expect(queryStub.calledOnce).to.be.true
    expect(queryStub.getCall(0).args[0]).to.contain("LIKE '%apple%'")
    expect(res.json.calledOnce).to.be.true
    expect(res.json.getCall(0).args[0].data).to.deep.equal(products)
  })

  it('should handle undefined search criteria by searching for empty string', async () => {
    const queryStub = sinon.stub(models.sequelize, 'query').resolves([[], null])
    req.query.q = 'undefined'

    await searchProducts()(req, res, next)

    expect(queryStub.getCall(0).args[0]).to.contain("LIKE '%%'")
  })

  it('should truncate criteria longer than 200 characters', async () => {
    const longCriteria = 'a'.repeat(250)
    const queryStub = sinon.stub(models.sequelize, 'query').resolves([[], null])
    req.query.q = longCriteria

    await searchProducts()(req, res, next)

    const sql = queryStub.getCall(0).args[0]
    expect(sql).to.contain(`LIKE '%${'a'.repeat(200)}%'`)
  })

  it('should handle database query errors', async () => {
    const error = { parent: new Error('DB Error') }
    sinon.stub(models.sequelize, 'query').rejects(error)
    req.query.q = 'test'

    await searchProducts()(req, res, next)

    expect(next.calledWith(error.parent)).to.be.true
  })

  // Edge Case: SQL Injection vulnerability path
  it('should be vulnerable to SQL injection due to lack of sanitization', async () => {
    const queryStub = sinon.stub(models.sequelize, 'query').resolves([[], null])
    req.query.q = "'))-- "

    await searchProducts()(req, res, next)

    const sql = queryStub.getCall(0).args[0]
    // The vulnerability is that the query is built with string concatenation
    expect(sql).to.contain("LIKE '%'))-- %'")
  })
})
