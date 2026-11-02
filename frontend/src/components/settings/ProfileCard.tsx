import { useState, type FormEvent } from 'react'
import { PrimaryButton } from '../ui/Buttons'
import { SettingsCard } from './SettingsCard'
import type { Profile } from '../../data/teacherSettings'

type ProfileCardProps = {
  initialProfile: Profile
}

type ProfileErrors = Partial<Record<keyof Profile, string>>

const fieldClass = 'h-12 w-full rounded-xl border border-[#d5e0ec] bg-[#f4f8fc] px-4 text-sm text-[#102d4b] outline-none focus:border-[#2d76bf] focus:ring-4 focus:ring-[#2d76bf]/25'
const labelClass = 'mb-2 block text-sm font-medium text-[#102d4b]'

export function ProfileCard({ initialProfile }: ProfileCardProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  function updateField(field: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setNotice('')
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: ProfileErrors = {}
    if (!profile.firstName.trim()) nextErrors.firstName = 'Enter your first name.'
    if (!profile.lastName.trim()) nextErrors.lastName = 'Enter your last name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) nextErrors.email = 'Enter a valid school email.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      setNotice('Profile updated.')
      // TODO: call API to save the profile.
    }, 500)
  }

  return (
    <SettingsCard title="Profile">
      <form className="space-y-4" noValidate onSubmit={saveProfile}>
        <div>
          <label htmlFor="profile-first-name" className={labelClass}>First name</label>
          <input id="profile-first-name" value={profile.firstName} autoComplete="given-name" aria-describedby={errors.firstName ? 'profile-first-name-error' : undefined} aria-invalid={Boolean(errors.firstName)} onChange={(event) => updateField('firstName', event.target.value)} className={fieldClass} />
          {errors.firstName && <p id="profile-first-name-error" role="alert" className="mt-1 text-sm text-[#b3261e]">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="profile-last-name" className={labelClass}>Last name</label>
          <input id="profile-last-name" value={profile.lastName} autoComplete="family-name" aria-describedby={errors.lastName ? 'profile-last-name-error' : undefined} aria-invalid={Boolean(errors.lastName)} onChange={(event) => updateField('lastName', event.target.value)} className={fieldClass} />
          {errors.lastName && <p id="profile-last-name-error" role="alert" className="mt-1 text-sm text-[#b3261e]">{errors.lastName}</p>}
        </div>
        <div>
          <label htmlFor="profile-email" className={labelClass}>School email</label>
          <input id="profile-email" type="email" value={profile.email} autoComplete="email" aria-describedby={errors.email ? 'profile-email-error' : undefined} aria-invalid={Boolean(errors.email)} onChange={(event) => updateField('email', event.target.value)} className={fieldClass} />
          {errors.email && <p id="profile-email-error" role="alert" className="mt-1 text-sm text-[#b3261e]">{errors.email}</p>}
        </div>
        <PrimaryButton type="submit" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Save changes'}</PrimaryButton>
        {notice && <p role="status" className="text-sm text-[#376b4e]">{notice}</p>}
      </form>
    </SettingsCard>
  )
}
