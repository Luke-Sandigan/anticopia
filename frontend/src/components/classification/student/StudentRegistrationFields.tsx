import { AuthField } from '../../auth/AuthField'
export function StudentRegistrationFields() {
  return <>
    <AuthField label="First name" name="firstName" autoComplete="given-name" required />
    <AuthField label="Last name" name="lastName" autoComplete="family-name" required />
    <AuthField label="School email" name="email" type="email" autoComplete="email" required />
    <AuthField label="Student ID" name="studentId" required />
    <AuthField label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} />
  </>
}
