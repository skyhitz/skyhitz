import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found | Skyhitz',
  description: 'The page you are looking for could not be found.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-[--text-color]">404</h1>
      <h2 className="mb-6 text-2xl font-semibold text-[--text-color]">Page Not Found</h2>
      <p className="mb-8 max-w-md text-[--text-secondary-color]">
        The page you are looking for might have been removed, had its name changed, or is
        temporarily unavailable.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Go Home
        </Link>
        <Link
          href="/search"
          className="rounded-lg border border-[--border-color] px-6 py-3 font-medium text-[--text-color] transition-colors hover:bg-[--hover-bg-color]"
        >
          Browse Music
        </Link>
      </div>
    </div>
  )
}

