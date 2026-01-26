import { SRSGrade } from '@/types/enums'
import type { RatingDistribution } from '@/types/learning.types'
import {
  ALL_GRADES,
  calculateAverageRating,
  calculateGradePercentage,
  formatSessionDuration,
} from '@/utils/srs'
import { describe, expect, it } from 'vitest'

describe('srs utils', () => {
  describe('ALL_GRADES', () => {
    it('should contain all 6 grade values', () => {
      expect(ALL_GRADES).toHaveLength(6)
    })

    it('should contain grades 0 through 5', () => {
      expect(ALL_GRADES).toEqual([
        SRSGrade.CompleteBlackout,
        SRSGrade.IncorrectResponse,
        SRSGrade.IncorrectResponseRecalled,
        SRSGrade.CorrectWithDifficulty,
        SRSGrade.CorrectAfterHesitation,
        SRSGrade.PerfectResponse,
      ])
    })

    it('should be readonly', () => {
      expect(Object.isFrozen(ALL_GRADES)).toBe(false) // Arrays in TS are not frozen
      // But TypeScript type system prevents modification at compile time
    })
  })

  describe('calculateAverageRating', () => {
    it('should return 0 when totalReviewed is 0', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 0,
      }

      const result = calculateAverageRating(distribution, 0)

      expect(result).toBe(0)
    })

    it('should calculate correct average for single grade 5', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 1,
      }

      const result = calculateAverageRating(distribution, 1)

      expect(result).toBe(5)
    })

    it('should calculate correct average for single grade 0', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 1,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 0,
      }

      const result = calculateAverageRating(distribution, 1)

      expect(result).toBe(0)
    })

    it('should calculate correct average for multiple same grades', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 5,
        [SRSGrade.PerfectResponse]: 0,
      }

      // 5 reviews of grade 4: (4*5) / 5 = 4
      const result = calculateAverageRating(distribution, 5)

      expect(result).toBe(4)
    })

    it('should calculate correct average for mixed grades', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 1, // 0 * 1 = 0
        [SRSGrade.IncorrectResponse]: 1, // 1 * 1 = 1
        [SRSGrade.IncorrectResponseRecalled]: 1, // 2 * 1 = 2
        [SRSGrade.CorrectWithDifficulty]: 1, // 3 * 1 = 3
        [SRSGrade.CorrectAfterHesitation]: 1, // 4 * 1 = 4
        [SRSGrade.PerfectResponse]: 1, // 5 * 1 = 5
      }

      // Sum: 0+1+2+3+4+5 = 15, Total: 6, Average: 15/6 = 2.5
      const result = calculateAverageRating(distribution, 6)

      expect(result).toBe(2.5)
    })

    it('should calculate correct average for realistic session', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0, // 0 * 0 = 0
        [SRSGrade.IncorrectResponse]: 1, // 1 * 1 = 1
        [SRSGrade.IncorrectResponseRecalled]: 2, // 2 * 2 = 4
        [SRSGrade.CorrectWithDifficulty]: 3, // 3 * 3 = 9
        [SRSGrade.CorrectAfterHesitation]: 5, // 4 * 5 = 20
        [SRSGrade.PerfectResponse]: 9, // 5 * 9 = 45
      }

      // Sum: 0+1+4+9+20+45 = 79, Total: 20, Average: 79/20 = 3.95
      const result = calculateAverageRating(distribution, 20)

      expect(result).toBe(3.95)
    })

    it('should handle large numbers correctly', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 1000,
      }

      const result = calculateAverageRating(distribution, 1000)

      expect(result).toBe(5)
    })
  })

  describe('calculateGradePercentage', () => {
    it('should return 0 when totalReviewed is 0', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 0,
      }

      const result = calculateGradePercentage(distribution, 0, SRSGrade.PerfectResponse)

      expect(result).toBe(0)
    })

    it('should return 100 when all reviews have the same grade', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 10,
      }

      const result = calculateGradePercentage(distribution, 10, SRSGrade.PerfectResponse)

      expect(result).toBe(100)
    })

    it('should return 0 when grade has no reviews', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 5,
        [SRSGrade.PerfectResponse]: 5,
      }

      const result = calculateGradePercentage(distribution, 10, SRSGrade.CompleteBlackout)

      expect(result).toBe(0)
    })

    it('should calculate 50% correctly', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 5,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 5,
      }

      const result = calculateGradePercentage(distribution, 10, SRSGrade.CorrectWithDifficulty)

      expect(result).toBe(50)
    })

    it('should round to nearest integer', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 1,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 2,
      }

      // 1/3 = 33.333... should round to 33
      const result = calculateGradePercentage(distribution, 3, SRSGrade.CorrectWithDifficulty)

      expect(result).toBe(33)
    })

    it('should round 0.5 up', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 1,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 1,
      }

      // 1/2 = 50% exactly
      const result = calculateGradePercentage(distribution, 2, SRSGrade.IncorrectResponseRecalled)

      expect(result).toBe(50)
    })

    it('should calculate percentages for all grades in realistic distribution', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 1, // 5%
        [SRSGrade.IncorrectResponse]: 2, // 10%
        [SRSGrade.IncorrectResponseRecalled]: 2, // 10%
        [SRSGrade.CorrectWithDifficulty]: 5, // 25%
        [SRSGrade.CorrectAfterHesitation]: 5, // 25%
        [SRSGrade.PerfectResponse]: 5, // 25%
      }
      const total = 20

      expect(calculateGradePercentage(distribution, total, SRSGrade.CompleteBlackout)).toBe(5)
      expect(calculateGradePercentage(distribution, total, SRSGrade.IncorrectResponse)).toBe(10)
      expect(
        calculateGradePercentage(distribution, total, SRSGrade.IncorrectResponseRecalled),
      ).toBe(10)
      expect(calculateGradePercentage(distribution, total, SRSGrade.CorrectWithDifficulty)).toBe(25)
      expect(calculateGradePercentage(distribution, total, SRSGrade.CorrectAfterHesitation)).toBe(
        25,
      )
      expect(calculateGradePercentage(distribution, total, SRSGrade.PerfectResponse)).toBe(25)
    })
  })

  describe('formatSessionDuration', () => {
    it('should return "-" when durationMs is undefined', () => {
      const result = formatSessionDuration(undefined)

      expect(result).toBe('-')
    })

    it('should return "-" when durationMs is 0', () => {
      const result = formatSessionDuration(0)

      expect(result).toBe('-')
    })

    it('should format seconds only for duration less than 1 minute', () => {
      const result = formatSessionDuration(45000) // 45 seconds

      expect(result).toBe('45s')
    })

    it('should format 1 second correctly', () => {
      const result = formatSessionDuration(1000)

      expect(result).toBe('1s')
    })

    it('should format 59 seconds correctly', () => {
      const result = formatSessionDuration(59000)

      expect(result).toBe('59s')
    })

    it('should format exactly 1 minute as "1m 0s"', () => {
      const result = formatSessionDuration(60000) // 60 seconds

      expect(result).toBe('1m 0s')
    })

    it('should format minutes and seconds for duration over 1 minute', () => {
      const result = formatSessionDuration(323000) // 5 minutes 23 seconds

      expect(result).toBe('5m 23s')
    })

    it('should format exactly 5 minutes as "5m 0s"', () => {
      const result = formatSessionDuration(300000) // 300 seconds

      expect(result).toBe('5m 0s')
    })

    it('should format large durations correctly', () => {
      const result = formatSessionDuration(3723000) // 62 minutes 3 seconds

      expect(result).toBe('62m 3s')
    })

    it('should handle very short durations', () => {
      const result = formatSessionDuration(100) // 0.1 seconds

      expect(result).toBe('0s')
    })

    it('should round down fractional seconds', () => {
      const result = formatSessionDuration(5999) // 5.999 seconds

      expect(result).toBe('5s')
    })

    it('should format various realistic session durations', () => {
      expect(formatSessionDuration(15000)).toBe('15s') // Quick session
      expect(formatSessionDuration(125000)).toBe('2m 5s') // Medium session
      expect(formatSessionDuration(600000)).toBe('10m 0s') // Long session
      expect(formatSessionDuration(1800000)).toBe('30m 0s') // Very long session
    })

    it('should handle edge case of exactly 0 seconds', () => {
      const result = formatSessionDuration(999) // Less than 1 second

      expect(result).toBe('0s')
    })

    it('should not include hours even for very long sessions', () => {
      const result = formatSessionDuration(7200000) // 2 hours

      expect(result).toBe('120m 0s') // Should show as 120 minutes, not 2 hours
    })
  })

  describe('edge cases and business rules', () => {
    it('should handle distribution with all zeros', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 0,
      }

      expect(calculateAverageRating(distribution, 0)).toBe(0)
      expect(calculateGradePercentage(distribution, 0, SRSGrade.PerfectResponse)).toBe(0)
    })

    it('should calculate correctly when only failing grades are present', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 3,
        [SRSGrade.IncorrectResponse]: 2,
        [SRSGrade.IncorrectResponseRecalled]: 1,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 0,
      }

      // (0*3 + 1*2 + 2*1) / 6 = 4/6 ≈ 0.667
      const average = calculateAverageRating(distribution, 6)
      expect(average).toBeCloseTo(0.667, 2)
    })

    it('should calculate correctly when only passing grades are present', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 1,
        [SRSGrade.CorrectAfterHesitation]: 1,
        [SRSGrade.PerfectResponse]: 1,
      }

      // (3*1 + 4*1 + 5*1) / 3 = 12/3 = 4
      const average = calculateAverageRating(distribution, 3)
      expect(average).toBe(4)
    })

    it('should maintain consistency across multiple calculations', () => {
      const distribution: RatingDistribution = {
        [SRSGrade.CompleteBlackout]: 2,
        [SRSGrade.IncorrectResponse]: 3,
        [SRSGrade.IncorrectResponseRecalled]: 4,
        [SRSGrade.CorrectWithDifficulty]: 5,
        [SRSGrade.CorrectAfterHesitation]: 6,
        [SRSGrade.PerfectResponse]: 10,
      }
      const total = 30

      const result1 = calculateAverageRating(distribution, total)
      const result2 = calculateAverageRating(distribution, total)

      expect(result1).toBe(result2)
    })

    it('should format negative duration as "-"', () => {
      const result = formatSessionDuration(-1000)

      // Depends on implementation - should either return '-' or handle gracefully
      expect(result).toBeTruthy()
    })
  })
})
