import create from 'zustand'
import { persist } from 'zustand/middleware'

export type Mood = 'happy'|'sleepy'|'mischievous'|'sad_ignored'|'excited'|'annoyed'|'content'|'curious'
export type Behavior = 'idle'|'wander'|'sleep'|'follow_finger'|'hide'|'peek'|'stretch'|'sit'|'dance'|'run_away'|'stare'

export interface PetStats{ happiness:number; energy:number; affection:number; playfulness:number; mischief:number; socialBattery:number }
export interface PetState{ stats:PetStats; mood:Mood; behavior:Behavior; position:{x:number;y:number}; lastInteractionAt:number; soundOn:boolean }

const initialStats:PetStats = { happiness:70, energy:70, affection:70, playfulness:50, mischief:10, socialBattery:80 }

export const usePetStore = create(persist<PetState>(()=>({
  stats: initialStats,
  mood:'content',
  behavior:'idle',
  position:{x:0,y:0},
  lastInteractionAt: Date.now(),
  soundOn:true
}), { name: 'thumbi_pet' }))
