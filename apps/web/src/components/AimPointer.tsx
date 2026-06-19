import { useEffect, useRef } from 'react'
import type { MotionValue } from 'framer-motion'

// The targeting arrow dragged from a card to the cursor while aiming. A full-screen SVG overlay whose
// curve + arrowhead are updated imperatively from the cursor motion values (no React re-render per move).
export function AimPointer({
  from,
  x,
  y,
  valid,
}: {
  from: { x: number; y: number }
  x: MotionValue<number>
  y: MotionValue<number>
  valid: boolean
}) {
  const pathRef = useRef<SVGPathElement>(null)
  const headRef = useRef<SVGPolygonElement>(null)

  useEffect(() => {
    const update = () => {
      const ex = x.get()
      const ey = y.get()
      const cx = (from.x + ex) / 2
      const cy = Math.min(from.y, ey) - 70 // control point above both ends → a bow that arcs upward
      pathRef.current?.setAttribute('d', `M ${from.x} ${from.y} Q ${cx} ${cy} ${ex} ${ey}`)
      // arrowhead points along the curve's end tangent (control point → end)
      const ang = (Math.atan2(ey - cy, ex - cx) * 180) / Math.PI
      headRef.current?.setAttribute('transform', `translate(${ex} ${ey}) rotate(${ang})`)
    }
    update()
    const ux = x.on('change', update)
    const uy = y.on('change', update)
    return () => {
      ux()
      uy()
    }
  }, [from, x, y])

  return (
    <svg className={'aim-svg' + (valid ? ' valid' : '')} width="100%" height="100%">
      <path ref={pathRef} className="aim-path" />
      <polygon ref={headRef} className="aim-head" points="0,0 -34,-16 -34,16" />
    </svg>
  )
}
