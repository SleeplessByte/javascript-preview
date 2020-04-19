export interface ConceptExercise {
  slug: string
  uuid: string
  concepts: [string, ...string[]]
  prerequisites: string[]
}
export interface PracticeExercise {
  slug: string
  uuid: string
  prerequisites: string[]
}

export interface Configuration extends Readonly<Configuration> {
  language: 'JavaScript'
  active: true
  blurb: string
  test_pattern: string
  version: 3
  online_editor: {
    indent_style: 'space' | 'tab'
    indent_size: number
  }
  exercises: {
    concept: readonly ConceptExercise[]
    practice: readonly PracticeExercise[]
  }
}

export type Exercise =
  | ConceptExercise
  | PracticeExercise

export type SupportedTrack =
  | 'javascript'
  | 'typescript'
