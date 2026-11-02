import { useState, type FormEvent } from 'react'
import { SecondaryButton } from '../ui/Buttons'
import { SettingsCard } from './SettingsCard'

type PasswordErrors = {
  currentPassword?: string
  newPassword?: string
}

const inputClass = 'h-12 w-full rounded-xl border border-[#d5e0ec] bg-[#f4f8fc] px-4 text-sm text-[#102d4b] outline-none focus:border-[#2d76bf] focus:ring-4 focus:ring-[#2d76bf]/25'

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [notice, setNotice] = useState('')

  function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: PasswordErrors = {}
    if (!currentPassword) nextErrors.currentPassword = 'Enter your current password.'
    if (!newPassword) nextErrors.newPassword = 'Enter a new password.'
    else if (newPassword.length < 8) nextErrors.newPassword = 'Use at least 8 characters.'
    else if (newPassword === currentPassword) nextErrors.newPassword = 'Choose a password different from your current one.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setCurrentPassword('')
    setNewPassword('')
    setNotice('Password updated.')
  }

  return (
    <SettingsCard title="Change password">
      <form className="space-y-4" noValidate onSubmit={updatePassword}>
        <div>
          <label htmlFor="current-password" className="mb-2 block text-sm font-medium text-[#102d4b]">Current password</label>
          <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} aria-describedby={errors.currentPassword ? 'current-password-error' : undefined} aria-invalid={Boolean(errors.currentPassword)} onChange={(event) => { setCurrentPassword(event.target.value); setErrors((current) => ({ ...current, currentPassword: undefined })); setNotice('') }} className={inputClass} />
          {errors.currentPassword && <p id="current-password-error" role="alert" className="mt-1 text-sm text-[#b3261e]">{errors.currentPassword}</p>}
        </div>
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-[#102d4b]">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" value={newPassword} aria-describedby={errors.newPassword ? 'new-password-error' : undefined} aria-invalid={Boolean(errors.newPassword)} onChange={(event) => { setNewPassword(event.target.value); setErrors((current) => ({ ...current, newPassword: undefined })); setNotice('') }} className={inputClass} />
          {errors.newPassword && <p id="new-password-error" role="alert" className="mt-1 text-sm text-[#b3261e]">{errors.newPassword}</p>}
        </div>
        <SecondaryButton type="submit" className="h-12 w-full">Update password</SecondaryButton>
        {notice && <p role="status" className="text-sm text-[#376b4e]">{notice}</p>}
      </form>
    </SettingsCard>
  )
}
