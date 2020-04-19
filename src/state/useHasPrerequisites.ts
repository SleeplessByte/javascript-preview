import { StoredMemoryValue, useMemoryValue } from './state'

export const UNLOCKS = new StoredMemoryValue<string[]>('unlocks')

export function useHasPrerequisites(locks: string[]) {
  const unlocks = useMemoryValue(UNLOCKS)

  if (unlocks === undefined) {
    return false
  }

  if (locks === undefined || locks.length === 0) {
    return true
  }

  if (unlocks === null) {
    return false
  }

  return locks.every((lock) => unlocks.includes(lock))
}

export function unlock(concepts: string[]) {
  if (UNLOCKS.current === undefined) {
    setTimeout(() => unlock(concepts), 0)
    return
  }

  const unlocks = UNLOCKS.current || [] || []
  const nextUnlocks = unlocks
    .concat(concepts)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort()

  UNLOCKS.emit(nextUnlocks)
}
