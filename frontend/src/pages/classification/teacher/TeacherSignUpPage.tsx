import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '../../../components/auth/AuthShell'
import { TeacherRegistrationFields } from '../../../components/classification/teacher/TeacherRegistrationFields'
export function TeacherSignUpPage() {
  const [notice, setNotice] = useState('')
  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setNotice('Your teacher account details are ready to submit.') }
  return <AuthShell>
    <h2 className="mb-5 text-[20px] font-bold tracking-[-0.025em] text-[#102d4b]">Create a teacher account</h2>
    <div className="role-switch mb-5 grid grid-cols-2 rounded-xl border border-[#d5e0ec] bg-[#f4f8fc] p-1"><span className="flex h-9 items-center justify-center rounded-[9px] bg-[#2d76bf] text-sm font-semibold text-white">Teacher</span><Link to="/signup/student" className="flex h-9 items-center justify-center rounded-[9px] text-sm font-medium text-[#5f7690] hover:text-[#102d4b]">Student</Link></div>
    <form onSubmit={handleSubmit} className="space-y-4"><TeacherRegistrationFields /><button type="submit" className="mt-1 h-12 w-full rounded-xl bg-[#2d76bf] text-[15px] font-semibold text-white transition hover:bg-[#2367ac] focus:outline-none focus:ring-4 focus:ring-[#2d76bf]/25">Create account</button></form>
    {notice && <p role="status" className="mt-3 text-center text-sm text-[#376b4e]">{notice}</p>}
    <p className="mt-5 text-center text-[14px] text-[#102d4b]">Have an account? <Link className="font-semibold text-[#246db4] hover:underline" to="/signin">Sign in</Link></p>
  </AuthShell>
}
