import React from 'react'
import profileSrc from './profile.jpg'

import styles from './styles.module.css'
import { ButtonLink, ExternalLink } from '../core/Button'

export function Lobby() {
  return (
    <main className={styles['lobby']}>
      <Welcome />
      <Limitations />
      <CTA />
    </main>
  )
}

function Welcome() {
  return (
    <header>
      <h1>Exercism v3 playground</h1>
      <div className={styles['author']}>
        <img
          src={profileSrc}
          className={styles['profile']}
          alt="Profile of @SleeplessByte"
        />
        <p>
          Hi there! I,{' '}
          <ExternalLink href="https://derk-jan.com">
            @SleeplessByte
          </ExternalLink>{' '}
          created this preview playground to make it easier to test the new
          exercises we're currently creating. This playground is completely
          experimental, but feel free to{' '}
          <ExternalLink href="https://github.com/SleeplessByte/javascript-preview">
            report bugs
          </ExternalLink>{' '}
          or contribute.
        </p>
      </div>
    </header>
  )
}

function Limitations() {
  return (
    <section className={styles['limitations']}>
      <h2>Limitations</h2>
      <p>
        At this moment, there are various <em>limitations</em> to this
        playground, as it's a playground.
      </p>
      <ul>
        <li>
          Requires to be at least ES2015 compliant. This means for example your
          browser needs to understand{' '}
          <ExternalLink href="https://caniuse.com/#feat=const">
            <code>const</code>
          </ExternalLink>{' '}
          and{' '}
          <ExternalLink href="https://caniuse.com/#feat=es6-module-dynamic-import">
            dynamic <code>import()</code>
          </ExternalLink>
          . This is necessary to modularize the code you write, and the tests,
          and inject your code as a dependency inside the test.
        </li>
        <li>
          Requires support for{' '}
          <ExternalLink href="https://caniuse.com/#feat=abortcontroller">
            <code>AbortController</code>
          </ExternalLink>
          , in order to abort <code>fetch</code> requests (which are{' '}
          <code>Promise</code>-based) when they're no longer needed.
        </li>
        <li>
          Does <strong>not</strong> <em>transiple</em> your code. This means the
          code you write should only use features your browser understands.
        </li>
        <li>
          Does <strong>not</strong> use a full-fledged test-runner (like Jest).
          Support for tests is increasing, but limited. This means that new
          exercise might take a while to be supported in this playground.
        </li>
        <li>
          Does <strong>not</strong> "sandbox" your code or the tests. This is
          generally just fine as it will <em>not</em> use <em>any</em>{' '}
          depenencies, and the only attack vector is <em>your own input</em>.
        </li>
        <li>
          Only supports the <code>javascript</code> track. Support for{' '}
          <code>typescript</code> will come and after that anything that is
          supported with WebAssembly.
        </li>
        <li>Accessibility might be spotty.</li>
        <li>No support for mobile.</li>
      </ul>
    </section>
  )
}

function CTA() {
  return (
    <section className={styles['actions']}>
      <ButtonLink to="/javascript/exercises" style={{ marginRight: 4 }}>Go to JavaScript</ButtonLink>
      <ButtonLink to="/typescript/exercises">Go to TypeScript</ButtonLink>
    </section>
  )
}
