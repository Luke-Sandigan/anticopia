import { useState, type FormEvent } from 'react'

type PasswordErrors = { currentPassword?: string; newPassword?: string }

export function useChangePasswordCardLogic() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [notice, setNotice] = useState('')

  function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: PasswordErrors = {}
    if (!currentPassword) nextErrors.currentPassword = 'Enter your current password.'
    if (!newPassword) nextErrors.newPassword = 'Enter a new password.'
    else if (newPassword.length < 8) nextErrors.newPassword = 'Use at least 8 characters.'
    else if (newPassword === currentPassword) nextErrors.newPassword = 'Choose a password different from your current one.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setCurrentPassword('')
    setNewPassword('')
    setNotice('Password updated.')
  }

  function handleCurrentPasswordChange(value: string) {
    setCurrentPassword(value)
    setErrors((current) => ({ ...current, currentPassword: undefined }))
    setNotice('')
  }

  function handleNewPasswordChange(value: string) {
    setNewPassword(value)
    setErrors((current) => ({ ...current, newPassword: undefined }))
    setNotice('')
  }

  return { currentPassword, newPassword, errors, notice, updatePassword, handleCurrentPasswordChange, handleNewPasswordChange }
}
