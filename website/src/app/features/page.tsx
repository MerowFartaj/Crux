'use client'

import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const featureCategories = [
  {
    id: 'core',
    title: 'Core Terminal',
    features: [
      { name: 'GPU-Accelerated Rendering', desc: 'WebGL-powered terminal rendering for buttery smooth output, even with thousands of lines.' },
      { name: 'Split Panes', desc: 'Vertical and horizontal splits with draggable dividers. Cmd+D / Cmd+Shift+D.' },
      { name: 'Multi-Tab Interface', desc: 'Cmd+T for new tabs, Cmd+1-9 to switch. Tabs show working directory.' },
      { name: 'Session Restore', desc: 'Your tabs, splits, and working directories survive restarts.' },
      { name: 'Block-Based Output', desc: 'Each command output is a discrete block with status, timing, and rerun capability.' },
      { name: 'Inline Syntax Highlighting', desc: 'Commands, flags, strings, and variables are color-coded as you type.' },
    ],
  },
  {
    id: 'ai',
    title: 'AI Features',
    features: [
      { name: 'Inline AI Assistant', desc: 'Ask questions, get explanations, fix errors — all without leaving your terminal.' },
      { name: 'BYOK (Bring Your Own Key)', desc: 'Use your own API keys for Claude or OpenAI. No intermediary, no markup.' },
      { name: 'Ghost Text Suggestions', desc: 'Inline completions that appear as you type. Tab to accept.' },
      { name: 'Hard Off Mode', desc: 'Single toggle to completely disable all AI features. No telemetry, no network calls.' },
      { name: 'Slash Commands', desc: '/ai, /fix, /how, /explain — purpose-built commands for common AI interactions.' },
      { name: 'Context-Aware', desc: 'AI sees your recent command output and errors for accurate, relevant responses.' },
    ],
  },
  {
    id: 'preview',
    title: 'File Preview',
    features: [
      { name: 'Side Panel Viewer', desc: 'Cmd+click any file path in terminal output to preview it instantly.' },
      { name: '180+ Languages', desc: 'Full syntax highlighting powered by highlight.js for virtually any language.' },
      { name: 'JSON Tree View', desc: 'Interactive, collapsible JSON explorer with search and copy support.' },
      { name: 'Markdown Rendering', desc: 'Rendered markdown with code blocks, tables, and runnable notebook mode.' },
      { name: 'Image Viewer', desc: 'Zoomable, pannable image preview for PNG, JPG, SVG, and more.' },
      { name: 'CSV/TSV Tables', desc: 'Sortable, filterable table view for structured data files.' },
    ],
  },
  {
    id: 'ssh',
    title: 'SSH Manager',
    features: [
      { name: 'Connection Library', desc: 'Save and organize SSH connections with labels, groups, and color tags.' },
      { name: 'Encrypted Storage', desc: 'All credentials stored locally with AES-256 encryption.' },
      { name: 'Auto-Import', desc: 'One-click import from your existing ~/.ssh/config file.' },
      { name: 'Quick Connect', desc: 'Connect to any saved host from the command palette or slash command.' },
    ],
  },
  {
    id: 'dropdown',
    title: 'Dropdown Terminal',
    features: [
      { name: 'System-Wide Hotkey', desc: 'Option+Space summons the terminal from any app, any context.' },
      { name: 'Full-Width Overlay', desc: 'Slides down from the top of your screen. Adjustable height.' },
      { name: 'Persistent Session', desc: 'The dropdown terminal maintains its own session across show/hide cycles.' },
    ],
  },
  {
    id: 'customization',
    title: 'Customization',
    features: [
      { name: 'Themes', desc: 'Built-in dark themes with full color customization for every UI element.' },
      { name: 'Font Configuration', desc: 'Choose your terminal font, size, line height, and ligature settings.' },
      { name: 'Keybinding Editor', desc: 'Rebind any shortcut to match your muscle memory.' },
      { name: 'Onboarding Wizard', desc: '6-step guided setup for shell, AI keys, features, and shortcuts.' },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <main className="relative">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-display mb-6"
          >
            Features
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-crux-caption max-w-2xl"
          >
            Everything CRUX can do, in detail.
          </motion.p>
        </div>
      </section>

      {/* Feature sections */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex gap-16">
          {/* Sticky sidebar */}
          <nav className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-24 space-y-3">
              {featureCategories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="block text-sm text-crux-muted hover:text-crux-text transition-colors"
                >
                  {cat.title}
                </a>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 space-y-24">
            {featureCategories.map((category) => (
              <motion.section
                key={category.id}
                id={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="font-serif text-headline mb-8 pb-4 border-b border-crux-border/30">
                  {category.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.features.map((feature) => (
                    <div key={feature.name} className="space-y-2">
                      <h3 className="text-base font-medium text-crux-text">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-crux-caption leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
