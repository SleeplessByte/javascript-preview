import { TestRun } from "./types"

export const run: TestRun = {
  failed: 0,
  skipped: 0,
  passed: 0,
  messages: [],
  promises: []
}

export async function test(name: string, c: Function) {
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

export const xtest = test
export const it = test
export const xit = test

export async function describe(name: string, c: Function) {
  console.log("running tests", name)
  return await c()
}

export function expect(value: any) {
  return {
    resolves: {
      toBe(x: any) {
        const p = value.then(
          (resolved: any) => {
            if (x !== resolved) {
              throw new Error(`Expected ${JSON.stringify(resolved, undefined, 2)} to be ${x}`)
            }
          }
        )

        run.promises.push(p)
        return p
      }
    },
    rejects: {
      toThrow(x: any) {
        const p = value.then(
          () => {
            throw new Error(`Expected error ${x}`)
          },
          () => { /* */ }
        )
        run.promises.push(p)
        return p
      }
    },
    toBeCloseTo(x: number, y = 0.01) {
      if (Math.abs(value - x) <= y) {
        return true
      }

      throw new Error(`Expected ${value} to be close to ${x}`)
    },
    toBe(x: any) {
      if (x !== value) {
        throw new Error(`Expected ${value} to be ${x}`)
      }
    },
    toEqual(x: any) {
      // eslint-disable-next-line eqeqeq
      if (x != value) {
        throw new Error(`Expected ${value} to equal ${x}`)
      }
    }
  }
}
