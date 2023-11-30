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
