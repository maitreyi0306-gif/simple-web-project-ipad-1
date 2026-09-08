import { useEffect } from 'react'
import { usePetStore } from '../state/petStore'
import { moodEngine } from '../state/moodEngine'
import { playSound } from '../../sound/soundManager'

// Triggers type
type Trigger = 'timer'|'tap'|'drag'|'repeated_tap'|'ignore'|'mood_change'|'random'

// Expose simple notifier functions that UI can call
export function notifyTap(){ window.dispatchEvent(new CustomEvent('thumbi:trigger',{detail:'tap'})) }
export function notifyDrag(){ window.dispatchEvent(new CustomEvent('thumbi:trigger',{detail:'drag'})) }
export function notifyRepeatedTap(){ window.dispatchEvent(new CustomEvent('thumbi:trigger',{detail:'repeated_tap'})) }
export function notifyIgnore(){ window.dispatchEvent(new CustomEvent('thumbi:trigger',{detail:'ignore'})) }

// Weighted idle choices
const idleChoices: { behavior: string; weight: number }[] = [
  { behavior: 'idle', weight: 35 },
  { behavior: 'wander', weight: 30 },
  { behavior: 'stretch', weight: 12 },
  { behavior: 'sit', weight: 12 },
  { behavior: 'peek', weight: 11 }
]

function weightedPick<T extends { weight:number }>(arr:T[]){
  const total = arr.reduce((s,a)=>s+a.weight,0)
  let r = Math.random()*total
  for(const a of arr){ if(r < a.weight) return a; r -= a.weight }
  return arr[0]
}

// Transition table: (currentBehavior, trigger) => nextBehavior
const transitions: Record<string, Partial<Record<Trigger,string>>> = {
  idle: { timer: 'idle', tap: 'stare', drag: 'follow_finger', repeated_tap: 'run_away', mood_change: 'idle', random: '' },
  wander: { timer: 'idle', tap: 'stare', drag: 'follow_finger', repeated_tap: 'run_away', mood_change: 'wander', random: '' },
  follow_finger: { timer: 'idle', tap: 'stare', drag: 'follow_finger', repeated_tap: 'run_away', mood_change: 'follow_finger' },
  sleep: { tap: 'stare', drag: 'follow_finger', repeated_tap: 'run_away', ignore: 'sleep' },
  hide: { timer: 'idle', tap: 'stare', drag: 'follow_finger' },
  peek: { timer: 'idle', tap: 'stare' },
  stretch: { timer: 'idle' },
  sit: { timer: 'idle' },
  dance: { timer: 'idle' },
  run_away: { timer: 'idle' },
  stare: { timer: 'idle' }
}

// Hook: runs the behavior engine while mounted
export function useBehaviorEngine(){
  const get = usePetStore.getState
  const set = usePetStore.setState

  useEffect(()=>{
    let mounted = true

    // listen for UI triggers
    function onTrigger(e:Event){
      const detail = (e as CustomEvent).detail as Trigger
      handleTrigger(detail)
    }
    window.addEventListener('thumbi:trigger', onTrigger as EventListener)

    // periodic tick for idle randomness and mood-based transitions
    const TICK_MS = 5000
    const tick = setInterval(()=>{
      if(!mounted) return
      handleTrigger('timer')
    }, TICK_MS) // tick every 5s for liveliness during testing

    // listen for visibility / focus to implement return behavior
    function onVisibility(){
      const state = get()
      const last = state.lastInteractionAt || 0
      const gap = Date.now() - last
      // tiers: 2 min, 10 min, 1 hr
      if(gap > 1000*60*60){
        // long absence: big excited greeting
        set({ behavior: 'dance', lastInteractionAt: Date.now(), stats: { ...state.stats, happiness: Math.min(100, state.stats.happiness + 8) } } as any)
        playSound('surprise')
      } else if(gap > 1000*60*10){
        set({ behavior: 'dance', lastInteractionAt: Date.now(), stats: { ...state.stats, happiness: Math.min(100, state.stats.happiness + 5) } } as any)
        playSound('happy_squeak')
      } else if(gap > 1000*60*2){
        set({ behavior: 'peek', lastInteractionAt: Date.now() } as any)
        playSound('happy_squeak')
      }
    }
    window.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible') onVisibility() })
    window.addEventListener('focus', onVisibility)

    // also listen for store changes of stats to detect mood changes
    let lastMood = get().mood
    const unsub = usePetStore.subscribe((s)=>s.mood, (m)=>{ if(m !== lastMood){ lastMood = m; handleTrigger('mood_change') } })

    return ()=>{
      mounted = false
      clearInterval(tick)
      window.removeEventListener('thumbi:trigger', onTrigger as EventListener)
      window.removeEventListener('visibilitychange', ()=>{})
      window.removeEventListener('focus', ()=>{})
      unsub()
    }

    // -- handler definition --
    function handleTrigger(trigger: Trigger){
      const state = get()
      const current = state.behavior

      // High-priority interrupts
      if(trigger === 'repeated_tap'){
        // slightly lower happiness but respect floor
        const s = state.stats
        const newH = Math.max(30, s.happiness - 4)
        set({ behavior: 'run_away', lastInteractionAt: Date.now(), stats: { ...s, happiness: newH } } as any)
        playSound('annoyed_grumble')
        return
      }
      if(trigger === 'drag'){
        set({ behavior: 'follow_finger', lastInteractionAt: Date.now() } as any)
        playSound('happy_squeak')
        return
      }
      if(trigger === 'tap'){
        set({ behavior: 'stare', lastInteractionAt: Date.now() } as any)
        playSound('happy_squeak')
        return
      }

      // ignore behavior when sleeping
      if(current === 'sleep' && trigger !== 'tap' && trigger !== 'drag'){
        return
      }

      // Timer or random decisions
      if(trigger === 'timer' || trigger === 'random' || trigger === 'mood_change'){
        // If sleepy, go to sleep with some probability
        const mood = moodEngine(state.stats)
        if(mood === 'sleepy' && Math.random() < 0.6){ set({ behavior: 'sleep' } as any); playSound('sleepy_yawn'); return }

        // Weighted idle choices
        const pick = weightedPick(idleChoices)
        set({ behavior: pick.behavior as any })
        return
      }

      // ignore default
      set({ behavior: 'idle' } as any)
    }

  }, [])
}
