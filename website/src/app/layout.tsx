import type { Metadata } from 'next'
import { Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CRUX Terminal — Your terminal, reimagined.',
  description:
    'GPU-accelerated. AI-native. No account required. A modern terminal for developers who want power without lock-in.',
  openGraph: {
    title: 'CRUX Terminal',
    description: 'Your terminal, reimagined.',
    url: 'https://cruxterminal.com',
    siteName: 'CRUX Terminal',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${jetbrainsMono.variable} ${GeistSans.variable}`}
    >
      <body className={GeistSans.className}>{children}</body>
    </html>
  )
}
