import { Link } from 'react-router-dom'
import { AuthField } from '../../components/auth/AuthField'
import { AuthShell } from '../../components/auth/AuthShell'
import { RoleTabs } from '../../components/auth/RoleTabs'
import { useSignInPageLogic } from './SignInPage.logic'
export function SignInPage() {
  const { role, setRole, handleSubmit } = useSignInPageLogic()
  return <AuthShell>
    <h2 className="mb-6 text-[21px] font-bold tracking-[-0.025em] text-[#102d4b]">Sign in</h2>
    <form onSubmit={handleSubmit} className="space-y-5">
      <RoleTabs role={role} onChange={setRole} />
      <AuthField label="School email" type="text" inputMode="email" name="email" autoComplete="email" required />
      <AuthField label="Password" type="password" name="password" autoComplete="current-password" required />
      <button type="submit" className="h-12 w-full rounded-xl bg-[#2d76bf] text-[15px] font-semibold text-white transition hover:bg-[#2367ac] focus:outline-none focus:ring-4 focus:ring-[#2d76bf]/25">Sign in</button>
    </form>
    <p className="mt-7 text-center text-[15px] text-[#102d4b]">New here? <Link className="font-semibold text-[#246db4] hover:underline" to={`/signup/${role}`}>Create an account</Link></p>
  </AuthShell>
}
