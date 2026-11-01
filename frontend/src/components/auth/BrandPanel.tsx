export function BrandPanel() {
  return (
    <aside className="brand-panel relative flex min-h-[420px] flex-col justify-between bg-white px-8 py-8 sm:px-12 sm:py-10 lg:min-h-screen lg:px-12 lg:py-11">
      <a className="brand-lockup inline-flex w-fit items-center gap-3" href="/signin" aria-label="Anticopia home">
        <img src="/shield-check.svg" className="h-8 w-8" alt="" />
        <span className="text-[21px] font-bold tracking-[-0.04em] text-[#102d4b]">Anticopia</span>
      </a>
      <div className="brand-copy max-w-[440px]">
        <h1 className="max-w-[390px] text-[38px] font-bold leading-[1.16] tracking-[-0.045em] text-[#102d4b] sm:text-[44px]">Fair exams, with proof when it matters.</h1>
        <p className="mt-5 max-w-[410px] text-[16px] leading-[1.55] text-[#667d96]">Teachers see tab switches, copy and paste, and fullscreen exits as they happen. Students get a clear, simple exam room.</p>
      </div>
      <p className="text-[14px] text-[#667d96]">Activity detection runs only inside the exam page.</p>
    </aside>
  )
}
