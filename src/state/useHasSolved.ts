import { SupportedTrack } from '../track/types'
import { StoredMemoryValue, useMemoryValue } from './state'

type Solves = { [slug: string]: number }

type AllSolves = Partial<
  Record<
    SupportedTrack,
    {
      concept: Solves
      practice: Solves
    }
  >
>

export const SOLVES = new StoredMemoryValue<AllSolves>('solves', true, {
  javascript: { concept: {}, practice: {} },
})

export function useHasSolved(
  track: SupportedTrack,
  type: 'concept' | 'practice',
  slug: string
) {
  const value = useMemoryValue(SOLVES)

  if (!value) {
    return false
  }

  const trackValue = value[track]

  if (!trackValue) {
    return false
  }

  return trackValue[type][slug]
}

export function markAsSolved(
  track: SupportedTrack,
  type: 'concept' | 'practice',
  slug: string
) {
  if (SOLVES.current === undefined) {
    setTimeout(() => markAsSolved(track, type, slug), 0)
    return
  }

  const trackValue = (SOLVES.current || {})[track] || { concept: {}, practice: {} }

  SOLVES.emit({
    ...SOLVES.current,
    [track]: {
      ...trackValue,
      [type]: { ...trackValue[type], [slug]: new Date().getTime() },
    },
  })
}
