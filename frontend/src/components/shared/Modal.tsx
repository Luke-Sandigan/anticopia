import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalLogic } from './Modal.logic'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  titleId?: string
}

export function Modal({ open, onClose, title, children, titleId }: ModalProps) {
  const { generatedTitleId, dialogRef, handleBackdropMouseDown } = useModalLogic(open, onClose)
  const headingId = titleId ?? generatedTitleId

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#102d4b]/60 p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="w-full max-w-[560px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(16,45,75,0.24)] outline-none"
      >
        <h2 id={headingId} className="text-xl font-bold tracking-[-0.03em] text-[#102d4b]">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}
