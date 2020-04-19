import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  RefObject,
  useState,
  useLayoutEffect,
} from 'react'
import {
  RouteComponentProps,
  useHistory,
  Switch,
  Route,
} from 'react-router-dom'
import { SupportedTrack } from '../track/types'
import { Loading } from '../core/Loading'

import { TRACK_TO_CODE_LANGUAGE } from '../track/mappings'
import { Header } from '../editor/Header'
import { useExercise } from '../track/useExercise'
import { useEvent, emit } from '../editor/useEvent'
import { useUserCode } from '../state/useUserCode'
import { Modal } from '../core/Modal'
import { Portal } from '../core/Portal'
import { PortalHost } from '../core/Portal/PortalHost'
import { Button } from '../core/Button'
import { runTests } from '../tests/runner'

const LazyMarkdown = React.lazy(() =>
  import('react-markdown').then((i) => ({ default: i.default }))
)

const LazyEditor = React.lazy(() =>
  import('../editor/Editor').then((i) => ({ default: i.Editor }))
)

export function PlayExercise(
  props: RouteComponentProps<{
    track: SupportedTrack
    type: 'concept' | 'practice'
    slug: string
  }>
) {
  const [resetIteration, setResetIteration] = useState(1)
  const { track, type, slug } = props.match.params
  const { data: exercise, refresh: refreshExercise } = useExercise(
    track,
    type,
    slug
  )
  const { data: code, update: updateCode } = useUserCode(track, type, slug)
  const { stub } = exercise || {}

  const resetExercise = useCallback(() => {
    stub && updateCode(stub)
    setResetIteration((prev) => prev + 1)
  }, [updateCode, stub])

  // Initial stub to code
  useEffect(() => {
    if (code === null && stub) {
      updateCode(stub)
      emit('instructions')
    }
  }, [code, updateCode, stub])

  useEvent('refresh', refreshExercise)
  useEvent('reset', resetExercise)

  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Suspense fallback={<Loading />}>
        <PortalHost>
          <Header track={track} type={type} slug={slug} />
          <div style={{ flex: 1 }}>
            <Editor
              key={resetIteration}
              track={track}
              code={
                stub ? (typeof code === 'string' ? code : undefined) : undefined
              }
              saveCode={updateCode}
            />
          </div>
          <Popups track={track} type={type} slug={slug} />
        </PortalHost>
      </Suspense>
    </main>
  )
}

function Editor({
  track,
  code,
  saveCode,
}: {
  track: SupportedTrack
  code: string | undefined
  saveCode(next: string): void
}) {
  const codeRef = useRef<string>()

  codeRef.current = code

  if (code === undefined) {
    return <Loading />
  }

  return (
    <LazyEditor
      language={TRACK_TO_CODE_LANGUAGE[track]}
      onCodeUpdated={saveCode}
      codeRef={codeRef as RefObject<string>}
    />
  )
}

function Popups({
  track,
  type,
  slug,
}: {
  track: SupportedTrack
  type: 'concept' | 'practice'
  slug: string
}) {
  const {
    push,
    location: { pathname },
  } = useHistory()

  const gotoInstructions = useCallback(() => {
    if (pathname.endsWith('/instructions')) {
      return
    }

    setTimeout(() => push(`/${track}/play/${type}/${slug}/instructions`), 0)
  }, [push, pathname, track, type, slug])

  const gotoHints = useCallback(() => {
    if (pathname.endsWith('/hints')) {
      return
    }

    setTimeout(() => push(`/${track}/play/${type}/${slug}/hints`), 0)
  }, [push, pathname, track, type, slug])

  const gotoRunTests = useCallback(() => {
    if (pathname.endsWith('/run')) {
      return
    }

    setTimeout(() => push(`/${track}/play/${type}/${slug}/run`), 0)
  }, [push, pathname, track, type, slug])

  useEvent('instructions', gotoInstructions)
  useEvent('hints', gotoHints)
  useEvent('executeTests', gotoRunTests)

  return (
    <Switch>
      <Route
        path="/:track/play/:type/:slug/instructions"
        component={InstructionsPopup}
      />
      <Route path="/:track/play/:type/:slug/hints" component={HintsPopup} />
      <Route path="/:track/play/:type/:slug/run" component={RunTestsPopup} />
      <Route path="/:track/play/:type/:slug/after" component={AfterPopup} />
    </Switch>
  )
}

function InstructionsPopup(
  props: RouteComponentProps<{
    track: SupportedTrack
    type: 'concept' | 'practice'
    slug: string
  }>
) {
  const { track, type, slug } = props.match.params
  const { data } = useExercise(track, type, slug)
  const { goBack } = useHistory()

  if (!data) {
    return null
  }

  const { instructions, introduction } = data

  return (
    <Portal>
      <Modal title={`${type}/${slug}`} visible={true} onBack={goBack}>
        <Suspense fallback={<Loading />}>
          <h2 style={{ marginTop: 0 }}>Introduction</h2>
          {introduction && <LazyMarkdown source={introduction} />}

          <h2 style={{ marginTop: 40 }}>Instructions</h2>
          {instructions && <LazyMarkdown source={instructions} />}
        </Suspense>
      </Modal>
    </Portal>
  )
}

function HintsPopup(
  props: RouteComponentProps<{
    track: SupportedTrack
    type: 'concept' | 'practice'
    slug: string
  }>
) {
  const { track, type, slug } = props.match.params
  const { data } = useExercise(track, type, slug)
  const { goBack } = useHistory()

  if (!data) {
    return null
  }

  const { hints } = data

  return (
    <Portal>
      <Modal title={`Hints for ${type}/${slug}`} visible={true} onBack={goBack}>
        <Suspense fallback={<Loading />}>
          {hints && (
            <LazyMarkdown
              source={hints}
              renderers={{ list: List, listItem: LisItem }}
            />
          )}
        </Suspense>
      </Modal>
    </Portal>
  )
}

const UnlockContext = React.createContext({ unlocks: 0, unlock: () => {} })

function List({
  children,
  ordered,
}: React.PropsWithChildren<{ ordered: boolean; depth: number }>) {
  const [unlocks, setUnlocks] = useState(0)
  const unlock = useCallback(() => {
    setUnlocks((c) => c + 1)
  }, [])

  return (
    <UnlockContext.Provider value={{ unlocks, unlock }}>
      {ordered ? <ol>{children}</ol> : <ul>{children}</ul>}
    </UnlockContext.Provider>
  )
}

function LisItem({
  index,
  children,
}: React.PropsWithChildren<{ index: number }>) {
  return (
    <UnlockContext.Consumer>
      {({ unlocks, unlock }) => (
        <li>
          {unlocks > index ? (
            children
          ) : (
            <Button
              style={{ fontSize: 14 }}
              onClick={() => unlock()}
              disabled={unlocks < index}
            >
              Show hint
            </Button>
          )}
        </li>
      )}
    </UnlockContext.Consumer>
  )
}

function RunTestsPopup(
  props: RouteComponentProps<{  track: SupportedTrack
    type: 'concept' | 'practice'
    slug: string }>
) {
  const { track, type, slug } = props.match.params
  const { goBack } = useHistory()
  const { data: code } = useUserCode(track, type, slug)
  const { data: exercise } = useExercise(track, type, slug)

  if (code === null || code === undefined || exercise === null) {
    return null
  }

  return (
    <Portal>
      <Modal title="Run Tests" visible={true} onBack={goBack}>
        <RunTests slug={slug} code={code} tests={exercise.tests || ''} />
      </Modal>
    </Portal>
  )
}

function RunTests({ slug, code, tests }: { slug: string, code: string, tests: string }) {
  const [result, setResult] = useState<object>()

  useEffect(() => {
    runTests(tests || '', code || '', slug)
      .then(setResult, setResult)
  }, [code, tests, slug])

  return (
    result ? <div>{JSON.stringify(result, undefined, 2)}</div> : <Loading />
  )
}

function AfterPopup(
  props: RouteComponentProps<{ track: string; type: string; slug: string }>
) {
  const { goBack } = useHistory()
  return (
    <Portal>
      <Modal title="After" visible={true} onBack={goBack}>
        Instructions
      </Modal>
    </Portal>
  )
}
