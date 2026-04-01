import Link from 'next/link'

export default function CompanyNotFound() {
  return (
    <main className="h-screen flex flex-col items-center justify-center bg-gray-950 gap-4 text-center px-8">
      <h1 className="text-white text-2xl font-display">Company not found</h1>
      <p className="text-white/40 text-sm max-w-sm leading-relaxed">
        This company record was not found. This can happen if the server restarted since the company was added.
        Go back to the space and re-add it, then click Full Research.
      </p>
      <Link
        href="/"
        className="mt-4 px-5 py-2 rounded-full text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors"
      >
        Back to Deal Flow
      </Link>
    </main>
  )
}
