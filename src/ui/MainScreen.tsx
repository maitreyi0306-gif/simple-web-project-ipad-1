import React from 'react'
import AnimatedSprite from '../animation/AnimatedSprite'
import { usePetStore } from '../pet/state/petStore'
import { useDecayLoop } from '../pet/state/decayLoop'
import StatBars from './StatBars'
import ActionBar from './ActionBar'
import { useBehaviorEngine, notifyTap, notifyDrag, notifyRepeatedTap } from '../pet/behavior/behaviorEngine'

export default function MainScreen(){
  useDecayLoop()
  useBehaviorEngine()
  const mood = usePetStore(s=>s.mood)
  const behavior = usePetStore(s=>s.behavior)

  // pointer handling: detect repeated taps (simple rolling window)
  let tapTimes:number[] = []
  function onPointerDown(e:React.PointerEvent){
    const now = Date.now()
    tapTimes.push(now)
    // keep last 6
    if(tapTimes.length>6) tapTimes = tapTimes.slice(-6)
    // if >4 taps within 800ms, trigger repeated
    const recent = tapTimes.filter(t=>now-t<800)
    if(recent.length>4){ notifyRepeatedTap(); tapTimes = [] }
    else { notifyTap() }
  }

  function onPointerMove(e:React.PointerEvent){
    if(e.buttons){ notifyDrag() }
  }

  return (
    <div className="app">
      <div className="header"><h1>Thumbi</h1><div>mood: {mood} • behavior: {behavior}</div></div>
      <div className="stage">
        <div className="canvasWrap" onPointerDown={onPointerDown} onPointerMove={onPointerMove}><AnimatedSprite /><div className="loader" style={{display:'none'}}>Loading Thumbi…</div></div>
        <div className="statbars"><StatBars /></div>
      </div>
      <div className="actionbar"><ActionBar /></div>
    </div>
  )
}
