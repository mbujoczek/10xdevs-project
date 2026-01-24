export interface GenerationAcceptanceResponse {
  totalCandidates: number
  acceptedWithoutEditing: number
  acceptedAfterEditing: number
  rejected: number
  acceptanceRate: number
  pureAcceptanceRate: number
  meetsSuccessMetric: boolean
  targetRate: number
}
