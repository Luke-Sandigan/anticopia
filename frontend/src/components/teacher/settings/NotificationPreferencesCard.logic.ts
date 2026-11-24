import { useState } from 'react'
import { initialNotificationPrefs, type NotificationPrefs } from '../../../data/teacherSettings'

export function useNotificationPreferencesCardLogic() {
  const [preferences, setPreferences] = useState<NotificationPrefs>(initialNotificationPrefs)
  const [notice, setNotice] = useState('')

  function updatePreference(key: keyof NotificationPrefs, checked: boolean) {
    setPreferences((current) => ({ ...current, [key]: checked }))
    setNotice('Preferences saved.')
    // TODO: call API to save notification preferences.
  }

  return { preferences, notice, updatePreference }
}
