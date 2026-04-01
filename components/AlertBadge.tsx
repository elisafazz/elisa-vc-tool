export default function AlertBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-semibold">
      {count}
    </span>
  )
}
