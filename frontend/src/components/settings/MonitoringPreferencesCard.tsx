import { useState } from 'react'
import { initialMonitoringPrefs, type MonitoringPrefs } from '../../data/teacherSettings'
import { CheckboxField } from './CheckboxField'
import { SettingsCard } from './SettingsCard'

export function MonitoringPreferencesCard() {
  const [preferences, setPreferences] = useState<MonitoringPrefs>(initialMonitoringPrefs)
  const [notice, setNotice] = useState('')

  function updatePreference(key: keyof MonitoringPrefs, checked: boolean) {
    setPreferences((current) => ({ ...current, [key]: checked }))
    setNotice('Preferences saved.')
    // TODO: call API to save monitoring preferences.
  }

  return (
    <SettingsCard title="Monitoring preferences">
      <div className="space-y-4">
        <CheckboxField id="sound-on-alert" label="Sound on new alert" checked={preferences.soundOnAlert} onChange={(checked) => updatePreference('soundOnAlert', checked)} />
        <CheckboxField id="group-repeated-events" label="Group repeated events" checked={preferences.groupRepeatedEvents} onChange={(checked) => updatePreference('groupRepeatedEvents', checked)} />
        <p className="pt-1 text-xs text-[#5f7690]">Some options are set by school policy.</p>
        {notice && <p role="status" className="text-sm text-[#376b4e]">{notice}</p>}
      </div>
    </SettingsCard>
  )
}
