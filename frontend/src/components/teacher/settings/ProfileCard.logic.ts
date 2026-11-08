import { useState, type FormEvent } from 'react'
import type { Profile } from '../../../data/teacherSettings'

type ProfileErrors = Partial<Record<keyof Profile, string>>

export function useProfileCardLogic(initialProfile: Profile) {
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

  return { profile, errors, notice, saving, updateField, saveProfile }
}
