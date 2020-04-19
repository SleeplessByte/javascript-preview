import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useConfig } from './useConfig'

import { Loading } from '../core/Loading'
import { Button, ButtonLink } from '../core/Button'

import styles from './styles.module.css'
import { ConceptExercise, PracticeExercise, SupportedTrack } from './types'
import { useHasPrerequisites } from '../state/useHasPrerequisites'

export function Exercises(
  props: RouteComponentProps<{ track: SupportedTrack }>
) {
  const track = props.match.params.track
  const { data: config, refresh } = useConfig(track)

  if (!config) {
    return <Loading />
  }

  return (
    <main className={styles['exercises']}>
      <h1>{config.language} v3</h1>

      <header>{config.blurb}</header>

      <ConceptExercises track={track} exercises={config.exercises.concept} />

      <PracticeExercises track={track} exercises={config.exercises.practice} />

      <footer className={styles['actions']}>
        <Button onClick={refresh}>Refresh</Button>
      </footer>
    </main>
  )
}

function ConceptExercises({
  track,
  exercises,
}: {
  track: SupportedTrack
  exercises: readonly ConceptExercise[]
}) {
  if (exercises.length === 0) {
    return null
  }

  return (
    <section className={styles['exercises__list']}>
      <h2>Concept exercises</h2>
      <ul>
        {exercises.map(({ slug, prerequisites }) => (
          <li key={slug}>
            <ExerciseLink
              track={track}
              slug={slug}
              type="concept"
              prerequisites={prerequisites}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function PracticeExercises({
  track,
  exercises,
}: {
  track: SupportedTrack
  exercises: readonly PracticeExercise[]
}) {
  if (exercises.length === 0) {
    return null
  }

  return (
    <section className={styles['exercises__list']}>
      <h2>Practice exercises</h2>
      <ul>
        {exercises.map(({ slug, prerequisites }) => (
          <li key={slug}>
            <ExerciseLink
              track={track}
              slug={slug}
              type="practice"
              prerequisites={prerequisites}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ExerciseLink({
  track,
  slug,
  type,
  prerequisites,
}: {
  track: SupportedTrack
  slug: string
  type: 'concept' | 'practice'
  prerequisites: string[]
}) {
  const enabled = useHasPrerequisites(prerequisites)
  return (
    <ButtonLink
      disabled={!enabled}
      to={`/${track}/play/${type}/${slug}`}
      type="secondary"
    >
      {slug}
    </ButtonLink>
  )
}
