'use client'

import { motion } from 'framer-motion'

const shortcuts = [
  { keys: ['Cmd', 'T'], action: 'New tab' },
  { keys: ['Cmd', 'D'], action: 'Split vertical' },
  { keys: ['Cmd', 'Shift', 'D'], action: 'Split horizontal' },
  { keys: ['Cmd', 'K'], action: 'Command palette' },
  { keys: ['Opt', 'Space'], action: 'Dropdown terminal' },
  { keys: ['Cmd', 'W'], action: 'Close pane' },
  { keys: ['Cmd', ','], action: 'Settings' },
  { keys: ['Cmd', '1-9'], action: 'Switch tab' },
]

function Keycap({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2.5 bg-zinc-800/90 border border-zinc-700/70 rounded-[10px] font-mono text-xs text-crux-text shadow-[0_3px_0_0_rgba(39,39,42,0.8),0_4px_6px_-1px_rgba(0,0,0,0.3)] transition-all duration-150 select-none group-hover:shadow-[0_1px_0_0_rgba(39,39,42,0.8)] group-hover:translate-y-[2px]">
      {label}
    </span>
  )
}

export default function KeyboardShowcase() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-crux-accent/[0.03] rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-crux-accent font-mono text-xs tracking-[0.2em] uppercase block mb-4">
            Built for your hands
          </span>
          <h2 className="font-serif text-headline">
            Every action, one shortcut away.
          </h2>
        </motion.div>

        {/* Shortcut grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shortcuts.map((shortcut, index) => (
            <motion.div
              key={shortcut.action}
              initial={{ opacity: 0, y: 20, rotate: -1.5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.25, 0.4, 0, 1],
              }}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-crux-border/40 bg-crux-surface/20 hover:bg-crux-surface/50 hover:border-crux-border/80 transition-all duration-300 cursor-default"
            >
              <div className="flex gap-1.5">
                {shortcut.keys.map((key, i) => (
                  <Keycap key={i} label={key} />
                ))}
              </div>
              <span className="text-sm text-crux-muted group-hover:text-crux-caption transition-colors duration-200">
                {shortcut.action}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
