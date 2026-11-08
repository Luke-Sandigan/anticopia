import { SecondaryButton } from '../../shared/Buttons'
import { SettingsCard } from './SettingsCard'
import { useChangePasswordCardLogic } from './ChangePasswordCard.logic'

const inputClass = 'h-12 w-full rounded-xl border border-[#d5e0ec] bg-[#f4f8fc] px-4 text-sm text-[#102d4b] outline-none focus:border-[#2d76bf] focus:ring-4 focus:ring-[#2d76bf]/25'

export function ChangePasswordCard() {
  const { currentPassword, newPassword, errors, notice, updatePassword, handleCurrentPasswordChange, handleNewPasswordChange } = useChangePasswordCardLogic()

  return (
    <SettingsCard title="Change password">
      <form className="space-y-4" noValidate onSubmit={updatePassword}>
        <div>
          <label htmlFor="current-password" className="mb-2 block text-sm font-medium text-[#102d4b]">Current password</label>
          <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} aria-describedby={errors.currentPassword ? 'current-password-error' : undefined} aria-invalid={Boolean(errors.currentPassword)} onChange={(event) => handleCurrentPasswordChange(event.target.value)} className={inputClass} />
          {errors.currentPassword && <p id="current-password-error" role="alert" className="mt-1 text-sm text-[#b3261e]">{errors.currentPassword}</p>}
        </div>
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-[#102d4b]">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" value={newPassword} aria-describedby={errors.newPassword ? 'new-password-error' : undefined} aria-invalid={Boolean(errors.newPassword)} onChange={(event) => handleNewPasswordChange(event.target.value)} className={inputClass} />
          {errors.newPassword && <p id="new-password-error" role="alert" className="mt-1 text-sm text-[#b3261e]">{errors.newPassword}</p>}
        </div>
        <SecondaryButton type="submit" className="h-12 w-full">Update password</SecondaryButton>
        {notice && <p role="status" className="text-sm text-[#376b4e]">{notice}</p>}
      </form>
    </SettingsCard>
  )
}
