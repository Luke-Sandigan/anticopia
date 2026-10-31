import { AuthField } from '../../auth/AuthField'
export function TeacherRegistrationFields() {
  return <>
    <AuthField label="First name" name="firstName" autoComplete="given-name" required />
    <AuthField label="Last name" name="lastName" autoComplete="family-name" required />
    <AuthField label="School email" name="email" type="email" autoComplete="email" required />
    <AuthField label="Faculty / employee ID" name="employeeId" required />
    <label htmlFor="department" className="auth-field block text-[14px] font-medium text-[#102d4b]"><span className="mb-2 block">Department</span><select id="department" name="department" defaultValue="Information Technology" className="h-12 w-full rounded-xl border border-[#d2deeb] bg-[#f5f8fb] px-4 text-[15px] text-[#102d4b] outline-none focus:border-[#2d76bf] focus:ring-2 focus:ring-[#2d76bf]/15"><option>Information Technology</option><option>Arts and Humanities</option><option>Business</option><option>Education</option><option>Engineering</option><option>Science</option><option>Other</option></select></label>
    <AuthField label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} />
  </>
}
