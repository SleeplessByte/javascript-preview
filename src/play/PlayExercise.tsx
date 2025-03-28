import { AnimatePresence, motion } from 'framer-motion'
import { highlight, languages } from 'prismjs'
import React, {
  Fragment,
  RefObject,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import equal from 'react-fast-compare'
import {
  Route,
  RouteComponentProps,
  Switch,
  useHistory,
} from 'react-router-dom'

import { Button, ButtonLink } from '../core/Button'
import { Loading } from '../core/Loading'
import { Modal } from '../core/Modal'
import { Portal } from '../core/Portal'
import { PortalHost } from '../core/Portal/PortalHost'
import { Header } from '../editor/Header'
import { emit, useEvent } from '../editor/useEvent'
import { unlock } from '../state/useHasPrerequisites'
import { markAsSolved, useHasSolved } from '../state/useHasSolved'
import { useUserCode } from '../state/useUserCode'
import { FailedTestRun, runTests } from '../tests/runner'
import { TestRun } from '../tests/types'
import { TRACK_TO_CODE_LANGUAGE } from '../track/mappings'
import { SupportedTrack } from '../track/types'
import { useConfig } from '../track/useConfig'
import { useExercise } from '../track/useExercise'

import styles from './styles.module.css'
import './highlight.css'
import { ModuleKind, ModuleResolutionKind, ScriptTarget, transpile } from 'typescript'

type CurrentExerciseProps = {
  track: SupportedTrack
  type: 'concept' | 'practice'
  slug: string
}

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
  const { data: config, refresh: refreshConfig } = useConfig(track)
  const { data: exercise, refresh: refreshExercise } = useExercise(
    track,
    type,
    slug
  )
  const { data: code, update: updateCode } = useUserCode(track, type, slug)
  const { stub, types } = exercise || {}

  const resetExercise = useCallback(() => {
    stub && updateCode(stub)
    setResetIteration((prev) => prev + 1)
  }, [updateCode, stub])

  const solveExercise = useCallback(() => {
    if (!config) {
      return
    }

    markAsSolved(track, type, slug)

    // Unlocks concepts
    if (type === 'concept') {
      const exercise = config.exercises[type].find(
        (exercise) => exercise.slug === slug
      )
      if (exercise) {
        unlock(exercise.concepts)
      }
    }
  }, [track, type, slug, config])

  const refresh = useCallback(() => {
    refreshExercise()
    refreshConfig()
  }, [refreshExercise, refreshConfig])

  // Initial stub to code
  useEffect(() => {
    if (code === null && stub) {
      updateCode(stub)
      emit('instructions')
    }
  }, [code, updateCode, stub])

  useEvent('refresh', refresh)
  useEvent('reset', resetExercise)
  useEvent('unlock', solveExercise)

  return (
    <PortalHost>
      <main
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'auto 500px',
          gridTemplateRows: '48px auto 200px',
          gridTemplateAreas: `
            "header header"
            "editor side"
            "bottom side
          `,
          justifyItems: 'stretch',
          alignItems: 'stretch',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Header track={track} type={type} slug={slug} />
        <Suspense fallback={<Loading />}>
          <Editor
            key={resetIteration}
            track={track}
            ready={!!(stub && code)}
            code={
              stub ? (typeof code === 'string' ? code : undefined) : undefined
            }
            saveCode={updateCode}
            types={
              (types || '').startsWith('404') ? undefined : types || undefined
            }
          />
        </Suspense>
        <SidePanel track={track} type={type} slug={slug} />
        <BottomPanel track={track} type={type} slug={slug} />
      </main>

      <Popups track={track} type={type} slug={slug} />
      <Notifications />
    </PortalHost>
  )
}

function Editor({
  track,
  code,
  saveCode,
  ready,
  types,
}: {
  track: SupportedTrack
  code: string | undefined
  types: string | undefined
  ready: boolean
  saveCode(next: string): void
}) {
  const codeRef = useRef<string>()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [{ width, height }, setSize] = useState<{
    width: string | number
    height: string | number
  }>({ width: '100%', height: '100%' })

  useEffect(() => {
    let lastAnimationFrame: number | undefined

    function determineNewSize() {
      lastAnimationFrame = undefined
      const { current } = containerRef
      if (!current) {
        return
      }

      setSize(current.getBoundingClientRect())
    }

    function onResize() {
      if (lastAnimationFrame) {
        return
      }

      lastAnimationFrame = requestAnimationFrame(determineNewSize)
    }

    window.addEventListener('resize', onResize)
    return () => {
      lastAnimationFrame !== undefined &&
        cancelAnimationFrame(lastAnimationFrame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  codeRef.current = code

  if (code === undefined || !ready) {
    return <Loading />
  }

  return (
    <div ref={containerRef} style={{ gridArea: 'editor', overflow: 'hidden' }}>
      <LazyEditor
        language={TRACK_TO_CODE_LANGUAGE[track]}
        onCodeUpdated={saveCode}
        codeRef={codeRef as RefObject<string>}
        types={types}
        width={width}
        height={height}
      />
    </div>
  )
}

function SidePanel({ track, type, slug }: CurrentExerciseProps) {
  const { data } = useExercise(track, type, slug)

  return (
    <section
      className={styles['panel']}
      style={{
        gridArea: 'side',
        padding: '12px 16px',
        fontSize: 14,
        overflow: 'auto',
        background: '#1e1e1e',
        color: 'rgba(255, 255, 255, 0.8)',
        borderLeft: '1px solid rgba(255, 255, 255, .1)',
        lineHeight: '150%',
        boxShadow: '#000000 0 4px 6px -6px inset',
      }}
    >
      <Instructions
        introduction={(data && data.introduction) || null}
        instructions={(data && data.instructions) || null}
      />
    </section>
  )
}

const MemoRunTests = React.memo(RunTests)
const EMPTY = ''

function BottomPanel({ track, type, slug }: CurrentExerciseProps) {
  const [completed, setCompleted] = useState(false)
  const [testableCode, setTestableCode] = useState<string | null>(null)
  const { data: code } = useUserCode(track, type, slug)
  const { data: exercise } = useExercise(track, type, slug)

  const afterHref = `/${track}/play/${type}/${slug}/after`
  const ready = testableCode && exercise
  const codeRef = useRef<string | null>(testableCode)
  const onCompleted = useCallback(() => setCompleted(true), [setCompleted])

  codeRef.current = testableCode

  useEffect(() => {
    if (equal(code, codeRef.current)) {
      return
    }

    const timeout = setTimeout(() => setTestableCode(code || null), 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [code])

  return (
    <section
      className={styles['panel']}
      style={{
        gridArea: 'bottom',
        borderTop: '1px solid rgba(255, 255, 255, .1)',
        background: '#1e1e1e',
        color: 'rgba(255, 255, 255, .8)',
        padding: '12px 16px',
        fontSize: 14,
        overflow: 'auto',
      }}
    >
      {completed && (
        <ButtonLink
          type="secondary"
          to={afterHref}
          style={{ fontSize: 12, marginBottom: 12 }}
        >
          Complete exercise
        </ButtonLink>
      )}
      {ready && (
        <MemoRunTests
          slug={slug}
          code={testableCode || EMPTY}
          tests={exercise!.tests || EMPTY}
          shouldTranspile={track === 'typescript'}
          onCompleted={onCompleted}
        />
      )}
    </section>
  )
}

function Popups({ track, type, slug }: CurrentExerciseProps) {
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
      <Route
        render={() => {
          emit('focus')
          return null
        }}
      />
    </Switch>
  )
}

function InstructionsPopup(props: RouteComponentProps<CurrentExerciseProps>) {
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
        <Instructions introduction={introduction} instructions={instructions} />
      </Modal>
    </Portal>
  )
}

function Instructions({
  introduction,
  instructions,
}: {
  introduction: string | null
  instructions: string | null
}) {
  return (
    <Suspense fallback={<Loading />}>
      <h2 style={{ marginTop: 0 }}>Introduction</h2>
      {introduction && (
        <LazyMarkdown source={introduction} renderers={{ code: CodeBlock }} />
      )}

      <h2 style={{ marginTop: 40 }}>Instructions</h2>
      {instructions && (
        <LazyMarkdown source={instructions} renderers={{ code: CodeBlock }} />
      )}
    </Suspense>
  )
}

class CodeBlock extends React.Component<
  { language: string; value: string },
  { hasError: boolean }
> {
  constructor(props: { language: string; value: string }) {
    super(props)

    this.state = {
      hasError: false,
    }
  }

  componentDidCatch(err: Error) {
    this.setState({ hasError: true })
  }

  render() {
    const cls = 'language-' + this.props.language
    const html =
      this.state.hasError || !languages[this.props.language]
        ? this.props.value
        : highlight(
            this.props.value,
            languages[this.props.language],
            this.props.language
          )

    return (
      <pre className={`codeblock ${cls}`} style={{ lineHeight: '19px' }}>
        <code
          dangerouslySetInnerHTML={{ __html: html || '' }}
          className={cls}
        />
      </pre>
    )
  }
}

function HintsPopup(props: RouteComponentProps<CurrentExerciseProps>) {
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

function RunTestsPopup(props: RouteComponentProps<CurrentExerciseProps>) {
  const [completed, setCompleted] = useState(false)
  const { track, type, slug } = props.match.params
  const { goBack } = useHistory()
  const { data: code } = useUserCode(track, type, slug)
  const { data: exercise } = useExercise(track, type, slug)
  const afterHref = `/${track}/play/${type}/${slug}/after`

  if (code === null || code === undefined || exercise === null) {
    return null
  }

  return (
    <Portal>
      <Modal
        title="Test Results"
        visible={true}
        onBack={goBack}
        footer={
          completed ? (
            <ButtonLink to={afterHref}>Complete exercise</ButtonLink>
          ) : null
        }
      >
        <RunTests
          slug={slug}
          code={code}
          tests={exercise.tests || ''}
          onCompleted={() => setCompleted(true)}
          shouldTranspile={track === 'typescript'}
        />
      </Modal>
    </Portal>
  )
}

function RunTests({
  slug,
  code,
  tests,
  shouldTranspile,
  onCompleted,
}: {
  slug: string
  code: string
  tests: string
  shouldTranspile: boolean
  onCompleted: () => void
}) {
  const [result, setResult] = useState<FailedTestRun | TestRun>()
  const cleanupRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    // Unmounting

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const cleanup = cleanupRef.current
      cleanup && cleanup()
    }
  }, [])

  useEffect(() => {
    let stillCareAboutThis = true
    let effectTests = tests
    let effectCode = code

    // Cleanup previous run
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    if (shouldTranspile) {
      effectTests = transpile(effectTests, {
        "skipLibCheck": true,
        "module": ModuleKind.ESNext,
        "moduleResolution": ModuleResolutionKind.Bundler,
        "target": ScriptTarget.ESNext,
        "isolatedModules": true,
        "esModuleInterop": true,
        "noEmit": true,
        "allowImportingTsExtensions": true,
        "outDir": "dist",
        "lib": [ "esnext" ],
        "baseUrl": "./",
      })
      effectCode = transpile(effectCode, {
        "skipLibCheck": true,
        "module": ModuleKind.ESNext,
        "moduleResolution": ModuleResolutionKind.Bundler,
        "target": ScriptTarget.ESNext,
        "isolatedModules": true,
        "esModuleInterop": true,
        "noEmit": true,
        "allowImportingTsExtensions": true,
        "outDir": "dist",
        "lib": [ "esnext" ],
        "baseUrl": "./",
      })
    }

    runTests(effectTests || '', effectCode || '', slug).then(
      ({ cleanup, ...result }) => {
        if (stillCareAboutThis) {
          cleanupRef.current = cleanup
          setResult(result)

          if ('complete' in result) {
            if (result.complete) {
              emit('unlock')
              onCompleted()
            }
          }
        } else {
          cleanup()
        }
      },
      ({ cleanup, ...result }) => {
        if (stillCareAboutThis) {
          cleanupRef.current = cleanup
          setResult(result)
        } else {
          cleanup()
        }
      }
    )

    return () => {
      stillCareAboutThis = false
    }
  }, [code, tests, slug, onCompleted, shouldTranspile])

  if (!result) {
    return <Loading />
  }

  if (!('complete' in result)) {
    return (
      <Fragment>
        <h3 style={{ marginTop: 10 }}>Tests did not run to completion</h3>
        <p>{result.message}</p>
      </Fragment>
    )
  }

  return (
    <table style={{ width: '100%' }}>
      <tbody>
        {result.messages.map(({ test, message, details }, index) => {
          return (
            <Fragment key={index}>
              <tr key={test}>
                <td style={{ width: 24 }}>
                  {message === 'passed' ? '✅' : '💥'}
                </td>
                <td>
                  <code>{test}</code>
                </td>
              </tr>
              {details && (
                <tr key={`${test}-error`}>
                  <td colSpan={2}>
                    <p
                      style={{
                        marginTop: 4,
                        color: 'red',
                        fontFamily: 'monospace',
                        fontSize: 14,
                      }}
                    >
                      {details}
                    </p>
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2}>
            <code
              style={{ marginTop: 16, fontWeight: 'bold', display: 'block' }}
            >
              Ran {result.passed} /{' '}
              {result.passed + result.skipped + result.failed} tests
            </code>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

function AfterPopup(props: RouteComponentProps<CurrentExerciseProps>) {
  const { track, type, slug } = props.match.params
  const { data } = useExercise(track, type, slug)
  const { goBack } = useHistory()
  const hasSolved = useHasSolved(track, type, slug)

  if (!data) {
    return null
  }

  if (!hasSolved) {
    return (
      <Portal>
        <Modal title="Not yet solved" visible={true} onBack={goBack}>
          <p>
            Complete this exercise to unlock the extra content for this
            exercise.
          </p>
        </Modal>
      </Portal>
    )
  }

  const { after } = data

  return (
    <Portal>
      <Modal
        title="Congratulations"
        visible={true}
        onBack={goBack}
        footer={
          <ButtonLink to={`/${track}/exercises`}>Next exercise</ButtonLink>
        }
      >
        <Suspense fallback={<Loading />}>
          {(after && !after.startsWith('404: Not Found') && (
            <LazyMarkdown source={after} />
          )) ||
            'No additional content'}
        </Suspense>
      </Modal>
    </Portal>
  )
}

function Notifications() {
  const [notifications, setNotifications] = useState<
    Array<{ title: string; details: string; key: string }>
  >([])

  const onNotificationReceived = useCallback(
    (notification: { title: string; details: string }) => {
      const newNotification = {
        ...notification,
        key: Math.random().toString(16).slice(2),
      }

      setNotifications((current) => [...current, newNotification])

      // TODO: make safe for unmounts
      setTimeout(() => {
        setNotifications((current) =>
          current.filter(
            (currentNotification) => currentNotification !== newNotification
          )
        )
      }, 1000 * 5)
    },
    [setNotifications]
  )

  useEvent('notification', onNotificationReceived)

  return (
    <Portal>
      <ol
        style={{
          position: 'absolute',
          right: 32,
          bottom: 32,
          display: 'flex',
          flexDirection: 'column',
          margin: 0,
          padding: 0,
          listStyle: 'none',
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {notifications.map(({ title, details, key }) => (
            <motion.li
              key={key}
              exit="exit"
              initial="hidden"
              animate="visible"
              whileHover="active"
              style={{
                color: 'white',
                background: '#333',
                padding: '8px 12px',
                borderRadius: 8,
                marginTop: 12,
                minWidth: 100,
                maxWidth: 240,
                boxShadow: '6px 6px 3px rgba(0, 0, 0, .25)',
              }}
              variants={{
                hidden: { opacity: 0, y: 10, scale: 0.9 },
                exit: {
                  opacity: 0,
                  scale: 0.5,
                  transition: { duration: 0.125, ease: 'easeIn' },
                },
                visible: {
                  opacity: 0.8,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.225, ease: 'easeOut' },
                },
                active: {
                  opacity: 1,
                  transition: { duration: 0.225, ease: 'easeInOut' },
                },
              }}
            >
              <header style={{ fontWeight: 'bold' }}>{title}</header>
              <p style={{ marginBottom: 4, fontSize: 14 }}>{details}</p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </Portal>
  )
}
