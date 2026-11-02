export interface Profile {
  firstName: string
  lastName: string
  email: string
}

export interface NotificationPrefs {
  examUpdatesEmail: boolean
  flaggedEventAlerts: boolean
}

export interface MonitoringPrefs {
  soundOnAlert: boolean
  groupRepeatedEvents: boolean
}

export interface AccountSecurity {
  lastSignIn: string
  twoStepEnabled: boolean
}

// TODO: call API to load and save profile and preference settings.
export const initialProfile: Profile = {
  firstName: 'Elena',
  lastName: 'Rivera',
  email: 'e.rivera@school.edu',
}

export const initialNotificationPrefs: NotificationPrefs = {
  examUpdatesEmail: true,
  flaggedEventAlerts: true,
}

export const initialMonitoringPrefs: MonitoringPrefs = {
  soundOnAlert: true,
  groupRepeatedEvents: true,
}

export const initialAccountSecurity: AccountSecurity = {
  lastSignIn: 'today, 08:41',
  twoStepEnabled: false,
}
