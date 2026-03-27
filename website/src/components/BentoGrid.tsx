'use client'

import { motion } from 'framer-motion'

interface BentoCard {
  title: string
  description: string
  size: 'large' | 'medium' | 'small'
  icon: React.ReactNode
  accent?: string
}

function IconBox({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border"
      style={{
        backgroundColor: `${accent || 'rgba(59,130,246,0.1)'}`,
        borderColor: `${accent || 'rgba(59,130,246,0.15)'}`,
      }}
    >
      {children}
    </div>
  )
}

const cards: BentoCard[] = [
  {
    title: 'SSH Connection Manager',
    description:
      'Save, encrypt, organize. Import from ~/.ssh/config. Color-tagged groups for instant access.',
    size: 'large',
    icon: (
      <svg className="w-5 h-5 text-crux-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    accent: 'rgba(59,130,246,0.1)',
  },
  {
    title: 'Dropdown Terminal',
    description:
      'Option+Space from anywhere. Full width, slides from top. Always ready, always one keystroke away.',
    size: 'large',
    icon: (
      <svg className="w-5 h-5 text-crux-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18v15H3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5l9 6 9-6" />
      </svg>
    ),
    accent: 'rgba(139,92,246,0.1)',
  },
  {
    title: 'Command Palette',
    description:
      'Cmd+K. Search history, run commands, translate natural language to shell.',
    size: 'medium',
    icon: (
      <svg className="w-5 h-5 text-crux-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    accent: 'rgba(245,158,11,0.1)',
  },
  {
    title: 'Block-Based Output',
    description:
      'Every command gets a status footer. Browse, search, filter, rerun with one click.',
    size: 'medium',
    icon: (
      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    accent: 'rgba(34,197,94,0.1)',
  },
  {
    title: 'Syntax Highlighting',
    description: 'Commands, flags, strings, variables — all color-coded inline.',
    size: 'small',
    icon: (
      <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    accent: 'rgba(244,114,182,0.1)',
  },
  {
    title: 'System Pulse',
    description: 'CPU, memory, network, disk — live metrics at a glance.',
    size: 'small',
    icon: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l3-6 3 3 3-9 3 6 3-3 3 9" />
      </svg>
    ),
    accent: 'rgba(34,211,238,0.1)',
  },
  {
    title: 'Onboarding Wizard',
    description: '6-step setup. Shell, AI keys, feature tour, shortcuts.',
    size: 'small',
    icon: (
      <svg className="w-5 h-5 text-crux-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    accent: 'rgba(59,130,246,0.1)',
  },
  {
    title: '25+ Slash Commands',
    description: '/settings, /pulse, /ssh, /preview, /blocks, and more.',
    size: 'small',
    icon: (
      <span className="text-crux-amber font-mono text-sm font-bold">/</span>
    ),
    accent: 'rgba(245,158,11,0.1)',
  },
]

const gridPositions: Record<string, string> = {
  large: 'md:col-span-2 md:row-span-2',
  medium: 'md:col-span-2',
  small: '',
}

export default function BentoGrid() {
  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="text-crux-accent font-mono text-xs tracking-[0.2em] uppercase block mb-4">
            Everything else
          </span>
          <h2 className="font-serif text-headline">Built for every workflow.</h2>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.5,
                delay: index * 0.06,
                ease: [0.25, 0.4, 0, 1],
              }}
              whileHover={{
                y: -4,
                transition: { duration: 0.25, ease: 'easeOut' },
              }}
              className={`${gridPositions[card.size]} group relative rounded-2xl border border-crux-border/60 bg-crux-surface/40 p-6 md:p-8 overflow-hidden cursor-default`}
            >
              {/* Hover gradient */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-crux-accent/[0.04] via-transparent to-transparent pointer-events-none" />

              <IconBox accent={card.accent}>{card.icon}</IconBox>
              <h3 className="text-lg font-medium text-crux-text mb-2 tracking-tight">
                {card.title}
              </h3>
              <p className="text-sm text-crux-caption leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
