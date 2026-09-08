import React from 'react'
import AnimatedSprite from '../animation/AnimatedSprite'
import { usePetStore } from '../pet/state/petStore'
import { useDecayLoop } from '../pet/state/decayLoop'
import StatBars from './StatBars'
import ActionBar from './ActionBar'

export default function MainScreen(){
  useDecayLoop()
  const mood = usePetStore(s=>s.mood)

  return (
    <div className="app">
      <div className="header"><h1>Thumbi</h1><div>mood: {mood}</div></div>
      <div className="stage">
        <div className="canvasWrap"><AnimatedSprite /><div className="loader" style={{display:'none'}}>Loading Thumbi…</div></div>
        <div className="statbars"><StatBars /></div>
      </div>
      <div className="actionbar"><ActionBar /></div>
    </div>
  )
}
