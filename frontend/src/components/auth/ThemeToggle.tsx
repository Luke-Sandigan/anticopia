type ThemeToggleProps = { onClick: () => void; dark: boolean }
export function ThemeToggle({ onClick, dark }: ThemeToggleProps) {
  return <button type="button" onClick={onClick} aria-pressed={dark} className="theme-toggle whitespace-nowrap text-[13px] font-medium text-[#102d4b] underline-offset-4 hover:underline" aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>{dark ? 'Dark mode' : 'Light mode'}</button>
}
