'use client'

import { motion } from 'framer-motion'

interface Feature {
  label: string
  title: string
  description: string
  details: string[]
  mockup: 'split-panes' | 'ai' | 'file-preview'
}

const features: Feature[] = [
  {
    label: 'Split Panes & Tabs',
    title: 'Work in parallel.',
    description:
      'Split vertically, horizontally, or both. Drag dividers. Cmd+D / Cmd+Shift+D. Your layout saves automatically.',
    details: [
      'Multi-tab with Cmd+T / Cmd+1-9',
      'Session restore on restart',
      'Tmux integration with native UI mapping',
    ],
    mockup: 'split-panes',
  },
  {
    label: 'AI Assistant',
    title: 'AI built in. Never forced.',
    description:
      'Ask questions, fix errors, generate commits — all inline. Bring your own API key. Or flip one switch and AI disappears completely.',
    details: [
      'Claude + OpenAI models supported',
      '/ai, /fix, /how, /explain commands',
      'Ghost text suggestions',
      'Hard Off mode: single toggle',
    ],
    mockup: 'ai',
  },
  {
    label: 'File Preview',
    title: 'Preview anything. Leave nothing.',
    description:
      'JSON trees, syntax-highlighted code, rendered markdown, sortable CSVs, zoomable images — all in a side panel.',
    details: [
      'Cmd+click any file path in output',
      '180+ languages highlighted',
      'Runnable notebook mode for .md files',
    ],
    mockup: 'file-preview',
  },
]

function TerminalMockup({ type }: { type: string }) {
  return (
    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-crux-border/80 bg-crux-surface shadow-2xl shadow-black/40">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-crux-border/60 bg-crux-bg/60">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[11px] text-crux-muted font-mono ml-3">
          CRUX &mdash; {type === 'split-panes' ? 'split view' : type === 'ai' ? 'ai assistant' : 'file preview'}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 font-mono text-[13px] leading-relaxed h-[calc(100%-40px)]">
        {type === 'split-panes' && (
          <div className="h-full flex gap-[2px]">
            <div className="flex-1 bg-crux-bg/60 rounded-lg p-4 space-y-2">
              <p>
                <span className="text-green-400">$</span>{' '}
                <span className="text-crux-text">npm run build</span>
              </p>
              <p className="text-crux-muted text-xs">compiling...</p>
              <p className="text-green-400 text-xs">Compiled successfully in 2.3s</p>
              <p className="text-crux-caption text-xs mt-4">
                <span className="text-crux-accent">42</span> modules transformed
              </p>
            </div>
            <div className="w-[2px] bg-crux-accent/20 rounded-full" />
            <div className="flex-1 bg-crux-bg/60 rounded-lg p-4 space-y-2">
              <p>
                <span className="text-green-400">$</span>{' '}
                <span className="text-crux-text">npm test</span>
              </p>
              <p className="text-crux-muted text-xs">running tests...</p>
              <p className="text-xs">
                <span className="text-green-400">PASS</span>{' '}
                <span className="text-crux-caption">src/auth.test.ts</span>
              </p>
              <p className="text-xs">
                <span className="text-green-400">PASS</span>{' '}
                <span className="text-crux-caption">src/api.test.ts</span>
              </p>
              <p className="text-green-400 text-xs mt-2">All 42 tests passing</p>
            </div>
          </div>
        )}

        {type === 'ai' && (
          <div className="space-y-4">
            <p>
              <span className="text-crux-accent">/ai</span>{' '}
              <span className="text-crux-text">explain this error</span>
            </p>
            <div className="pl-4 border-l-2 border-crux-accent/30 space-y-2">
              <p className="text-crux-text/90 text-xs">
                The error occurs because the <code className="text-crux-amber px-1 py-0.5 bg-crux-amber/10 rounded">async</code> function
              </p>
              <p className="text-crux-text/90 text-xs">
                isn&apos;t being awaited. Add <code className="text-crux-amber px-1 py-0.5 bg-crux-amber/10 rounded">await</code> before the call:
              </p>
              <div className="mt-3 p-3 bg-crux-bg/80 rounded-lg border border-crux-border/40">
                <p className="text-xs">
                  <span className="text-crux-purple">const</span>{' '}
                  <span className="text-crux-text">result</span>{' '}
                  <span className="text-crux-muted">=</span>{' '}
                  <span className="text-crux-accent">await</span>{' '}
                  <span className="text-crux-amber">fetchData</span>
                  <span className="text-crux-muted">()</span>
                </p>
              </div>
            </div>
            <p className="text-[11px] text-crux-muted">
              Powered by Claude 3.5 Sonnet &middot; 0.8s
            </p>
          </div>
        )}

        {type === 'file-preview' && (
          <div className="h-full flex gap-[2px]">
            <div className="flex-1 bg-crux-bg/60 rounded-lg p-4 space-y-2">
              <p>
                <span className="text-green-400">$</span>{' '}
                <span className="text-crux-text">cat config.json</span>
              </p>
              <p className="text-xs text-crux-accent">
                Preview opened in side panel &#x2192;
              </p>
            </div>
            <div className="w-[2px] bg-crux-accent/20 rounded-full" />
            <div className="flex-1 bg-crux-bg/60 rounded-lg p-4 space-y-1 text-xs">
              <p className="text-crux-muted mb-2">config.json</p>
              <p className="text-crux-text">{'{'}</p>
              <p className="pl-4">
                <span className="text-crux-accent">&quot;name&quot;</span>
                <span className="text-crux-muted">: </span>
                <span className="text-green-400">&quot;crux-terminal&quot;</span>
                <span className="text-crux-muted">,</span>
              </p>
              <p className="pl-4">
                <span className="text-crux-accent">&quot;version&quot;</span>
                <span className="text-crux-muted">: </span>
                <span className="text-crux-amber">&quot;1.0.0&quot;</span>
                <span className="text-crux-muted">,</span>
              </p>
              <p className="pl-4">
                <span className="text-crux-accent">&quot;gpu&quot;</span>
                <span className="text-crux-muted">: </span>
                <span className="text-crux-purple">true</span>
                <span className="text-crux-muted">,</span>
              </p>
              <p className="pl-4">
                <span className="text-crux-accent">&quot;ai&quot;</span>
                <span className="text-crux-muted">: </span>
                <span className="text-green-400">&quot;claude&quot;</span>
              </p>
              <p className="text-crux-text">{'}'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Top glow edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-crux-accent/20 to-transparent" />
    </div>
  )
}

export default function FeatureShowcase() {
  return (
    <section id="features" className="section-padding">
      <div className="max-w-7xl mx-auto space-y-32 lg:space-y-48">
        {features.map((feature, index) => {
          const reversed = index % 2 !== 0
          return (
            <div
              key={feature.label}
              className={`flex flex-col gap-12 lg:gap-20 items-center ${
                reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
              }`}
            >
              {/* Visual */}
              <motion.div
                initial={{ opacity: 0, x: reversed ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, ease: [0.25, 0.4, 0, 1] }}
                className="w-full lg:w-3/5"
              >
                <TerminalMockup type={feature.mockup} />
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="w-full lg:w-2/5"
              >
                <span className="text-crux-accent font-mono text-xs tracking-[0.2em] uppercase block mb-4">
                  {feature.label}
                </span>
                <h2 className="font-serif text-headline mb-6">{feature.title}</h2>
                <p className="text-crux-caption text-lg leading-relaxed mb-8">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.details.map((detail, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex items-start gap-3 text-sm text-crux-caption"
                    >
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-crux-accent/60 shrink-0" />
                      {detail}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
