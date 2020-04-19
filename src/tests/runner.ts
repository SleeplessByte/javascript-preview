import { TestRun } from "./types"

export type FailedTestRun = {
  message: string
}

export function runTests(exerciseTests: string, userCode: string, slug: string): Promise<(TestRun | FailedTestRun) & { cleanup: () => void }> {
  const { tests, object } = prepareTest(
    exerciseTests,
    userCode,
    slug
  )

  function cleanup() {
    console.log('[suite] cleaning up run', tests, object)
    URL.revokeObjectURL(tests)
    URL.revokeObjectURL(object)
  }

  return import(/* webpackIgnore: true */ `${tests}`)
    .then((result) => {
      return { ...result.run as TestRun, cleanup }
    })
    .catch((error) => {
      console.error('[suite] failed to run the tests \n', error)

      return { ...{ message: error.message } as FailedTestRun, cleanup }
    })
}

function prepareTest(tests: string, code: string, slug: string) {
  const importableCode = esm`${code}`

  const lines = tests
    .replace(`'./${slug}'`, `'${importableCode}'`)
    .replace(`"./${slug}"`, `'${importableCode}'`)
    .split('\n')

  lines.splice(
    lines.findIndex((l) => l.indexOf('from ') !== -1) + 1,
    0,
    TEST_HELPER
  )
  return { tests: esm`${lines.join('\n')}`, object: importableCode }
}

/*
try {
    return (
      'data:text/javascript;base64,' +
      btoa(code.replace(/’/g, '').replace(/‘/g, ''))
    )
  } catch (err) {
    if (err instanceof DOMException) {
      for (let c of code) {
        if (c.charCodeAt(0) >= 255 || !Number.isNaN(c.charCodeAt(1))) {
          console.warn('not 0-254 in code: ', c)
        }
      }

      console.warn(code)

      return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(code)
    }
  }
  */

 function esm2(templateStrings: TemplateStringsArray, ...substitutions: string[]) {
  let js = templateStrings.raw[0];
  for (let i=0; i<substitutions.length; i++) {
    js += substitutions[i] + templateStrings.raw[i+1];
  }
  return 'data:text/javascript;base64,' + btoa(js);
}

const esm = ({ raw }: TemplateStringsArray, ...vals: string[]) => URL.createObjectURL(new Blob([String.raw({ raw } as any, ...vals)], { type: 'text/javascript' }));

const TEST_HELPER = `
const run = {
  failed: 0,
  skipped: 0,
  passed: 0,
  messages: [],
  promises: [],
  complete: null
}

let failFast = true
let awaiting = 0

function startTest(name) {
  awaiting += 1
  console.log("[test] "+ name)
}

function passTest(name) {
  awaiting -= 1
  run.passed += 1

  run.messages.push({ test: name, message: 'passed' })
}

function failTest(name, err) {
  awaiting -= 1
  run.failed += 1
  run.messages.push({ test: name, message: 'failed', details: err.message })

  if (err instanceof AssertionFailed) {
    console.error(\`[test] failed assertion of \${name}.\\n\`, err.message)
  } else if (err instanceof SyntaxError) {
    failFast = true
    console.error(\`[test] syntax is not valid JavaScript \\n\`, err)
  } else {
    console.error(\`[test] failed to run \${name} \\n\`, err)
  }
}

function skipTest() {
  run.skipped += 1
}

function runSuite(name) {
  console.log("[suite] " + name)
  awaiting += 1
}

function finishSuite() {
  awaiting -= 1
  if (awaiting > 0) {
    return console.log("[suite] still running")
  }

  run.complete = run.failed === 0
}

async function test(name, c) {
  if (failFast && run.failed > 0) {
    skipTest()
    return
  }

  startTest(name)

  try {
    await c()
    passTest(name)
  } catch (err) {
    failTest(name, err)
  }
}

const xtest = test
const it = test
const xit = test

async function describe(name, c) {
  runSuite(name)
  await c()
  await Promise.all(run.promises)
  finishSuite()
}

function promise(p) {
  run.promises.push(p)
  return p
}

class AssertionFailed extends Error {
}

function expect(value) {
  return {
    resolves: {
      toBe(x) {
        return promise(
          value.then(
            (resolved) => {
              if (x !== resolved) {
                throw new AssertionFailed(\`Expected \${JSON.stringify(resolved, undefined, 2)} to be \${x}\`)
              }
            }
          )
        )
      }
    },
    rejects: {
      toThrow(x) {
        return promise(
          value.then(
            () => {
              throw new AssertionFailed(\`Expected error \${x}\`)
            },
            () => { /* */ }
          )
        )
      }
    },
    toBeCloseTo(x, y = 0.01) {
      if (Math.abs(value - x) <= y) {
        return true
      }

      throw new AssertionFailed(\`Expected \${value} to be close to \${x}\`)
    },
    toBe(x) {
      if (x !== value) {
        throw new AssertionFailed(\`Expected \${value} to be \${x}\`)
      }
    },
    toEqual(x) {
      // eslint-disable-next-line eqeqeq
      if (x != value) {
        throw new AssertionFailed(\`Expected \${value} to equal \${x}\`)
      }
    }
  }
}

export { run }
`
