import type { ButtonHTMLAttributes } from 'react'

type SharedButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function PrimaryButton({ className = '', ...props }: SharedButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 items-center justify-center rounded-xl bg-[#2d76bf] px-5 text-sm font-semibold text-white transition hover:bg-[#2367ac] focus:outline-none focus:ring-4 focus:ring-[#2d76bf]/25 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  )
}

export function SecondaryButton({ className = '', ...props }: SharedButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 items-center justify-center rounded-xl border border-[#d5e0ec] bg-white px-5 text-sm font-medium text-[#102d4b] transition hover:bg-[#f4f8fc] focus:outline-none focus:ring-4 focus:ring-[#2d76bf]/25 ${className}`}
    />
  )
}
