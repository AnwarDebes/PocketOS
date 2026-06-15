import { createContext, useContext } from 'react'

export interface WorkArea {
  left: number
  top: number
  width: number
  height: number
}

/** Pixel geometry of the window work area (the region between status bar and dock). */
export const WorkAreaContext = createContext<WorkArea>({ left: 0, top: 0, width: 0, height: 0 })

export function useWorkArea(): WorkArea {
  return useContext(WorkAreaContext)
}
