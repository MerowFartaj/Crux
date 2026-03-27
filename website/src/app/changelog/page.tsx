'use client'

import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const changelog = [
  {
    version: '1.0.0',
    date: 'March 2026',
    entries: [
      { tag: 'New', text: 'Initial public release' },
      { tag: 'New', text: 'GPU-accelerated terminal rendering with WebGL' },
      { tag: 'New', text: 'Split panes (vertical + horizontal) with drag-to-resize' },
      { tag: 'New', text: 'Inline AI assistant with Claude and OpenAI support' },
      { tag: 'New', text: 'BYOK (Bring Your Own Key) — no account, no lock-in' },
      { tag: 'New', text: 'File preview panel with 180+ language support' },
      { tag: 'New', text: 'SSH connection manager with encrypted storage' },
      { tag: 'New', text: 'Dropdown terminal (Option+Space)' },
      { tag: 'New', text: 'Command palette (Cmd+K)' },
      { tag: 'New', text: 'Block-based output with status footers' },
      { tag: 'New', text: '25+ slash commands' },
      { tag: 'New', text: 'System Pulse — live CPU, memory, network, disk' },
      { tag: 'New', text: '6-step onboarding wizard' },
    ],
  },
]

const roadmap = [
  { title: 'Plugin / Extension System', status: 'In Progress', desc: 'Install community plugins to extend CRUX with new commands, themes, and integrations.' },
  { title: 'Themes Marketplace', status: 'Planned', desc: 'Browse and install community-created themes with live preview.' },
  { title: 'Linux Support', status: 'Planned', desc: 'Native Linux builds for Ubuntu, Fedora, and Arch.' },
  { title: 'Windows Support', status: 'Exploring', desc: 'Native Windows builds with WSL integration.' },
  { title: 'Collaboration', status: 'Exploring', desc: 'Share terminal sessions in real-time for pair programming.' },
  { title: 'Snippets Library', status: 'Planned', desc: 'Save and organize reusable command snippets with variables.' },
]

const tagColors: Record<string, string> = {
  'New': 'bg-crux-accent/15 text-crux-accent',
  'Fix': 'bg-red-500/15 text-red-400',
  'Improvement': 'bg-crux-amber/15 text-crux-amber',
}

const statusColors: Record<string, string> = {
  'In Progress': 'bg-green-500/15 text-green-400 border-green-500/20',
  'Planned': 'bg-crux-accent/15 text-crux-accent border-crux-accent/20',
  'Exploring': 'bg-crux-purple/15 text-crux-purple border-crux-purple/20',
}

export default function ChangelogPage() {
  return (
    <main className="relative">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-display mb-6"
          >
            Changelog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-crux-caption"
          >
            What&apos;s new, what&apos;s fixed, what&apos;s next.
          </motion.p>
        </div>
      </section>

      {/* Changelog */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-16">
          {changelog.map((release) => (
            <motion.div
              key={release.version}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-baseline gap-4 mb-6">
                <h2 className="font-serif text-3xl text-crux-text">
                  v{release.version}
                </h2>
                <span className="text-sm text-crux-muted font-mono">
                  {release.date}
                </span>
              </div>
              <ul className="space-y-3">
                {release.entries.map((entry, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                        tagColors[entry.tag] || 'bg-crux-border text-crux-caption'
                      }`}
                    >
                      {entry.tag}
                    </span>
                    <span className="text-sm text-crux-caption leading-relaxed">
                      {entry.text}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-crux-border/60 to-transparent" />
      </div>

      {/* Roadmap */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="text-crux-accent font-mono text-xs tracking-[0.2em] uppercase block mb-4">
              Roadmap
            </span>
            <h2 className="font-serif text-headline">What&apos;s ahead.</h2>
          </motion.div>

          <div className="space-y-4">
            {roadmap.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-crux-border/40 bg-crux-surface/20 p-6 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1">
                  <h3 className="text-base font-medium text-crux-text mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-crux-caption">{item.desc}</p>
                </div>
                <span
                  className={`shrink-0 self-start px-3 py-1 rounded-full text-xs font-medium border ${
                    statusColors[item.status] || 'bg-crux-border/30 text-crux-muted border-crux-border/40'
                  }`}
                >
                  {item.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
