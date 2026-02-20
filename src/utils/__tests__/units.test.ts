import { describe, it, expect } from 'vitest'
import {
  cmToInches,
  inchesToCm,
  formatDimension,
  convertDimension,
  parseDimensionInput,
} from '../units'

describe('Unit Conversion Utilities', () => {
  describe('cmToInches', () => {
    it('converts 2.54 cm to 1 inch', () => {
      expect(cmToInches(2.54)).toBe(1)
    })

    it('converts 0 cm to 0 inches', () => {
      expect(cmToInches(0)).toBe(0)
    })
  })

  describe('inchesToCm', () => {
    it('converts 1 inch to 2.54 cm', () => {
      expect(inchesToCm(1)).toBe(2.54)
    })

    it('converts 0 inches to 0 cm', () => {
      expect(inchesToCm(0)).toBe(0)
    })
  })

  describe('formatDimension', () => {
    it('formats 60 cm as "60 cm"', () => {
      expect(formatDimension(60, 'cm')).toBe('60 cm')
    })

    it('formats 60 cm as "23.62 in"', () => {
      expect(formatDimension(60, 'in')).toBe('23.62 in')
    })

    it('formats 0 cm as "0 cm"', () => {
      expect(formatDimension(0, 'cm')).toBe('0 cm')
    })

    it('formats decimal cm values appropriately', () => {
      expect(formatDimension(60.5, 'cm')).toBe('60.5 cm')
    })

    it('formats decimal inch values with 2 decimal places', () => {
      expect(formatDimension(50.8, 'in')).toBe('20.00 in')
    })
  })

  describe('convertDimension', () => {
    it('converts 100 cm to inches (within 0.01)', () => {
      const result = convertDimension(100, 'cm', 'in')
      expect(Math.abs(result - 39.37)).toBeLessThan(0.01)
    })

    it('converts 39.37 inches to cm (within 0.01)', () => {
      const result = convertDimension(39.37, 'in', 'cm')
      expect(Math.abs(result - 100)).toBeLessThan(0.01)
    })

    it('returns same value when converting to same unit', () => {
      expect(convertDimension(50, 'cm', 'cm')).toBe(50)
      expect(convertDimension(20, 'in', 'in')).toBe(20)
    })
  })

  describe('parseDimensionInput', () => {
    it('parses "50" as 50 cm', () => {
      expect(parseDimensionInput('50', 'cm')).toBe(50)
    })

    it('parses "20" inches to cm equivalent', () => {
      const result = parseDimensionInput('20', 'in')
      expect(Math.abs(result - 50.8)).toBeLessThan(0.01)
    })

    it('returns 0 for empty string', () => {
      expect(parseDimensionInput('', 'cm')).toBe(0)
    })

    it('parses decimal values', () => {
      expect(parseDimensionInput('25.5', 'cm')).toBe(25.5)
    })
  })
})
