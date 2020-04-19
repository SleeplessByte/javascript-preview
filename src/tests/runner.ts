import { TestRun } from "./types"

type FailedTestRun = {
  message: string
}

export function runTests(exerciseTests: string, userCode: string, slug: string): Promise<TestRun | FailedTestRun> {
  const { tests, object } = prepareTest(
    exerciseTests,
    userCode,
    slug
  )

  return import(/* webpackIgnore: true */ `${tests}`)
    .then((result) => {
      console.info(result)
      console.info(result.run)

      URL.revokeObjectURL(tests)
      URL.revokeObjectURL(object)

      return result.run as TestRun
    })
    .catch((error) => {
      console.error('ERROR WHILST RUNNING TEST', error, tests)

      URL.revokeObjectURL(tests)
      URL.revokeObjectURL(object)

      return { message: error.message } as FailedTestRun
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
  promises: []
}

async function test(name, c) {
  if (run.failed > 0) {
    run.skipped += 1
    return
  }

  try {
    console.log(name, await c())
    run.messages.push({ test: name, message: 'passed' })
    run.passed += 1
  } catch (err) {
    console.error(name, err)
    run.messages.push({ test: name, message: 'failed', err: err.message })
    run.failed += 1
  }
}

const xtest = test
const it = test
const xit = test

async function describe(name, c) {
  console.log("running tests", name)
  return await c()
}

function expect(value) {
  return {
    resolves: {
      toBe(x) {
        const p = value.then(
          (resolved) => {
            if (x !== resolved) {
              throw new Error(\`Expected \${JSON.stringify(resolved, undefined, 2)} to be \${x}\`)
            }
          }
        )

        run.promises.push(p)
        return p
      }
    },
    rejects: {
      toThrow(x) {
        const p = value.then(
          () => {
            throw new Error(\`Expected error \${x}\`)
          },
          () => { /* */ }
        )
        run.promises.push(p)
        return p
      }
    },
    toBeCloseTo(x, y = 0.01) {
      if (Math.abs(value - x) <= y) {
        return true
      }

      throw new Error(\`Expected \${value} to be close to \${x}\`)
    },
    toBe(x) {
      if (x !== value) {
        throw new Error(\`Expected \${value} to be \${x}\`)
      }
    },
    toEqual(x) {
      // eslint-disable-next-line eqeqeq
      if (x != value) {
        throw new Error(\`Expected \${value} to equal \${x}\`)
      }
    }
  }
}

export { run }
`
