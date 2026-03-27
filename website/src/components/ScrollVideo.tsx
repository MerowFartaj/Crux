'use client'

import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from 'framer-motion'

interface FeaturePair {
  left: string
  right: string
}

const featurePairs: FeaturePair[] = [
  { left: 'GPU-accelerated rendering', right: 'Multi-tab & split panes' },
  { left: 'AI built in, never forced', right: 'Claude + OpenAI, bring your own key' },
  { left: 'SSH manager & file preview', right: 'Dropdown terminal & command palette' },
]

function useTextOpacity(
  scrollProgress: MotionValue<number>,
  index: number
) {
  const segmentStart = index * 0.25
  const fadeIn = segmentStart + 0.03
  const fadeOut = segmentStart + 0.20
  const segmentEnd = segmentStart + 0.25

  return useTransform(
    scrollProgress,
    [segmentStart, fadeIn, fadeOut, segmentEnd],
    [0, 1, 1, 0]
  )
}

function useTextY(
  scrollProgress: MotionValue<number>,
  index: number
) {
  const segmentStart = index * 0.25
  const fadeIn = segmentStart + 0.03
  const fadeOut = segmentStart + 0.20
  const segmentEnd = segmentStart + 0.25

  return useTransform(
    scrollProgress,
    [segmentStart, fadeIn, fadeOut, segmentEnd],
    [20, 0, 0, -20]
  )
}

export default function ScrollVideo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Bind video currentTime to scroll position
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (videoRef.current) {
      const duration = videoRef.current.duration
      if (duration && isFinite(duration)) {
        videoRef.current.currentTime = latest * duration
      }
    }
  })

  // Ensure video is paused and ready for manual scrubbing
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.pause()
      const handlePlay = () => video.pause()
      video.addEventListener('play', handlePlay)
      return () => video.removeEventListener('play', handlePlay)
    }
  }, [])

  // Final fade-out: everything fades as we reach 90-100%
  const globalOpacity = useTransform(scrollYProgress, [0.88, 1], [1, 0])

  return (
    <div ref={containerRef} className="relative" style={{ height: '400vh' }}>
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div
          style={{ opacity: globalOpacity }}
          className="relative h-full w-full flex items-center justify-center"
        >
          {/* Video */}
          <video
            ref={videoRef}
            src="/crux-hero.mp4"
            muted
            playsInline
            preload="auto"
            className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] md:w-[400px] md:h-[400px] object-contain relative z-10"
          />

          {/* Feature text pairs */}
          {featurePairs.map((pair, index) => (
            <FeatureTextPair
              key={index}
              left={pair.left}
              right={pair.right}
              index={index}
              scrollProgress={scrollYProgress}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function FeatureTextPair({
  left,
  right,
  index,
  scrollProgress,
}: {
  left: string
  right: string
  index: number
  scrollProgress: MotionValue<number>
}) {
  const opacity = useTextOpacity(scrollProgress, index)
  const y = useTextY(scrollProgress, index)

  return (
    <>
      {/* Left text */}
      <motion.p
        style={{ opacity, y }}
        className="absolute left-6 sm:left-12 md:left-20 lg:left-32 top-1/2 -translate-y-1/2 font-serif text-2xl sm:text-3xl md:text-4xl text-crux-text/80 max-w-[200px] sm:max-w-[260px] md:max-w-[300px] leading-tight"
      >
        {left}
      </motion.p>

      {/* Right text */}
      <motion.p
        style={{ opacity, y }}
        className="absolute right-6 sm:right-12 md:right-20 lg:right-32 top-1/2 -translate-y-1/2 font-serif text-2xl sm:text-3xl md:text-4xl text-crux-text/80 max-w-[200px] sm:max-w-[260px] md:max-w-[300px] leading-tight text-right"
      >
        {right}
      </motion.p>
    </>
  )
}
