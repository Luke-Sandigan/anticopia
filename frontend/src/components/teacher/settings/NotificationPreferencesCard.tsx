import { CheckboxField } from './CheckboxField'
import { SettingsCard } from './SettingsCard'
import { useNotificationPreferencesCardLogic } from './NotificationPreferencesCard.logic'

export function NotificationPreferencesCard() {
  const { preferences, notice, updatePreference } = useNotificationPreferencesCardLogic()

  return (
    <SettingsCard title="Notifications">
      <div className="space-y-4">
        <CheckboxField id="exam-updates-email" label="Email me about exam updates" checked={preferences.examUpdatesEmail} onChange={(checked) => updatePreference('examUpdatesEmail', checked)} />
        <CheckboxField id="flagged-event-alerts" label="Alert me about flagged events" checked={preferences.flaggedEventAlerts} onChange={(checked) => updatePreference('flaggedEventAlerts', checked)} />
        {notice && <p role="status" className="pt-1 text-sm text-[#376b4e]">{notice}</p>}
      </div>
    </SettingsCard>
  )
}
