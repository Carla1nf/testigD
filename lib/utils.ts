import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * This function generates a range of numbers from 0 to the specified length.
 * @param length - The length of the range to generate.
 * @returns An array of numbers from 0 to length.
 */
export const range = (length: number): number[] => Array.from({ length }, (_, index) => index)

/**
 * This function calculates the dynamic clamp increment based on the difference between two values.
 * @param value1 - The first value.
 * @param value2 - The second value.
 * @returns The dynamic clamp increment.
 */

export const dynamicClampIncrement = (value1: number, value2: number): number => {
  const maxIncrement = 50
  const range = Math.abs(value1 - value2)

  if (range <= 0.5) return 0.5
  if (range <= 1) return 1 // Smallest range, use an increment of 1
  if (range <= 10) return 5 // Small range, use an increment of 5
  if (range <= 100) return 10 // Moderate range, use an increment of 10
  if (range <= 500) return 25 // Larger range, use an increment of 25

  return maxIncrement // Largest range, use the maximum increment of 50
}

export const roundIfClose = (num: number, roundingDecimals: number): number => {
  const nearestInteger = Math.round(num)
  const difference = Math.abs(num - nearestInteger)

  if (difference <= roundingDecimals) {
    return nearestInteger
  } else {
    return num
  }
}

/**
 * Clamps the given value to the next higher multiple of the increment.
 * @param value - The value to clamp.
 * @param increment - The increment to use for clamping.
 * @returns The clamped value.
 */
export const clampHigh = (value: number, increment: number) => {
  const nextHigherMultiple = Math.ceil(value / increment) * increment
  return Math.max(value, nextHigherMultiple)
}

export const fixedDecimals = (value: number, decimals = 2) => {
  return Number(value.toFixed(decimals))
}

/**
 * This function returns the last number in an array of numbers.
 * @param numbers - The array of numbers.
 * @returns The last number in the array.
 */
export const lastNumber = (numbers: number[]): number => {
  return numbers[numbers.length - 1]
}
