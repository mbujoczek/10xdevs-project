import { SRSGrade } from '@/types/enums'
import type { RatingDistribution } from '@/types/learning.types'

/**
 * Array of all SRS grade values (0-5)
 */
export const ALL_GRADES = [
  SRSGrade.CompleteBlackout,
  SRSGrade.IncorrectResponse,
  SRSGrade.IncorrectResponseRecalled,
  SRSGrade.CorrectWithDifficulty,
  SRSGrade.CorrectAfterHesitation,
  SRSGrade.PerfectResponse,
] as const

/**
 * Calculates the average rating from a rating distribution
 * @param distribution - The rating distribution object
 * @param totalReviewed - Total number of reviewed flashcards
 * @returns Average rating (0-5) or 0 if no reviews
 */
export const calculateAverageRating = (
  distribution: RatingDistribution,
  totalReviewed: number,
): number => {
  if (totalReviewed === 0) return 0

  const sum = ALL_GRADES.reduce((acc, grade) => {
    return acc + distribution[grade] * grade
  }, 0)

  return sum / totalReviewed
}

/**
 * Calculates the percentage of a specific grade in the distribution
 * @param distribution - The rating distribution object
 * @param totalReviewed - Total number of reviewed flashcards
 * @param grade - The grade to calculate percentage for
 * @returns Percentage (0-100) rounded to nearest integer
 */
export const calculateGradePercentage = (
  distribution: RatingDistribution,
  totalReviewed: number,
  grade: SRSGrade,
): number => {
  if (totalReviewed === 0) return 0

  const count = distribution[grade]
  return Math.round((count / totalReviewed) * 100)
}

/**
 * Formats session duration from milliseconds to human-readable string
 * @param durationMs - Duration in milliseconds
 * @returns Formatted string (e.g., "5m 23s" or "45s")
 */
export const formatSessionDuration = (durationMs?: number): string => {
  if (!durationMs) return '-'

  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  return `${minutes}m ${remainingSeconds}s`
}
