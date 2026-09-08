import { useEffect } from 'react'
import { usePetStore } from '../state/petStore'
import { moodEngine } from '../state/moodEngine'

// Triggers type
type Trigger = 'timer'|'tap'|'drag'|'repeated_tap'|'ignore'|'mood_change'|'random'

// Expose simple notifier functions that UI can call
export function notifyTap(){ window.dispatchEvent(new CustomEvent('thumbi:trigger',{detail:'tap'})) }
export function notifyDrag(){ window.dispatchEvent(new CustomEvent('thumbi:trigger',{detail:'drag'})) }
export function notifyRepeatedTap(){ window.dispatchEvent(new CustomEvent('thumbi:trigger',{detail:'repeated_tap'})) }
export function notifyIgnore(){ window.dispatchEvent(new CustomEvent('thumbi:trigger',{detail:'ignore'})) }

// Weighted idle choices
const idleChoices: { behavior: string; weight: number }[] = [
  { behavior: 'idle', weight: 40 },
  { behavior: 'wander', weight: 25 },
  { behavior: 'stretch', weight: 10 },
  { behavior: 'sit', weight: 10 },
  { behavior: 'peek', weight: 10 }
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
    const tick = setInterval(()=>{
      if(!mounted) return
      handleTrigger('timer')
    }, 5000) // tick every 5s for liveliness during testing

    // also listen for store changes of stats to detect mood changes
    let lastMood = get().mood
    const unsub = usePetStore.subscribe((s)=>s.mood, (m)=>{ if(m !== lastMood){ lastMood = m; handleTrigger('mood_change') } })

    return ()=>{
      mounted = false
      clearInterval(tick)
      window.removeEventListener('thumbi:trigger', onTrigger as EventListener)
      unsub()
    }

    // -- handler definition --
    function handleTrigger(trigger: Trigger){
      const state = get()
      const current = state.behavior

      // High-priority interrupts
      if(trigger === 'repeated_tap'){
        set({ behavior: 'run_away', lastInteractionAt: Date.now() })
        return
      }
      if(trigger === 'drag'){
        set({ behavior: 'follow_finger', lastInteractionAt: Date.now() })
        return
      }
      if(trigger === 'tap'){
        // simple stare then return
        set({ behavior: 'stare', lastInteractionAt: Date.now() })
        return
      }

      // ignore triggers when sleeping except certain ones
      if(current === 'sleep' && trigger !== 'tap' && trigger !== 'drag'){
        // remain sleeping unless poked
        return
      }

      // Timer or random decisions
      if(trigger === 'timer' || trigger === 'random' || trigger === 'mood_change'){
        // If sleepy, go to sleep
        const mood = moodEngine(state.stats)
        if(mood === 'sleepy' && Math.random() < 0.6){ set({ behavior: 'sleep' }); return }

        // weighted idle choices
        const pick = weightedPick(idleChoices)
        set({ behavior: pick.behavior as any })
        return
      }

      // default fallback
      set({ behavior: 'idle' })
    }

  }, [])
}
