import React from 'react'
import AnimatedSpriteCanvas from './AnimatedSpriteCanvas'

// Wrapper: prefer canvas-based renderer (Option B friendly) but keep DOM fallback if needed
export default function AnimatedSprite(){
  return (
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <AnimatedSpriteCanvas />
    </div>
  )
}
