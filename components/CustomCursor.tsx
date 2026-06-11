'use client'
import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mouseX = 0, mouseY = 0
    let dotX = 0, dotY = 0
    let glowX = 0, glowY = 0
    let rafId: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const animate = () => {
      dotX += (mouseX - dotX) * 0.35
      dotY += (mouseY - dotY) * 0.35
      glowX += (mouseX - glowX) * 0.12
      glowY += (mouseY - glowY) * 0.12

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${glowX - 200}px, ${glowY - 200}px)`
      }
      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    rafId = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      {/* Glow spot */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998]"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197,232,74,0.13) 0%, rgba(197,232,74,0.04) 40%, transparent 70%)',
          willChange: 'transform',
        }}
      />
      {/* Dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999]"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#c5e84a',
          boxShadow: '0 0 8px rgba(197,232,74,0.8)',
          willChange: 'transform',
          transition: 'opacity 0.2s',
        }}
      />
    </>
  )
}
