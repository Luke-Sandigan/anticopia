export type CategoryKey = 'quiz1' | 'quiz2' | 'midterm' | 'final'
export type ScoreCell = { kind: 'score'; value: number } | { kind: 'missing' } | { kind: 'excused' }
export type GradeWeights = Record<CategoryKey, number>
export type GradeScores = Record<CategoryKey, ScoreCell>

const categoryKeys: CategoryKey[] = ['quiz1', 'quiz2', 'midterm', 'final']

export function computeWeighted(scores: GradeScores, weights: GradeWeights): number | null {
  let weightedTotal = 0
  let countedWeight = 0

  for (const category of categoryKeys) {
    const cell = scores[category]
    if (cell.kind !== 'score') continue
    weightedTotal += cell.value * weights[category]
    countedWeight += weights[category]
  }

  if (countedWeight === 0) return null
  return Math.round(weightedTotal / countedWeight)
}

if (import.meta.env.DEV) {
  const weights: GradeWeights = { quiz1: 20, quiz2: 20, midterm: 30, final: 30 }
  const expectedGrades = [
    { scores: { quiz1: { kind: 'score', value: 80 }, quiz2: { kind: 'score', value: 90 }, midterm: { kind: 'score', value: 85 }, final: { kind: 'missing' } }, expected: 85 },
    { scores: { quiz1: { kind: 'score', value: 70 }, quiz2: { kind: 'excused' }, midterm: { kind: 'score', value: 74 }, final: { kind: 'missing' } }, expected: 72 },
    { scores: { quiz1: { kind: 'score', value: 92 }, quiz2: { kind: 'score', value: 88 }, midterm: { kind: 'missing' }, final: { kind: 'missing' } }, expected: 90 },
    { scores: { quiz1: { kind: 'score', value: 60 }, quiz2: { kind: 'score', value: 65 }, midterm: { kind: 'score', value: 67 }, final: { kind: 'missing' } }, expected: 64 },
    { scores: { quiz1: { kind: 'score', value: 95 }, quiz2: { kind: 'score', value: 97 }, midterm: { kind: 'score', value: 94 }, final: { kind: 'missing' } }, expected: 95 },
    { scores: { quiz1: { kind: 'missing' }, quiz2: { kind: 'score', value: 50 }, midterm: { kind: 'score', value: 58 }, final: { kind: 'missing' } }, expected: 55 },
    { scores: { quiz1: { kind: 'score', value: 85 }, quiz2: { kind: 'score', value: 80 }, midterm: { kind: 'score', value: 82 }, final: { kind: 'missing' } }, expected: 82 },
    { scores: { quiz1: { kind: 'score', value: 75 }, quiz2: { kind: 'score', value: 78 }, midterm: { kind: 'score', value: 79 }, final: { kind: 'missing' } }, expected: 78 },
  ] satisfies Array<{ scores: GradeScores; expected: number }>

  for (const [index, testCase] of expectedGrades.entries()) {
    const result = computeWeighted(testCase.scores, weights)
    if (result !== testCase.expected) {
      throw new Error(`Gradebook weighted grade assertion failed for sample ${index + 1}: expected ${testCase.expected}, got ${result}.`)
    }
  }
}
