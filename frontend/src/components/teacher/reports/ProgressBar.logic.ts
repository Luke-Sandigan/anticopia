import { useEffect, useState } from 'react'

export function useProgressBarLogic(percent: number) {
  const boundedPercent = Math.min(100, Math.max(0, percent))
  const [animatedPercent, setAnimatedPercent] = useState(0)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimatedPercent(boundedPercent))
    return () => window.cancelAnimationFrame(frame)
  }, [boundedPercent])

  return { boundedPercent, animatedPercent }
}
