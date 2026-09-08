import React from 'react'
import { usePetStore } from '../pet/state/petStore'

export default function ActionBar(){
  const set = usePetStore.getState
  return (
    <>
      <button onClick={()=>{ const s = set().stats; set().stats = {...s, happiness: Math.min(100, s.happiness+8)} as any}}>Pet</button>
      <button onClick={()=>{ const s = set().stats; set().stats = {...s, playfulness: Math.min(100, s.playfulness+12), energy: Math.max(0, s.energy-5)} as any}}>Play</button>
      <button onClick={()=>{ const s = set().stats; set().stats = {...s, happiness: Math.min(100, s.happiness+12)} as any}}>Gift</button>
      <button onClick={()=>alert('Talk panel coming in later phases')}>Talk</button>
    </>
  )
}
