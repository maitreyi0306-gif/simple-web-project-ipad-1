// src/sound/soundManager.ts
export let audioCtx: AudioContext | null = null

export function initAudio(){
  if(audioCtx) return
  audioCtx = (window.AudioContext || (window as any).webkitAudioContext) ? new (window.AudioContext as any)() : null
}

function playTone(frequency:number, duration=0.35, type: OscillatorType = 'sine'){
  if(!audioCtx) return
  const now = audioCtx.currentTime
  const o = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  o.type = type
  o.frequency.setValueAtTime(frequency, now)
  o.connect(g)
  g.connect(audioCtx.destination)
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.06, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  o.start(now)
  o.stop(now + duration)
}

export function playSound(name: string){
  initAudio()
  if(!audioCtx) return
  switch(name){
    case 'happy_squeak':
      playTone(880, 0.25, 'sine')
      break
    case 'surprise':
      playTone(660, 0.28, 'sine')
      break
    case 'sleepy_yawn':
      playTone(220, 0.6, 'sine')
      break
    case 'annoyed_grumble':
      playTone(220, 0.18, 'sawtooth')
      break
    default:
      playTone(440, 0.18, 'sine')
  }
}
