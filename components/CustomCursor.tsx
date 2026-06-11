'use client'
import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: -100, y: -100 })
  const ringPos = useRef({ x: -100, y: -100 })
  const rafId = useRef<number>(0)
  const hovering = useRef(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 5}px, ${e.clientY - 5}px)`
      }
    }

    const onEnter = () => {
      hovering.current = true
      if (dotRef.current) dotRef.current.style.transform += ' scale(2.2)'
    }
    const onLeave = () => { hovering.current = false }

    const animate = () => {
      ringPos.current.x += (posRef.current.x - ringPos.current.x) * 0.15
      ringPos.current.y += (posRef.current.y - ringPos.current.y) * 0.15
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x - 20}px, ${ringPos.current.y - 20}px)`
      }
      rafId.current = requestAnimationFrame(animate)
    }

    const links = document.querySelectorAll('a, button, [role="button"]')
    links.forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    window.addEventListener('mousemove', onMove)
    rafId.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId.current)
      links.forEach(el => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  return (
    <>
      <style>{`* { cursor: none !important; }`}</style>
      {/* Outer ring - follows with lag */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998]"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1.5px solid rgba(249, 115, 22, 0.55)',
          willChange: 'transform',
          transition: 'width 0.2s, height 0.2s, opacity 0.2s',
        }}
      />
      {/* Center dot - snaps to cursor */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999]"
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#f97316',
          willChange: 'transform',
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
    </>
  )
}
