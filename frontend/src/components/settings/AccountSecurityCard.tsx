import { initialAccountSecurity } from '../../data/teacherSettings'
import { StatusBadge } from '../grading/StatusBadge'
import { SettingsCard } from './SettingsCard'

export function AccountSecurityCard() {
  return (
    <SettingsCard title="Account security">
      <div className="space-y-3 text-sm text-[#5f7690]">
        <p>Last sign in: {initialAccountSecurity.lastSignIn}</p>
        <p className="flex flex-wrap items-center gap-2">
          <span>Two-step sign in:</span>
          <StatusBadge label={initialAccountSecurity.twoStepEnabled ? 'On' : 'Off'} tone={initialAccountSecurity.twoStepEnabled ? 'graded' : 'in_progress'} />
        </p>
      </div>
    </SettingsCard>
  )
}
