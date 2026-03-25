import chai = require('chai')
const expect = chai.expect
import sinon = require('sinon')
import * as insecurity from '../../lib/insecurity'

describe('lib/insecurity', () => {
  describe('hash', () => {
    // Happy Path
    it('should return md5 hash of string', () => {
      expect(insecurity.hash('admin')).to.equal('21232f297a57a5a743894a0e4a801fc3')
    })

    // Edge Case: Empty string
    it('should return md5 hash of empty string', () => {
      expect(insecurity.hash('')).to.equal('d41d8cd98f00b204e9800998ecf8427e')
    })
  })

  describe('hmac', () => {
    // Happy Path: Actual hash from lib/insecurity.ts Pa4qacea4VK9t9nGv7yZtwmj key
    it('should return sha256 hmac of string', () => {
      expect(insecurity.hmac('test')).to.equal('d8130f20a48acefa2f90baa8a78d9176cb0531bee9a0732a5193d9672f9f82b4')
    })
  })

  describe('cutOffPoisonNullByte', () => {
    // Happy Path: No null byte
    it('should return same string if no null byte present', () => {
      expect(insecurity.cutOffPoisonNullByte('test.txt')).to.equal('test.txt')
    })

    // Edge Case: Presence of URL-encoded null byte
    it('should cut off string at the first %00 sequence', () => {
      expect(insecurity.cutOffPoisonNullByte('test.txt%00.jpg')).to.equal('test.txt')
    })

    // Edge Case: Multiple null bytes
    it('should cut off at the first occurrence of multiple %00', () => {
      expect(insecurity.cutOffPoisonNullByte('first%00second%00third')).to.equal('first')
    })
  })

  describe('sanitizeLegacy', () => {
    // Happy Path: Logic as per regex input.replace(/<(?:\w+)\W+?[\w]/gi, '')
    it('should remove tags matching legacy regex', () => {
      // In '<script>alert(1)', it matches '<script>' and removes it starting from < up to 'a'
      expect(insecurity.sanitizeLegacy('<script>alert(1)</script>')).to.equal('lert(1)</script>')
    })

    // Edge Case: Empty input
    it('should return empty string for undefined input', () => {
      expect(insecurity.sanitizeLegacy(undefined as unknown as string)).to.equal('')
    })
  })

  describe('isRedirectAllowed', () => {
    // Happy Path
    it('should allow whitelisted URLs', () => {
      expect(insecurity.isRedirectAllowed('https://github.com/bkimminich/juice-shop')).to.equal(true)
    })

    // Logic Gap / Vulnerability Test: Partial match
    it('should allow URLs that CONTAIN a whitelisted URL (vulnerability path)', () => {
      // This is a known vulnerability in the POC code identified by: url.includes(allowedUrl)
      expect(insecurity.isRedirectAllowed('http://evil.com?redirect=https://github.com/bkimminich/juice-shop')).to.equal(true)
    })

    // Happy Path: Disallow non-whitelisted
    it('should disallow non-whitelisted URLs', () => {
      expect(insecurity.isRedirectAllowed('http://malicious-site.com')).to.equal(false)
    })
  })

  describe('authenticatedUsers', () => {
    // Setup/Teardown logic
    beforeEach(() => {
      insecurity.authenticatedUsers.tokenMap = {}
      insecurity.authenticatedUsers.idMap = {}
    })

    // Happy Path: Put and Get
    it('should store and retrieve a user by token', () => {
      const user: any = { data: { id: 42, email: 'test@owasp.org' } }
      insecurity.authenticatedUsers.put('my-token', user)
      expect(insecurity.authenticatedUsers.get('my-token')).to.equal(user)
    })

    // Edge Case: Retrieve non-existent token
    it('should return undefined for non-existent token', () => {
      expect(insecurity.authenticatedUsers.get('invalid')).to.equal(undefined)
    })

    // Happy Path: tokenOf
    it('should retrieve token by user id', () => {
      const user: any = { id: 123 }
      insecurity.authenticatedUsers.put('token-123', { data: user } as any)
      expect(insecurity.authenticatedUsers.tokenOf(user)).to.equal('token-123')
    })
  })

  describe('userEmailFrom', () => {
    // Happy Path
    it('should extract email from x-user-email header', () => {
      const req = { headers: { 'x-user-email': 'test@test.com' } }
      expect(insecurity.userEmailFrom(req)).to.equal('test@test.com')
    })

    // Edge Case: Missing headers
    it('should return undefined if headers are missing', () => {
      expect(insecurity.userEmailFrom({})).to.equal(undefined)
    })
  })

  describe('discountFromCoupon', () => {
    // Mock date to ensure validity matches current month
    let clock: sinon.SinonFakeTimers
    before(() => {
      clock = sinon.useFakeTimers(new Date(2023, 0, 1).getTime()) // Jan 2023
    })
    after(() => {
      clock.restore()
    })

    // Happy Path: Valid coupon
    it('should extract discount from a valid coupon', () => {
      const coupon = insecurity.generateCoupon(10, new Date(2023, 0, 1))
      expect(insecurity.discountFromCoupon(coupon)).to.equal(10)
    })

    // Edge Case: Invalid format
    it('should return undefined for invalid coupon format', () => {
      const invalidCoupon = 'invalid'
      expect(insecurity.discountFromCoupon(invalidCoupon)).to.equal(undefined)
    })

    // Edge Case: Expired coupon
    it('should return undefined for coupon from a different month', () => {
      const oldCoupon = insecurity.generateCoupon(10, new Date(2022, 11, 1)) // DEC22
      expect(insecurity.discountFromCoupon(oldCoupon)).to.equal(undefined)
    })
  })
})
