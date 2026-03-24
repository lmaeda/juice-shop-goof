import chai = require('chai')
const expect = chai.expect
import sinon = require('sinon')
import fs = require('fs')
import crypto = require('crypto')

// Missing dependencies/mocked internal imports
// Note: These stubs are for isolating lib/utils.ts
import * as utils from '../../lib/utils'

describe('lib/utils', () => {
  describe('queryResultToJson', () => {
    // Happy Path: Standard object with dataValues (Sequelize-like)
    it('should extract dataValues from a single object', () => {
      const data = { dataValues: { id: 1, name: 'test' } }
      const result = utils.queryResultToJson(data)
      expect(result).to.deep.equal({ status: 'success', data: { id: 1, name: 'test' } })
    })

    // Happy Path: Array of objects with dataValues
    it('should extract dataValues from an array of objects', () => {
      const data = [{ dataValues: { id: 1 } }, { dataValues: { id: 2 } }]
      const result = utils.queryResultToJson(data)
      expect(result.data).to.deep.equal([{ id: 1 }, { id: 2 }])
    })

    // Edge Case: Null/Undefined input
    it('should return empty object for null input', () => {
      const result = utils.queryResultToJson(null)
      expect(result).to.deep.equal({ status: 'success', data: {} })
    })

    // Edge Case: Empty array
    it('should return empty array for an empty array', () => {
      const result = utils.queryResultToJson([])
      expect(result.data).to.deep.equal([])
    })

    // Edge Case: Array with mixed dataValues and raw objects
    it('should handle mixed arrays of Sequelize objects and raw objects', () => {
      const data = [{ dataValues: { id: 1 } }, { id: 2 }]
      const result = utils.queryResultToJson(data)
      expect(result.data).to.deep.equal([{ id: 1 }, { id: 2 }])
    })
  })

  describe('startsWith', () => {
    // Happy Path
    it('should return true if string starts with prefix', () => {
      expect(utils.startsWith('hello world', 'hello')).to.equal(true)
    })

    // Boundary Condition: Prefix is the whole string
    it('should return true if prefix equals the string', () => {
      expect(utils.startsWith('abc', 'abc')).to.equal(true)
    })

    // Edge Case: Empty prefix
    it('should return true for empty prefix', () => {
      expect(utils.startsWith('abc', '')).to.equal(true)
    })

    // Error State: Null string
    it('should return false for null/undefined string', () => {
      // @ts-expect-error
      expect(utils.startsWith(null, 'prefix')).to.equal(false)
    })
  })

  describe('endsWith', () => {
    // Happy Path
    it('should return true if string ends with suffix', () => {
      expect(utils.endsWith('hello.md', '.md')).to.equal(true)
    })

    // Edge Case: Suffix longer than string
    it('should return false if suffix is longer than string', () => {
      expect(utils.endsWith('abc', 'abcd')).to.equal(false)
    })

    // Edge Case: Missing arguments
    it('should return false if suffix is undefined', () => {
      expect(utils.endsWith('abc', undefined)).to.equal(false)
    })
  })

  describe('unquote', () => {
    // Happy Path
    it('should remove surrounding double quotes', () => {
      expect(utils.unquote('"quoted"')).to.equal('quoted')
    })

    // Edge Case: Only leading quote
    it('should not remove quote if it only has a leading quote', () => {
      expect(utils.unquote('"no-end')).to.equal('"no-end')
    })

    // Edge Case: Empty string
    it('should return empty string for empty input', () => {
      expect(utils.unquote('')).to.equal('')
    })
  })

  describe('trunc', () => {
    // Happy Path: Shorten and add ellipsis
    it('should truncate and add ellipsis if string exceeds length', () => {
      expect(utils.trunc('1234567890', 5)).to.equal('1234...')
    })

    // Boundary Condition: Length exactly matches string
    it('should not truncate if length matches string size', () => {
      expect(utils.trunc('abc', 3)).to.equal('abc')
    })

    // Edge Case: String containing newlines
    it('should remove all newlines before truncation', () => {
      expect(utils.trunc('a\nb\nc\nd', 10)).to.equal('abcd')
    })
  })

  describe('toISO8601', () => {
    // Happy Path
    it('should format date correctly with zero padding', () => {
      const date = new Date(2023, 0, 5) // Jan 5, 2023
      expect(utils.toISO8601(date)).to.equal('2023-01-05')
    })

    // Happy Path: Double digit months/days
    it('should format date correctly with double digits', () => {
      const date = new Date(2023, 11, 25) // Dec 25, 2023
      expect(utils.toISO8601(date)).to.equal('2023-12-25')
    })
  })

  describe('extractFilename', () => {
    // Happy Path: Standard URL
    it('should extract filename from simple URL', () => {
      expect(utils.extractFilename('http://example.com/path/file.txt')).to.equal('file.txt')
    })

    // Edge Case: URL with query parameters
    it('should ignore query parameters', () => {
      expect(utils.extractFilename('http://example.com/file.png?v=1&size=large')).to.equal('file.png')
    })

    // Edge Case: URL-encoded characters
    it('should decode URL-encoded filename', () => {
      expect(utils.extractFilename('http://example.com/my%20file.txt')).to.equal('my file.txt')
    })
  })

  describe('jwtFrom', () => {
    // Happy Path: Bearer token
    it('should extract token from Bearer header', () => {
      const req = { headers: { authorization: 'Bearer my.token.here' } }
      expect(utils.jwtFrom(req)).to.equal('my.token.here')
    })

    // Error State: Missing authorization header
    it('should return undefined if header is missing', () => {
      const req = { headers: {} }
      expect(utils.jwtFrom(req)).to.equal(undefined)
    })

    // Edge Case: Case-insensitive Bearer
    it('should handle case-insensitive bearer prefix', () => {
      const req = { headers: { authorization: 'bearer my.token' } }
      expect(utils.jwtFrom(req)).to.equal('my.token')
    })

    // Error State: Malformed header (no space)
    it('should return undefined for malformed header', () => {
      const req = { headers: { authorization: 'BearerTokenWithoutSpace' } }
      expect(utils.jwtFrom(req)).to.equal(undefined)
    })
  })

  describe('getErrorMessage', () => {
    // Happy Path: Error object
    it('should return message property from Error object', () => {
      const err = new Error('test error')
      expect(utils.getErrorMessage(err)).to.equal('test error')
    })

    // Edge Case: String error
    it('should return the string itself for string errors', () => {
      expect(utils.getErrorMessage('plain string error')).to.equal('plain string error')
    })

    // Edge Case: Null/Other types
    it('should stringify other types', () => {
      expect(utils.getErrorMessage(null)).to.equal('null')
      expect(utils.getErrorMessage(404)).to.equal('404')
    })
  })
})
