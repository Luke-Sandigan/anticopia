import { useEffect, useState } from 'react'
import type { DistributionBucket } from '../../../pages/teacher/reports/mockReportsData'

export function useDistributionChartLogic(buckets: DistributionBucket[]) {
  const [animated, setAnimated] = useState(false)
  const maxCount = Math.max(0, ...buckets.map((bucket) => bucket.count))
  const summary = buckets.map(({ label, count }) => `${label}: ${count}`).join(', ')

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimated(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  function getHeightPercent(count: number) {
    return maxCount === 0 ? 0 : (count / maxCount) * 100
  }

  return { animated, summary, getHeightPercent }
}
