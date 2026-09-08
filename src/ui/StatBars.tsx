import React from 'react'
import { usePetStore } from '../pet/state/petStore'

export default function StatBars(){
  const stats = usePetStore(s=>s.stats)
  return (
    <div>
      <div style={{marginBottom:8}}>Happiness <strong>{Math.round(stats.happiness)}</strong></div>
      <progress value={stats.happiness} max={100} style={{width:'100%'}} />
      <div style={{marginTop:8}}>Energy <strong>{Math.round(stats.energy)}</strong></div>
      <progress value={stats.energy} max={100} style={{width:'100%'}} />
      <div style={{marginTop:8}}>Affection <strong>{Math.round(stats.affection)}</strong></div>
      <progress value={stats.affection} max={100} style={{width:'100%'}} />
      <div style={{marginTop:8}}>Playfulness <strong>{Math.round(stats.playfulness)}</strong></div>
      <progress value={stats.playfulness} max={100} style={{width:'100%'}} />
    </div>
  )
}
