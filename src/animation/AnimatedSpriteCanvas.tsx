import React, { useEffect, useRef } from 'react'
import { usePetStore } from '../pet/state/petStore'

// Canvas-based renderer that loads the uploaded reference image and creates simple frame-based animations
export default function AnimatedSpriteCanvas(){
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const avatarUrl = (window as any).THUMBI_CONFIG?.avatarUrl || '/8C512FF5-A158-4A91-8B11-5C5991E36F2D.png'
  const frameRef = useRef(0)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(()=>{
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let mounted = true
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = avatarUrl
    imgRef.current = img

    function draw(){
      if(!mounted) return
      frameRef.current++
      const f = frameRef.current
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0,0,w,h)
      // background rug
      ctx.fillStyle = '#fdeef3'
      ctx.fillRect(0, h-90, w, 90)

      if(img.complete && img.naturalWidth){
        // draw the full image centered and then apply small per-frame transforms to simulate frames
        const maxW = w * 0.8; const maxH = h * 0.8
        let iw = img.naturalWidth, ih = img.naturalHeight
        const ratio = Math.min(maxW/iw, maxH/ih)
        iw *= ratio; ih *= ratio
        const bobX = Math.sin(f/18) * 2
        const bobY = Math.sin(f/22) * 3
        const dx = (w - iw)/2 + bobX
        const dy = (h - ih)/2 + bobY
        ctx.drawImage(img, dx, dy, iw, ih)

        // simple blink overlay animation: every ~90 frames blink for 1-2 frames
        if(f % 90 === 0 || f % 90 === 1){
          ctx.fillStyle = 'rgba(0,0,0,0.06)'
          const eyeY = dy + ih*0.22
          ctx.fillRect(dx, eyeY, iw, ih*0.12)
        }

        // happy bounce small scale on certain frames
        if(f % 120 > 110){
          ctx.globalCompositeOperation = 'lighter'
          ctx.fillStyle = 'rgba(255,240,245,0.04)'
          ctx.fillRect(dx-6, dy-6, iw+12, ih+12)
          ctx.globalCompositeOperation = 'source-over'
        }

      } else {
        // fallback: stylized drawing similar to placeholder rig
        const cx = w/2, cy = h/2; const bob = Math.sin(f/30)*3
        ctx.fillStyle = '#2a1f1a'; ctx.fillRect(cx-140, cy-170+bob, 280, 80)
        ctx.fillStyle = '#f2c9b8'; ctx.fillRect(cx-80, cy-120+bob, 160, 140)
        ctx.fillStyle = '#000'; ctx.fillRect(cx-48, cy-70+bob, 36, 10); ctx.fillRect(cx+12, cy-70+bob, 36, 10); ctx.fillRect(cx-6, cy-70+bob, 12, 3)
        ctx.fillStyle = '#000'; ctx.fillRect(cx-6, cy-110+bob, 12, 12)
        ctx.fillStyle = '#d4af37'; ctx.fillRect(cx-6, cy-10+bob, 12, 6)
      }

      requestAnimationFrame(draw)
    }

    const id = requestAnimationFrame(draw)
    return ()=>{ mounted = false; cancelAnimationFrame(id) }
  }, [avatarUrl])

  return (
    <canvas ref={canvasRef} width={480} height={480} style={{width:'100%',height:'auto',borderRadius:12,background:'linear-gradient(180deg,#fff8f9,#fff)'}} />
  )
}
