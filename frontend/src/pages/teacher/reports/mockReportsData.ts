export interface AssessmentAverage {
  id: string
  label: string
  percent: number
}

export interface DistributionBucket {
  label: string
  count: number
}

export interface Completion {
  submitted: number
  total: number
}

// TODO: call API for report data.
export const assessmentAverages: AssessmentAverage[] = [
  { id: 'quiz1', label: 'Quiz 1', percent: 82 },
  { id: 'quiz2', label: 'Quiz 2', percent: 81 },
  { id: 'midterm', label: 'Midterm', percent: 76 },
]

export const distributionBuckets: DistributionBucket[] = [
  { label: '<60', count: 2 },
  { label: '60s', count: 5 },
  { label: '70s', count: 8 },
  { label: '80s', count: 10 },
  { label: '90s', count: 5 },
]

export const completion: Completion = { submitted: 30, total: 32 }
