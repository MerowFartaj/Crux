'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function DownloadCTA() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-crux-accent/[0.03] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-crux-accent/[0.06] rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-crux-purple/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative">
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0, 1] }}
          className="font-serif text-display mb-6"
        >
          Ready to switch?
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-crux-caption mb-12"
        >
          Free. Open source. No account required.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Link
            href="/download"
            className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-crux-accent to-crux-purple text-white font-medium overflow-hidden transition-all duration-300 hover:shadow-[0_0_60px_-12px_rgba(59,130,246,0.6)] hover:scale-[1.02]"
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
            className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full border border-crux-border text-crux-text font-medium hover:border-crux-caption/50 hover:bg-white/[0.03] transition-all duration-300"
          >
            View source on GitHub
          </a>
        </motion.div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-sm text-crux-muted"
        >
          Requires macOS 12+. Apple Silicon &amp; Intel supported.
        </motion.p>
      </div>
    </section>
  )
}
