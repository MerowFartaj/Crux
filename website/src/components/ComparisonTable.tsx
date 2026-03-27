'use client'

import { motion } from 'framer-motion'

const terminals = ['CRUX', 'Warp', 'iTerm2', 'Ghostty'] as const

const rows: { feature: string; values: Record<(typeof terminals)[number], boolean | null> }[] = [
  { feature: 'Free',              values: { CRUX: true,  Warp: false, iTerm2: true,  Ghostty: true  } },
  { feature: 'No account needed', values: { CRUX: true,  Warp: false, iTerm2: true,  Ghostty: true  } },
  { feature: 'AI built-in',       values: { CRUX: true,  Warp: true,  iTerm2: false, Ghostty: false } },
  { feature: 'BYOK (no lock-in)', values: { CRUX: true,  Warp: false, iTerm2: null,  Ghostty: null  } },
  { feature: 'File preview panel', values: { CRUX: true,  Warp: false, iTerm2: false, Ghostty: false } },
  { feature: 'GPU accelerated',   values: { CRUX: true,  Warp: true,  iTerm2: false, Ghostty: true  } },
  { feature: 'SSH manager',       values: { CRUX: true,  Warp: false, iTerm2: false, Ghostty: false } },
  { feature: 'Dropdown terminal', values: { CRUX: true,  Warp: false, iTerm2: true,  Ghostty: false } },
  { feature: 'Session restore',   values: { CRUX: true,  Warp: true,  iTerm2: true,  Ghostty: false } },
]

function CheckIcon() {
  return (
    <motion.svg
      className="w-5 h-5 text-crux-accent mx-auto"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </motion.svg>
  )
}

function XIcon() {
  return (
    <svg
      className="w-4 h-4 text-zinc-600 mx-auto"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function CellValue({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-crux-muted text-sm">&mdash;</span>
  if (value) return <CheckIcon />
  return <XIcon />
}

export default function ComparisonTable() {
  return (
    <section className="section-padding">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <span className="text-crux-accent font-mono text-xs tracking-[0.2em] uppercase block mb-4">
            How CRUX compares
          </span>
          <h2 className="font-serif text-headline">The full picture.</h2>
        </motion.div>

        {/* Table */}
        <div className="overflow-x-auto -mx-6 px-6 pb-4">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left pb-6 pr-8 text-sm font-normal text-crux-muted" />
                {terminals.map((terminal) => (
                  <th
                    key={terminal}
                    className={`pb-6 px-6 text-sm font-semibold text-center tracking-tight ${
                      terminal === 'CRUX' ? 'text-crux-accent' : 'text-crux-caption'
                    }`}
                  >
                    {terminal}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  className="border-t border-crux-border/30 group"
                >
                  <td className="py-4 pr-8 text-sm text-crux-caption whitespace-nowrap group-hover:text-crux-text transition-colors duration-200">
                    {row.feature}
                  </td>
                  {terminals.map((terminal) => (
                    <td
                      key={terminal}
                      className={`py-4 px-6 text-center ${
                        terminal === 'CRUX'
                          ? 'bg-crux-accent/[0.04]'
                          : ''
                      }`}
                    >
                      <CellValue value={row.values[terminal]} />
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
