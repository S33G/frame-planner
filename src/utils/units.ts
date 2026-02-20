import type { Unit } from '@/types'

export const CM_PER_INCH = 2.54

export function cmToInches(cm: number): number {
  return cm / CM_PER_INCH
}

export function inchesToCm(inches: number): number {
  return inches * CM_PER_INCH
}

export function formatDimension(valueCm: number, unit: Unit): string {
  if (unit === 'cm') {
    const formatted = valueCm % 1 === 0 ? valueCm.toString() : valueCm.toFixed(1)
    return `${formatted} cm`
  } else {
    const inches = cmToInches(valueCm)
    return `${inches.toFixed(2)} in`
  }
}

export function convertDimension(value: number, from: Unit, to: Unit): number {
  if (from === to) {
    return value
  }
  if (from === 'cm' && to === 'in') {
    return cmToInches(value)
  }
  return inchesToCm(value)
}

export function parseDimensionInput(input: string, unit: Unit): number {
  if (input === '') {
    return 0
  }
  const parsed = parseFloat(input)
  if (isNaN(parsed)) {
    return 0
  }
  if (unit === 'cm') {
    return parsed
  }
  return inchesToCm(parsed)
}
