import { CheckboxField } from './CheckboxField'
import { SettingsCard } from './SettingsCard'
import { useMonitoringPreferencesCardLogic } from './MonitoringPreferencesCard.logic'

export function MonitoringPreferencesCard() {
  const { preferences, notice, updatePreference } = useMonitoringPreferencesCardLogic()

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
