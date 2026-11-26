import { Link } from 'react-router-dom'
import { AuthField } from '../../components/auth/AuthField'
import { AuthShell } from '../../components/auth/AuthShell'
import { RoleTabs } from '../../components/auth/RoleTabs'
import { useSignInPageLogic } from './SignInPage.logic'
export function SignInPage() {
  const { role, setRole, error, pending, justRegistered, handleSubmit } = useSignInPageLogic()
  return <AuthShell>
    <h2 className="mb-6 text-[21px] font-bold tracking-[-0.025em] text-[#102d4b]">Sign in</h2>
    {justRegistered && <p role="status" className="mb-4 text-sm text-[#376b4e]">Account created. Sign in to continue.</p>}
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset disabled={pending}>
        <RoleTabs role={role} onChange={setRole} />
      </fieldset>
      <AuthField label="School email" type="email" name="email" autoComplete="email" required />
      <AuthField label="Password" type="password" name="password" autoComplete="current-password" required />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-[#2d76bf] text-[15px] font-semibold text-white transition disabled:opacity-60 hover:bg-[#2367ac] focus:outline-none focus:ring-4 focus:ring-[#2d76bf]/25">{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="mt-7 text-center text-[15px] text-[#102d4b]">New here? <Link className="font-semibold text-[#246db4] hover:underline" to={`/signup/${role}`}>Create an account</Link></p>
  </AuthShell>
}
