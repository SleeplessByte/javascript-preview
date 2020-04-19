import { SupportedTrack } from "../track/types";
import { useMemo } from "react";
import { StoredMemoryValue, useMutableMemoryValue } from "./state";

export function useUserCode(track: SupportedTrack, type: 'concept' | 'practice', slug: string) {
  const memoryValue = useMemo(() => new StoredMemoryValue<string>(`${track}/${type}/${slug}.js`, true), [track, type, slug])
  const { current, set } = useMutableMemoryValue(memoryValue)

  return { data: current, update: set }
}
