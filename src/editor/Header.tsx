import React, { useState, useRef, RefObject, useEffect } from 'react'

import styles from './styles.module.css'
import { Link } from 'react-router-dom'
import { SupportedTrack } from '../track/types'
import { emit } from './useEvent'

export interface HeaderProps {
  track: SupportedTrack
  type: 'concept' | 'practice'
  slug: string
}

export function Header({ track, type, slug }: HeaderProps) {
  const [active, setActive] = useState<'file' | 'view' | 'go' | 'help' | false>(
    false
  )

  const toggle = (next: typeof active) =>
    setActive((current) => (current === next ? false : next))
  const hover = (next: typeof active) =>
    setActive((current) => (current === false ? false : next))
  const dismiss = () => setActive(false)

  const file = useRef<HTMLLIElement | null>(null)
  const view = useRef<HTMLLIElement | null>(null)
  const go = useRef<HTMLLIElement | null>(null)
  const help = useRef<HTMLLIElement | null>(null)

  const activeRef = active ? { file, view, go, help }[active] : null

  return (
    <header className={styles['header']}>
      <ol className={styles['menu']}>
        <li ref={file}>
          <button
            className={styles['item']}
            onMouseOver={() => hover('file')}
            onClick={() => toggle('file')}
          >
            File
          </button>
        </li>
        <li ref={view}>
          <button
            className={styles['item']}
            onMouseOver={() => hover('view')}
            onClick={() => toggle('view')}
          >
            View
          </button>
        </li>
        <li ref={go}>
          <button
            className={styles['item']}
            onMouseOver={() => hover('go')}
            onClick={() => toggle('go')}
          >
            Go
          </button>
        </li>
        <li ref={help}>
          <button
            className={styles['item']}
            onMouseOver={() => hover('help')}
            onClick={() => toggle('help')}
          >
            Help
          </button>
        </li>
      </ol>
      {active && (
        <DropDown
          active={active}
          anchor={activeRef!}
          dismiss={dismiss}
          track={track}
          type={type}
          slug={slug}
        />
      )}
      <nav className={styles['info']}>
        <Link
          to={`/${track}/exercises`}
          className={[styles['button'], styles['type']]
            .filter(Boolean)
            .join(' ')}
        >
          {type}
        </Link>
        /
        <Link
          to={`/${track}/play/${type}/${slug}`}
          className={[styles['button'], styles['slug']]
            .filter(Boolean)
            .join(' ')}
        >
          {slug}
        </Link>
      </nav>
    </header>
  )
}

interface DropDownProps {
  active: 'file' | 'view' | 'go' | 'help'
  dismiss: () => void
  anchor: RefObject<HTMLElement>

  track: SupportedTrack
  type: 'concept' | 'practice'
  slug: string
}

function DropDown({
  active,
  anchor,
  dismiss,
  track,
  type,
  slug,
}: DropDownProps) {
  const { left, top } = anchor.current!.getBoundingClientRect()

  useEffect(() => {
    document.addEventListener('click', dismiss)
    return () => {
      document.removeEventListener('click', dismiss)
    }
  }, [dismiss])

  switch (active) {
    case 'file': {
      return <FileMenu left={left} top={top + 32} />
    }
    case 'view': {
      return (
        <ViewMenu
          left={left}
          top={top + 32}
          track={track}
          type={type}
          slug={slug}
        />
      )
    }
    case 'go': {
      return (
        <GoMenu
          left={left}
          top={top + 32}
        />
      )
    }
    case 'help': {
      return (
        <HelpMenu
          left={left}
          top={top + 32}
        />
      )
    }
  }

  return null
}

function FileMenu({ left, top }: { left: number; top: number }) {
  const doExport = () => { emit('export') }
  const doRefresh = () => { emit('refresh') }
  const doReset = () => { emit('reset') }

  return (
    <ul
      className={styles['menu__dropdown']}
      style={{ position: 'absolute', left, top }}
    >
      <li className={styles['item']}>
        <button onClick={doExport}>
          Export <KeyCommand>Ctrl + E</KeyCommand>
        </button>
      </li>
      <li className={styles['divider']} />
      <li className={styles['item']}>
        <button onClick={doRefresh}>
          Refresh exercise <KeyCommand>Ctrl + R</KeyCommand>
        </button>
      </li>
      <li className={styles['item']}>
        <button onClick={doReset}>Reset exercise</button>
      </li>
      <li className={styles['item']}>
        <Link to="/">Close editor</Link>
      </li>
    </ul>
  )
}

function ViewMenu({
  left,
  top,
  track,
  type,
  slug,
}: {
  left: number
  top: number
  track: SupportedTrack
  type: 'concept' | 'practice'
  slug: string
}) {
  const doCommand = () => { emit('commands') }
  const doInstructions = () => { emit('instructions') }
  const doHints = () => { emit('hints') }

  return (
    <ul
      className={styles['menu__dropdown']}
      style={{ position: 'absolute', left, top }}
    >
      <li className={styles['item']}>
        <button onClick={doCommand}>
          Command Palette&hellip; <KeyCommand>F1</KeyCommand>
        </button>
      </li>
      <li className={styles['divider']} />
      <li className={styles['item']}>
        <button onClick={doInstructions}>
          View Instructions <KeyCommand>Ctrl + I</KeyCommand>
        </button>
      </li>
      <li className={styles['item']}>
        <button onClick={doHints}>
          View Hints <KeyCommand>Ctrl + H</KeyCommand>
        </button>
      </li>
      <li className={styles['divider']} />
      <li className={styles['item']}>
        <a
          href={`https://github.com/exercism/v3/tree/master/languages/${track}/exercises/${type}/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </li>
    </ul>
  )
}

function GoMenu({
  left,
  top
}: {
  left: number
  top: number
}) {
  const runTests = () => { emit('executeTests') }

  return (
    <ul
      className={styles['menu__dropdown']}
      style={{ position: 'absolute', left, top }}
    >
      <li className={styles['item']}>
        <button onClick={runTests}>
          Run tests <KeyCommand>Ctrl + T</KeyCommand>
        </button>
      </li>
    </ul>
  )
}

function HelpMenu({
  left,
  top
}: {
  left: number
  top: number
}) {
  const showInstructions = () => { emit('instructions') }
  const showHints = () => { emit('hints') }

  return (
    <ul
      className={styles['menu__dropdown']}
      style={{ position: 'absolute', left, top }}
    >
      <li className={styles['item']}>
        <button onClick={showInstructions}>
          Exercise Instructions <KeyCommand>Ctrl + I</KeyCommand>
        </button>
      </li>
      <li className={styles['item']}>
        <button onClick={showHints}>
          Exercise Help <KeyCommand>Ctrl + H</KeyCommand>
        </button>
      </li>
      <li className={styles['divider']} />
      <li className={styles['item']}>
        <a href="https://github.com/SleeplessByte/javascript-preview/issues/new">
          Open Issue on Github
        </a>
      </li>
    </ul>
  )
}

function KeyCommand({ children }: React.PropsWithChildren<{}>) {
  return <span className={styles['key']}>{children}</span>
}
