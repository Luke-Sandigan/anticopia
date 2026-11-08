type CheckboxFieldProps = {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  lockedByPolicy?: boolean
}

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  lockedByPolicy = false,
}: CheckboxFieldProps) {
  const isDisabled = disabled || lockedByPolicy

  return (
    <label htmlFor={id} className={`flex min-h-8 cursor-pointer items-center gap-3 text-sm text-[#102d4b] ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={isDisabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#b8c8d9] bg-white text-white peer-checked:border-[#2d76bf] peer-checked:bg-[#2d76bf] peer-focus-visible:ring-4 peer-focus-visible:ring-[#2d76bf]/25 peer-disabled:opacity-60"
      >
        {checked && (
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
            <path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>{label}</span>
    </label>
  )
}
