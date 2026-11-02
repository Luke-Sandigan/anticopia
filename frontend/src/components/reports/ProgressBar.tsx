import { useEffect, useState } from 'react'

type ProgressBarProps = {
  percent: number
  label: string
  size?: 'small' | 'medium'
}

export function ProgressBar({ percent, label, size = 'small' }: ProgressBarProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0)
  const boundedPercent = Math.min(100, Math.max(0, percent))

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimatedPercent(boundedPercent))
    return () => window.cancelAnimationFrame(frame)
  }, [boundedPercent])

  return (
    <div
      role="progressbar"
      aria-valuenow={boundedPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full overflow-hidden rounded-full bg-[#e3eaf2] ${size === 'medium' ? 'h-2.5' : 'h-2'}`}
    >
      <div
        className="h-full rounded-full bg-[#2d76bf] motion-safe:transition-[width] motion-safe:duration-700 motion-reduce:transition-none"
        style={{ width: `${animatedPercent}%` }}
      />
    </div>
  )
}
