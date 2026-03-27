import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-crux-border/30 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left */}
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold tracking-tight text-crux-text">
            CRUX
          </span>
          <span className="text-xs text-crux-muted font-mono">
            Built by Merow
          </span>
        </div>

        {/* Center links */}
        <div className="flex items-center gap-8">
          <a
            href="https://github.com/MerowFartaj/Crux"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-crux-muted hover:text-crux-text transition-colors duration-200"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-crux-muted hover:text-crux-text transition-colors duration-200"
          >
            X / Twitter
          </a>
          <Link
            href="/changelog"
            className="text-sm text-crux-muted hover:text-crux-text transition-colors duration-200"
          >
            Changelog
          </Link>
          <Link
            href="#"
            className="text-sm text-crux-muted hover:text-crux-text transition-colors duration-200"
          >
            License
          </Link>
        </div>

        {/* Right */}
        <p className="text-xs text-crux-muted">&copy; 2026 CRUX Terminal</p>
      </div>
    </footer>
  )
}
