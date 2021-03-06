import { SupportedTrack } from "../track/types";
import { useMemo } from "react";
import { useMutableMemoryValue, globalStoredValue } from "./state";

export function useUserCode(track: SupportedTrack, type: 'concept' | 'practice', slug: string) {
  const memoryValue = useMemo(() => globalStoredValue<string>(`${track}/${type}/${slug}.js`, true), [track, type, slug])
  const { current, set } = useMutableMemoryValue(memoryValue)

  return { data: current, update: set }
}
