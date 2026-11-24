export type AccountRole = 'teacher' | 'student'
type RoleTabsProps = { role: AccountRole; onChange: (role: AccountRole) => void }

export function RoleTabs({ role, onChange }: RoleTabsProps) {
  return (
    <div className="grid grid-cols-2 rounded-xl border border-[#d5e0ec] bg-[#f4f8fc] p-1" aria-label="Account type">
      {(['teacher', 'student'] as const).map((option) => (
        <button key={option} type="button" onClick={() => onChange(option)} aria-pressed={role === option} className={`h-10 rounded-[9px] text-[15px] font-semibold capitalize transition-colors ${role === option ? 'bg-[#2d76bf] text-white shadow-sm' : 'text-[#5f7690] hover:text-[#102d4b]'}`}>{option}</button>
      ))}
    </div>
  )
}
