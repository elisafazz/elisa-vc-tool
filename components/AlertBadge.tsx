export default function AlertBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-semibold">
      {count}
    </span>
  )
}
