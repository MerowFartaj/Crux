'use client'

import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function DownloadPage() {
  return (
    <main className="relative">
      <Navigation />

      <section className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-display mb-6"
          >
            Download CRUX
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-crux-caption mb-12"
          >
            Free, open source, and ready in seconds.
          </motion.p>

          {/* macOS download */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-crux-border/60 bg-crux-surface/40 p-8 md:p-10 mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <svg className="w-8 h-8 text-crux-text" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="text-lg font-medium text-crux-text">macOS</span>
            </div>

            <a
              href="#"
              className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-crux-accent to-crux-purple text-white font-medium overflow-hidden transition-all duration-300 hover:shadow-[0_0_60px_-12px_rgba(59,130,246,0.6)] hover:scale-[1.02] mb-6"
            >
              <span className="relative z-10">Download .dmg</span>
              <svg className="relative z-10 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-crux-purple to-crux-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>

            <div className="space-y-2 text-sm text-crux-muted">
              <p>Version 1.0.0 &middot; macOS 12+</p>
              <p>Apple Silicon &amp; Intel (Universal Binary)</p>
            </div>
          </motion.div>

          {/* Installation steps */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-left rounded-2xl border border-crux-border/40 bg-crux-surface/20 p-8 mb-8"
          >
            <h3 className="text-base font-medium text-crux-text mb-4">Installation</h3>
            <ol className="space-y-3 text-sm text-crux-caption">
              <li className="flex gap-3">
                <span className="text-crux-accent font-mono shrink-0">1.</span>
                Download the .dmg file above
              </li>
              <li className="flex gap-3">
                <span className="text-crux-accent font-mono shrink-0">2.</span>
                Open the .dmg and drag CRUX to Applications
              </li>
              <li className="flex gap-3">
                <span className="text-crux-accent font-mono shrink-0">3.</span>
                Launch CRUX and follow the onboarding wizard
              </li>
            </ol>
          </motion.div>

          {/* Coming soon */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-crux-border/30 text-sm text-crux-muted">
              <span>Linux</span>
              <span className="px-2 py-0.5 rounded-full bg-crux-border/30 text-xs">Coming soon</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-crux-border/30 text-sm text-crux-muted">
              <span>Windows</span>
              <span className="px-2 py-0.5 rounded-full bg-crux-border/30 text-xs">Coming soon</span>
            </div>
          </motion.div>

          {/* GitHub link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-sm text-crux-muted"
          >
            Looking for older versions?{' '}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-crux-accent hover:underline">
              View all releases on GitHub
            </a>
          </motion.p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
