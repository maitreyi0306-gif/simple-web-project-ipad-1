import { useEffect } from 'react'
import { usePetStore } from './petStore'
import { moodEngine } from './moodEngine'

export function useDecayLoop(){
  const stats = usePetStore(state=>state.stats)
  const set = usePetStore.getState
n
  useEffect(()=>{
    let mounted = true
    const id = setInterval(()=>{
      if(!mounted) return
      const s = set().stats
      // decay while app open, small steps
      const next = { ...s,
        happiness: Math.max(30, s.happiness - 0.5),
        energy: Math.max(10, s.energy - 0.4),
        playfulness: Math.max(0, s.playfulness - 0.2),
        mischief: Math.min(100, s.mischief + 0.1),
        socialBattery: Math.min(100, s.socialBattery + 0.2)
      }
      set().stats = next as any
      // recompute mood
      const mood = moodEngine(next as any)
      set().mood = mood as any
    }, 30000)
    return ()=>{ mounted = false; clearInterval(id) }
  }, [])
}
