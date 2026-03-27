'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 60% 50% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 60% 50% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-crux-accent/[0.06] rounded-full blur-[120px] pointer-events-none" />

      {/* Accent orb top-right */}
      <div className="absolute top-[10%] right-[15%] w-[300px] h-[300px] bg-crux-purple/[0.04] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-crux-accent font-mono text-sm tracking-[0.2em] uppercase mb-8"
        >
          CRUX Terminal
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.4, 0, 1] }}
          className="font-serif text-display mb-8"
        >
          Your terminal,
          <br />
          <span className="italic text-gradient">reimagined.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-subheadline text-crux-caption max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          GPU-accelerated. AI-native. No account required.
          <br className="hidden sm:block" />
          {' '}A modern terminal for developers who want power without lock-in.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/download"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-crux-accent to-crux-purple text-white font-medium text-sm overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] hover:scale-[1.02]"
          >
            <span className="relative z-10">Download for macOS</span>
            <svg
              className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-crux-purple to-crux-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-crux-border text-crux-text font-medium text-sm hover:border-crux-caption/50 hover:bg-white/[0.03] transition-all duration-300"
          >
            View on GitHub
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[11px] text-crux-muted tracking-[0.25em] uppercase font-mono">
          Explore
        </span>
        <motion.svg
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-4 h-4 text-crux-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 14l-7 7m0 0l-7-7"
          />
        </motion.svg>
      </motion.div>
    </section>
  )
}
