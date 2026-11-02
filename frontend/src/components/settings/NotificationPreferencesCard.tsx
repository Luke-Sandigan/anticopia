import { useState } from 'react'
import { initialNotificationPrefs, type NotificationPrefs } from '../../data/teacherSettings'
import { CheckboxField } from './CheckboxField'
import { SettingsCard } from './SettingsCard'

export function NotificationPreferencesCard() {
  const [preferences, setPreferences] = useState<NotificationPrefs>(initialNotificationPrefs)
  const [notice, setNotice] = useState('')

  function updatePreference(key: keyof NotificationPrefs, checked: boolean) {
    setPreferences((current) => ({ ...current, [key]: checked }))
    setNotice('Preferences saved.')
    // TODO: call API to save notification preferences.
  }

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
