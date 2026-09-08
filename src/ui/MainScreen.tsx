import React from 'react'
import AnimatedSprite from '../animation/AnimatedSprite'
import { usePetStore } from '../pet/state/petStore'
import { useDecayLoop } from '../pet/state/decayLoop'
import StatBars from './StatBars'
import ActionBar from './ActionBar'
import { useBehaviorEngine } from '../pet/behavior/behaviorEngine'
import { usePetGesture } from '../interactions/usePetGesture'

export default function MainScreen(){
  useDecayLoop()
  useBehaviorEngine()
  const mood = usePetStore(s=>s.mood)
  const behavior = usePetStore(s=>s.behavior)

  const { onPointerDown, onPointerMove, onPointerUp } = usePetGesture()

  return (
    <div className="app">
      <div className="header"><h1>Thumbi</h1><div>mood: {mood} • behavior: {behavior}</div></div>
      <div className="stage">
        <div className="canvasWrap" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><AnimatedSprite /><div className="loader" style={{display:'none'}}>Loading Thumbi…</div></div>
        <div className="statbars"><StatBars /></div>
      </div>
      <div className="actionbar"><ActionBar /></div>
    </div>
  )
}
