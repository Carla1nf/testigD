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
