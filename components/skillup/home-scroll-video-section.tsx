"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Pause, Play, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionShell } from "@/components/skillup/section-shell"

const CLOSED_STORAGE_KEY = "home-scroll-video:closed"
const DEMO_POSTER = "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1600&q=80"

function extractYouTubeVideoId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/)
  return match?.[1] || ""
}

function buildEmbedUrl(videoId: string, autoplay: boolean) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    controls: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    origin: typeof window !== "undefined" ? window.location.origin : "",
    cc_load_policy: "1",
  })

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

function postYouTubeCommand(target: HTMLIFrameElement | null, func: "playVideo" | "pauseVideo") {
  if (!target?.contentWindow) return
  target.contentWindow.postMessage(
    JSON.stringify({ event: "command", func, args: [] }),
    "https://www.youtube.com",
  )
}

export function HomeScrollVideoSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const inlineFrameRef = useRef<HTMLIFrameElement | null>(null)
  const floatingFrameRef = useRef<HTMLIFrameElement | null>(null)

  const [videoUrl, setVideoUrl] = useState("")
  const [hasLoadedVideo, setHasLoadedVideo] = useState(false)
  const [isFloating, setIsFloating] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const videoId = useMemo(() => extractYouTubeVideoId(videoUrl), [videoUrl])
  const inlineEmbedUrl = useMemo(() => (videoId ? buildEmbedUrl(videoId, hasLoadedVideo && !isFloating && !isClosed) : ""), [hasLoadedVideo, isClosed, isFloating, videoId])
  const floatingEmbedUrl = useMemo(() => (videoId ? buildEmbedUrl(videoId, hasLoadedVideo && isFloating && !isClosed) : ""), [hasLoadedVideo, isClosed, isFloating, videoId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const dismissed = window.localStorage.getItem(CLOSED_STORAGE_KEY) === "true"
    if (dismissed) setIsClosed(true)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/home-video")
        const data = await res.json()
        if (res.ok && typeof data.homeIntroVideoUrl === "string") {
          setVideoUrl(data.homeIntroVideoUrl)
        }
      } catch (error) {
        console.error("Failed to load homepage video:", error)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (isClosed || !videoId) return
    const node = sectionRef.current
    if (!node || typeof window === "undefined") return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasLoadedVideo(true)
          setIsFloating(false)
          setIsPlaying(true)
          return
        }

        const rect = entry.boundingClientRect
        const hasScrolledPast = rect.bottom < 0
        if (hasScrolledPast) {
          setHasLoadedVideo(true)
          setIsFloating(true)
          setIsPlaying(true)
        } else {
          setIsFloating(false)
          setIsPlaying(false)
        }
      },
      { threshold: 0.45 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [isClosed, videoId])

  useEffect(() => {
    if (!videoId || isClosed || !hasLoadedVideo) return
    const target = isFloating ? floatingFrameRef.current : inlineFrameRef.current
    if (!target) return
    postYouTubeCommand(target, isPlaying ? "playVideo" : "pauseVideo")
  }, [hasLoadedVideo, isClosed, isFloating, isPlaying, videoId])

  const handleCloseFloating = () => {
    setIsClosed(true)
    setIsFloating(false)
    setIsPlaying(false)
    postYouTubeCommand(inlineFrameRef.current, "pauseVideo")
    postYouTubeCommand(floatingFrameRef.current, "pauseVideo")
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CLOSED_STORAGE_KEY, "true")
    }
  }

  const togglePlayback = () => {
    setIsPlaying((current) => !current)
  }

  if (!videoId) {
    return null
  }

  return (
    <>
      <SectionShell className="pt-8 md:pt-10" variant="split">
        <div ref={sectionRef}>
          <Card variant="elevated" className="overflow-hidden border-sky-200/70 bg-[linear-gradient(135deg,rgba(240,249,255,0.9)_0%,rgba(255,255,255,0.98)_45%,rgba(248,250,252,0.95)_100%)]">
            <CardContent className="grid gap-6 p-5 md:p-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:p-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="rounded-full px-3 py-1">Inside The Learning Experience</Badge>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold md:text-4xl">Watch how Prompt Care Academy turns lessons into practical confidence</h2>
                  <p className="text-muted-foreground">
                    This guided preview follows the learner journey from orientation to applied caregiving practice. It plays when the section reaches you, then stays available as a floating companion while you continue exploring the page.
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">The admin team controls this introduction video from the dashboard using a YouTube link.</div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">You stay in control with play, pause, captions, native controls, and a dismiss button once floating.</div>
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-[28px] border border-sky-100 bg-slate-950 shadow-[0_25px_80px_rgba(15,23,42,0.18)]">
                  <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 py-3 text-sm text-slate-200">
                    <span>Academy Experience Preview</span>
                    <Button type="button" size="sm" variant="secondary" className="h-8 gap-2 rounded-full px-3" onClick={togglePlayback}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                  </div>
                  <div className="aspect-video w-full bg-black">
                    {hasLoadedVideo ? (
                      <iframe
                        ref={inlineFrameRef}
                        title="Prompt Care Academy introductory video"
                        src={inlineEmbedUrl}
                        className="h-full w-full"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <img src={DEMO_POSTER} alt="Prompt Care Academy video preview" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionShell>

      <AnimatePresence>
        {isFloating && !isClosed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed right-4 top-20 z-40 w-[min(30vw,430px)] max-w-[430px] min-w-[280px] md:right-5 lg:right-6 lg:top-24 max-md:bottom-4 max-md:right-4 max-md:top-auto max-md:w-[48vw] max-md:min-w-[220px]"
          >
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between bg-slate-900/95 px-3 py-2 text-xs text-slate-100">
                <span className="font-medium">Now playing</span>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="secondary" className="h-7 rounded-full px-2.5" onClick={togglePlayback}>
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-full text-slate-100 hover:bg-white/10 hover:text-white" onClick={handleCloseFloating} aria-label="Close floating video">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="aspect-video w-full bg-black">
                {hasLoadedVideo ? (
                  <iframe
                    ref={floatingFrameRef}
                    title="Prompt Care Academy introductory video floating player"
                    src={floatingEmbedUrl}
                    className="h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
