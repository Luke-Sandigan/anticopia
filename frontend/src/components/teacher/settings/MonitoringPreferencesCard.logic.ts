import { useState } from 'react'
import { initialMonitoringPrefs, type MonitoringPrefs } from '../../../data/teacherSettings'

export function useMonitoringPreferencesCardLogic() {
  const [preferences, setPreferences] = useState<MonitoringPrefs>(initialMonitoringPrefs)
  const [notice, setNotice] = useState('')

  function updatePreference(key: keyof MonitoringPrefs, checked: boolean) {
    setPreferences((current) => ({ ...current, [key]: checked }))
    setNotice('Preferences saved.')
    // TODO: call API to save monitoring preferences.
  }

  return { preferences, notice, updatePreference }
}
