import React from 'react'
import { motion } from 'framer-motion'

export default function AnimatedSprite(){
  // simple DOM puppet using Framer Motion transforms
  return (
    <motion.div style={{width:300,height:300,display:'flex',alignItems:'center',justifyContent:'center'}}
      animate={{ y: [0,-6,0], rotate: [0,1,0,-1,0] }}
      transition={{ duration:3, ease:'easeInOut', repeat: Infinity }}
    >
      <div style={{width:220,height:300,background:'#fff',borderRadius:12,boxShadow:'0 10px 30px rgba(0,0,0,0.08)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {/* Placeholder art block - replaceable with sprite sheet later */}
        <div style={{width:180,height:260,background:`repeating-linear-gradient(45deg,#f6eae7 0 6px,#efd9d7 6px 12px)`,borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:12}}>
          <div style={{width:96,height:96,background:'#2a1f1a',borderRadius:99,marginBottom:12}}></div>
          <div style={{width:120,height:12,background:'#7c2a43',borderRadius:6,marginBottom:8}}></div>
          <div style={{width:80,height:12,background:'#3b82f6',borderRadius:6}}></div>
        </div>
      </div>
    </motion.div>
  )
}
