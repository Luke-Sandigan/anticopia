import type { InputHTMLAttributes } from 'react'
type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string }
export function AuthField({ label, id, ...inputProps }: AuthFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return <label htmlFor={fieldId} className="auth-field block text-[14px] font-medium text-[#102d4b]"><span className="mb-2 block">{label}</span><input id={fieldId} className="h-12 w-full rounded-xl border border-[#d2deeb] bg-[#f5f8fb] px-4 text-[15px] text-[#102d4b] outline-none transition focus:border-[#2d76bf] focus:ring-2 focus:ring-[#2d76bf]/15" {...inputProps} /></label>
}
