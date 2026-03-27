import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import ScrollVideo from '@/components/ScrollVideo'
import WhyCrux from '@/components/WhyCrux'
import FeatureShowcase from '@/components/FeatureShowcase'
import BentoGrid from '@/components/BentoGrid'
import KeyboardShowcase from '@/components/KeyboardShowcase'
import ComparisonTable from '@/components/ComparisonTable'
import DownloadCTA from '@/components/DownloadCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="relative">
      <Navigation />
      <Hero />
      <ScrollVideo />
      <WhyCrux />
      <FeatureShowcase />
      <BentoGrid />
      <KeyboardShowcase />
      <ComparisonTable />
      <DownloadCTA />
      <Footer />
    </main>
  )
}
