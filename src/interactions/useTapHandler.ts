import { useEffect } from 'react'

// very small hook to call on pointer taps (exported for MainScreen)
export function useTapHandler(onTap:(e:PointerEvent)=>void){
  useEffect(()=>{
    function handler(e:PointerEvent){ onTap(e) }
    window.addEventListener('pointerdown', handler)
    return ()=> window.removeEventListener('pointerdown', handler)
  }, [onTap])
}
