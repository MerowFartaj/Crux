'use client'

import { motion } from 'framer-motion'

const lines = [
  "Terminals haven't changed in decades.",
  'The ones that did want your data,',
  'your money, or both.',
]

export default function WhyCrux() {
  return (
    <section className="section-padding">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-crux-accent font-mono text-xs tracking-[0.2em] uppercase block mb-12"
        >
          Why CRUX
        </motion.span>

        {/* Editorial quote */}
        <div className="mb-16">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.7,
                delay: i * 0.2,
                ease: [0.25, 0.4, 0, 1],
              }}
              className="font-serif text-headline text-crux-text"
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* Body text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-lg text-crux-caption leading-relaxed">
            CRUX is different. It&apos;s local-first, free, and respects your
            workflow. Bring your own API key for AI. Or don&apos;t &mdash;
            everything else works without it.
          </p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 h-px w-24 bg-gradient-to-r from-crux-accent/60 to-transparent origin-left"
          />
        </motion.div>
      </div>
    </section>
  )
}
