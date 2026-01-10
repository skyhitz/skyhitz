import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Skyhitz - Archived',
  description: 'Skyhitz has been archived due to a security vulnerability.',
  robots: {
    index: false,
    follow: false,
  },
}

function SkyhitzLogo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 140 100"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid"
      className={className}
    >
      <defs>
        <linearGradient
          id="logo-gradient"
          gradientUnits="userSpaceOnUse"
          x1="69.6"
          y1="106.8"
          x2="69.6"
          y2="0"
        >
          <stop offset="-0.3" stopColor="#042c43" />
          <stop offset="-0.2" stopColor="#042c43" />
          <stop offset="0.5" stopColor="#19aafe" />
          <stop offset="1.3" stopColor="#fff" />
        </linearGradient>
      </defs>
      <path
        d="M76 67c-6 1-3-66-3-66s21 72 62 103c25 18-54-37-59-37zm-11 0c-5 0-84 55-59 37C48 73 69 1 69 1s2 67-4 66z"
        fill="url(#logo-gradient)"
      />
    </svg>
  )
}

export default function ArchivedPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[--bg-color]">
      {/* Navbar */}
      <nav className="flex w-full flex-row items-center p-3">
        <Link href="/" className="flex flex-row items-center">
          <div className="flex min-h-9 flex-row items-center">
            <SkyhitzLogo size={30} />
            <span className="font-raleway pl-4 text-base tracking-[12px] text-gray-400 sm:text-lg">
              SKYHITZ
            </span>
          </div>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl space-y-8 text-center">
          <div className="mx-auto mb-8 flex justify-center">
            <SkyhitzLogo size={80} />
          </div>

          <h1 className="font-unbounded text-center text-3xl font-bold text-[--text-color] sm:text-4xl md:text-5xl">
            Skyhitz has been archived
          </h1>

          <div className="space-y-6 pt-6">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
              <p className="text-base leading-relaxed text-red sm:text-lg">
                A vulnerability issue was exploited which compromised all of our
                HITZ supply.
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
              <p className="text-base leading-relaxed text-amber-400 sm:text-lg">
                Please avoid trading the HITZ token:{' '}
                <a
                  href="https://stellar.expert/explorer/public/asset/HITZ-GCAETBNBFKVGLYFXKCLMKT6ZVHFXHRSDFSEW7ODIUJYC6R7H2QJ6OKGU-1"
                  className="break-all underline hover:opacity-80"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  HITZ-GCAETBNBFKVGLYFXKCLMKT6ZVHFXHRSDFSEW7ODIUJYC6R7H2QJ6OKGU
                </a>
              </p>
            </div>

            <div className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
              <p className="text-base leading-relaxed text-blue-400 sm:text-lg">
                For more information about the project and what it aimed to
                achieve, visit:
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-6">
                <a
                  href="https://docs.skyhitz.io/"
                  className="text-base font-semibold text-blue-400 underline hover:opacity-80"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  docs.skyhitz.io
                </a>
                <a
                  href="https://github.com/skyhitz/skyhitz"
                  className="text-base font-semibold text-blue-400 underline hover:opacity-80"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/skyhitz/skyhitz
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-7xl px-6 pb-12 lg:px-8">
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <span className="text-sm font-semibold text-[--text-color]">Connect</span>
          <div className="flex flex-row gap-6">
            <a
              href="https://x.com/skyhitz"
              className="text-sm leading-6 text-[--text-color] hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>
            <a
              href="https://instagram.com/skyhitz"
              className="text-sm leading-6 text-[--text-color] hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href="https://discord.com/invite/2C3HzsPEuZ"
              className="text-sm leading-6 text-[--text-color] hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <SkyhitzLogo size={25} />
          <p className="text-xs text-[--text-color]">
            © 2026 Skyhitz, Inc - All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
