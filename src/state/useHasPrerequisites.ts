import { StoredMemoryValue, useMemoryValue } from "./state";

export const UNLOCKS = new StoredMemoryValue<string[]>('unlocks')

export function useHasPrerequisites(locks: string[]) {
  const unlocks = useMemoryValue(UNLOCKS)

  if (unlocks === undefined) {
    return false
  }

  if (locks === undefined || locks.length === 0){
    return true
  }

  if (unlocks === null) {
    return false
  }

  return locks.every((lock) => unlocks.includes(lock))
}
