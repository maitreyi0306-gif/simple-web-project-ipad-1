import { useEffect, useRef } from 'react'
import { usePetStore } from '../pet/state/petStore'
import { notifyDrag } from '../pet/behavior/behaviorEngine'
import { playSound } from '../sound/soundManager'

// Hook provides pointer handlers to attach to the pet area
export function usePetGesture(){
  const isDownRef = useRef(false)
  const lastPos = useRef<{x:number,y:number}|null>(null)
  const accumulated = useRef(0)
  const get = usePetStore.getState
  const set = usePetStore.setState

  useEffect(()=>{
    return ()=>{
      isDownRef.current = false
      lastPos.current = null
    }
  }, [])

  function onPointerDown(e: React.PointerEvent){
    isDownRef.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    // register interaction time
    set({ lastInteractionAt: Date.now() } as any)
  }

  function onPointerMove(e: React.PointerEvent){
    if(!isDownRef.current) return
    notifyDrag()
    playSound('happy_squeak')
    const pos = { x: e.clientX, y: e.clientY }
    if(lastPos.current){
      const dx = Math.abs(pos.x - lastPos.current.x)
      const dy = Math.abs(pos.y - lastPos.current.y)
      const dist = Math.sqrt(dx*dx + dy*dy)
      accumulated.current += dist
      // every ~20 px moved, give a small affection bump
      if(accumulated.current > 20){
        const s = get().stats
        const newAff = Math.min(100, s.affection + 0.5)
        const newHap = Math.min(100, s.happiness + 0.3)
        set({ stats: { ...s, affection: newAff, happiness: newHap } } as any)
        accumulated.current = 0
      }
    }
    lastPos.current = pos
    set({ lastInteractionAt: Date.now() } as any)
  }

  function onPointerUp(e: React.PointerEvent){
    isDownRef.current = false
    lastPos.current = null
    accumulated.current = 0
    // small final bump
    const s = get().stats
    set({ stats: { ...s, affection: Math.min(100, s.affection + 1) } } as any)
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}
