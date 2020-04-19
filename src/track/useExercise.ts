import { SupportedTrack } from './types'
import { useMemo, useEffect, useState, useCallback } from 'react'
import { StoredMemoryValue, useMutableMemoryValue } from '../state/state'
import { SOURCE_EXT, TESTS_EXT } from './mappings'

interface RefreshableExercise {
  track: SupportedTrack
  type: 'concept' | 'practice'
  slug: string

  data: null | {
    stub: string | null
    introduction: string | null
    instructions: string | null
    hints: string | null
    tests: string | null
    after: string | null
    types: string | null
  }

  refresh(): void
}

export function useExercise(
  track: SupportedTrack,
  type: 'concept' | 'practice',
  slug: string
): RefreshableExercise {
  const [forceRefreshCount, setForceRefreshCount] = useState(0)

  const currentExercise = useMemo(
    () =>
      new StoredMemoryValue<Omit<RefreshableExercise, 'refresh' | 'reset'>>(
        `${track}/${type}/${slug}`
      ),
    [track, type, slug]
  )

  const { current: exercise, set: setExercise } = useMutableMemoryValue(
    currentExercise
  )

  const refresh = useCallback(
    () => setForceRefreshCount((count) => count + 1),
    [setForceRefreshCount]
  )

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    // forceRefreshCount

    Promise.all([
      fetch(
        `https://raw.githubusercontent.com/exercism/v3/master/languages/${track}/exercises/${type}/${slug}/${slug}.${SOURCE_EXT[track]}`,
        { signal }
      ).then((response) => response.text()),
      fetch(
        `https://raw.githubusercontent.com/exercism/v3/master/languages/${track}/exercises/${type}/${slug}/${slug}.${TESTS_EXT[track]}`,
        { signal }
      ).then((response) => response.text()),
      fetch(
        `https://raw.githubusercontent.com/exercism/v3/master/languages/${track}/exercises/${type}/${slug}/.docs/introduction.md`,
        { signal }
      ).then((response) => response.text()),
      fetch(
        `https://raw.githubusercontent.com/exercism/v3/master/languages/${track}/exercises/${type}/${slug}/.docs/instructions.md`,
        { signal }
      ).then((response) => response.text()),
      fetch(
        `https://raw.githubusercontent.com/exercism/v3/master/languages/${track}/exercises/${type}/${slug}/.docs/hints.md`,
        { signal }
      ).then((response) => response.text()),
      fetch(
        `https://raw.githubusercontent.com/exercism/v3/master/languages/${track}/exercises/${type}/${slug}/.docs/after.md`,
        { signal }
      ).then((response) => response.text()),
      fetch(
        `https://raw.githubusercontent.com/exercism/v3/master/languages/${track}/exercises/${type}/${slug}/global.d.ts`,
        { signal }
      )
        .then((response) => response.text())
        .catch(() => null),
    ])
      .then(([stub, tests, introduction, instructions, hints, after, types]) =>
        setExercise({
          track,
          type,
          slug,

          data: {
            stub,
            introduction,
            instructions,
            hints,
            tests,
            after,
            types
          },
        })
      )
      .catch(console.error)

    return () => {
      controller.abort()
    }
  }, [type, slug, track, setExercise, forceRefreshCount])

  return { track, type, slug, data: null, ...exercise, refresh }
}
