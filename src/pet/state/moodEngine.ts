import { PetStats, Mood } from './petStore'

// Table of mood thresholds with priority
const moodTable: { key: Mood; condition: (s:PetStats)=>boolean }[] = [
  { key: 'sleepy', condition: s => s.energy < 25 },
  { key: 'sad_ignored', condition: s => s.happiness < 35 },
  { key: 'mischievous', condition: s => s.mischief > 70 },
  { key: 'excited', condition: s => s.happiness > 85 && s.playfulness > 60 },
  { key: 'annoyed', condition: s => s.affection < 20 },
  { key: 'happy', condition: s => s.happiness > 75 },
  { key: 'curious', condition: s => s.socialBattery > 60 && s.playfulness > 40 },
  { key: 'content', condition: s => true }
]

export function moodEngine(stats:PetStats): Mood{
  for(const row of moodTable){ if(row.condition(stats)) return row.key }
  return 'content'
}
