import { useMemo, useEffect, useCallback, useRef } from 'react'

import { Configuration, SupportedTrack } from './types'

import { StoredMemoryValue, useMemoryValue } from '../state/state'

type Actions = {
  refresh(): void
}

export function useConfig(
  track: SupportedTrack
): { data: Configuration | null | undefined } & Actions {
  const memoryValue = useMemo(
    () => new StoredMemoryValue<Configuration>(`${track}/config.json`),
    [track]
  )
  const configuration = useMemoryValue(memoryValue)
  const controller = useRef<AbortController>()

  useEffect(() => {
    controller.current = new AbortController()
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const current = controller.current

      current && current.abort()
    }
  }, [])

  useEffect(() => {
    if (configuration || !controller.current) {
      return
    }

    const { signal } = controller.current

    fetch(
      `https://raw.githubusercontent.com/exercism/v3/master/languages/${track}/config.json`,
      { signal }
    )
      .then((response) => response.json())
      .then((response) => memoryValue.emit(response))
      .catch((err) => {
        if (err instanceof DOMException) {
          return
        }

        alert(err)
      })
  }, [track, configuration, memoryValue])

  const refresh = useCallback(() => memoryValue.emit(null), [memoryValue])

  return { data: configuration, refresh }
}
