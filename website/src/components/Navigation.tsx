'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#features', label: 'Features' },
    { href: '/download', label: 'Download' },
    { href: '/changelog', label: 'Changelog' },
    { href: 'https://github.com', label: 'GitHub', external: true },
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-crux-bg/80 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-crux-text">
          CRUX
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-crux-caption hover:text-crux-text transition-colors duration-200"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-crux-caption hover:text-crux-text transition-colors duration-200"
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden relative w-6 h-5 flex flex-col justify-between"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-full h-px bg-crux-text transition-all duration-300 origin-center ${
              mobileOpen ? 'rotate-45 translate-y-[9px]' : ''
            }`}
          />
          <span
            className={`block w-full h-px bg-crux-text transition-all duration-300 ${
              mobileOpen ? 'opacity-0 scale-x-0' : ''
            }`}
          />
          <span
            className={`block w-full h-px bg-crux-text transition-all duration-300 origin-center ${
              mobileOpen ? '-rotate-45 -translate-y-[9px]' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-crux-bg/95 backdrop-blur-xl border-b border-white/[0.06] overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-crux-caption hover:text-crux-text transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
