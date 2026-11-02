import type { CategoryKey, GradeWeights } from '../../lib/gradebook'

const categories: Array<{ key: CategoryKey; label: string }> = [
  { key: 'quiz1', label: 'Quiz 1' },
  { key: 'quiz2', label: 'Quiz 2' },
  { key: 'midterm', label: 'Midterm' },
  { key: 'final', label: 'Final' },
]

type CategoryWeightsProps = {
  inputValues: Record<CategoryKey, string>
  weights: GradeWeights
  onChange: (category: CategoryKey, value: string) => void
}

export function CategoryWeights({ inputValues, weights, onChange }: CategoryWeightsProps) {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
  const hasInvalidWeight = categories.some(({ key }) => !Number.isFinite(weights[key]) || weights[key] < 0 || weights[key] > 100)
  const isValid = total === 100 && !hasInvalidWeight

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-4">
        {categories.map(({ key, label }) => (
          <div className="w-full max-w-[170px]" key={key}>
            <label htmlFor={`weight-${key}`} className="mb-2 block text-sm font-medium text-[#102d4b]">
              {label} (%)
            </label>
            <input
              id={`weight-${key}`}
              type="number"
              min={0}
              max={100}
              step={1}
              value={inputValues[key]}
              aria-describedby="weights-total"
              onChange={(event) => onChange(key, event.target.value)}
              className="h-14 w-full rounded-xl border border-[#d5e0ec] bg-[#f4f8fc] px-4 text-base tabular-nums text-[#102d4b] outline-none focus:border-[#2d76bf] focus:ring-4 focus:ring-[#2d76bf]/15"
            />
          </div>
        ))}
      </div>
      <p
        id="weights-total"
        role={isValid ? undefined : 'alert'}
        className={`mt-4 text-sm ${isValid ? 'text-[#5f7690]' : 'text-[#b3261e]'}`}
      >
        {hasInvalidWeight ? 'Each weight must be between 0 and 100.' : `Total: ${total}%${isValid ? '' : ' — weights should total 100%.'}`}
      </p>
    </div>
  )
}
