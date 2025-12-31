export enum FlashcardSource {
  AI = 0,
  Manual = 1,
}

export enum FlashcardStatus {
  NotApplicable = 0,
  Accepted = 1,
  Edited = 2,
  Deleted = 3,
}

export enum SRSGrade {
  CompleteBlackout = 0,
  IncorrectResponse = 1,
  IncorrectResponseRecalled = 2,
  CorrectWithDifficulty = 3,
  CorrectAfterHesitation = 4,
  PerfectResponse = 5,
}
