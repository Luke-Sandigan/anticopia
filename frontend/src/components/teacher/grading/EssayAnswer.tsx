type EssayAnswerProps = {
  text: string
}

export function EssayAnswer({ text }: EssayAnswerProps) {
  return (
    <div className="max-h-[200px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#f4f8fc] p-4 text-sm leading-6 text-[#5f7690]">
      {text}
    </div>
  )
}
