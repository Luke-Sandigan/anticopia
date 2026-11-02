import { useEffect, useState } from 'react'
import type { DistributionBucket } from '../../pages/teacher/reports/mockReportsData'

type DistributionChartProps = {
  buckets: DistributionBucket[]
}

export function DistributionChart({ buckets }: DistributionChartProps) {
  const [animated, setAnimated] = useState(false)
  const maxCount = Math.max(0, ...buckets.map((bucket) => bucket.count))

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimated(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const summary = buckets.map(({ label, count }) => `${label}: ${count}`).join(', ')

  return (
    <div
      role="img"
      aria-label={`Score distribution by bucket, students: ${summary}`}
      className="flex h-[190px] items-end gap-4"
    >
      {buckets.map((bucket) => {
        const heightPercent = maxCount === 0 ? 0 : (bucket.count / maxCount) * 100
        return (
          <div key={bucket.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <div className="flex h-[150px] w-full items-end">
              <div
                title={`${bucket.label}: ${bucket.count} students`}
                aria-label={`${bucket.label}: ${bucket.count} students`}
                className="w-full rounded-t-md bg-[#2d76bf] motion-safe:transition-[height] motion-safe:duration-700 motion-reduce:transition-none"
                style={{ height: animated ? `${heightPercent}%` : '0%' }}
              />
            </div>
            <span className="mt-3 text-xs text-[#5f7690]">{bucket.label}</span>
          </div>
        )
      })}
    </div>
  )
}
