import { TestRun } from './types'

export type FailedTestRun = {
  message: string
}

export function runTests(
  exerciseTests: string,
  userCode: string,
  slug: string
): Promise<(TestRun | FailedTestRun) & { cleanup: () => void }> {
  const { tests, object } = prepareTest(exerciseTests, userCode, slug)

  function cleanup() {
    console.log('[suite] cleaning up run', tests, object)
    URL.revokeObjectURL(tests)
    URL.revokeObjectURL(object)
  }

  return import(/* webpackIgnore: true */ `${tests}`)
    .then((result) => {
      return { ...(result.run as TestRun), cleanup }
    })
    .catch((error) => {
      console.error('[suite] failed to run the tests \n', error)

      return { ...({ message: error.message } as FailedTestRun), cleanup }
    })
}

function prepareTest(tests: string, code: string, slug: string) {
  const importableCode = esm`${code}`

  const lines = tests
    .replace(`'./${slug}'`, `'${importableCode}'`)
    .replace(`"./${slug}"`, `'${importableCode}'`)
    .split('\n')

  // Delete globals import
  lines.splice(
    lines.findIndex(
      (l) => l.indexOf('import ') !== -1 && l.indexOf("from '@jest/globals'")
    ),
    1,
    "// import { ... } from '@jest/globals'"
  )

  // Add test helper
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

/*
 function esm2(templateStrings: TemplateStringsArray, ...substitutions: string[]) {
  let js = templateStrings.raw[0];
  for (let i=0; i<substitutions.length; i++) {
    js += substitutions[i] + templateStrings.raw[i+1];
  }
  return 'data:text/javascript;base64,' + btoa(js);
}
*/

const esm = ({ raw }: TemplateStringsArray, ...vals: string[]) =>
  URL.createObjectURL(
    new Blob([String.raw({ raw } as any, ...vals)], { type: 'text/javascript' })
  )

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

function eq(a, b, aStack = [], bStack = [], customTesters = []) {
  var result = true;

  if (a instanceof Error && b instanceof Error) {
    return a.message == b.message;
  }

  if (Object.is(a, b)) {
    return true;
  }
  // A strict comparison is necessary because \`null == undefined\`.
  if (a === null || b === null) {
    return a === b;
  }

  var className = Object.prototype.toString.call(a);
  if (className != Object.prototype.toString.call(b)) {
    return false;
  }

  switch (className) {
    case '[object Boolean]':
    case '[object String]':
    case '[object Number]':
      if (typeof a !== typeof b) {
        // One is a primitive, one a \`new Primitive()\`
        return false;
      } else if (typeof a !== 'object' && typeof b !== 'object') {
        // both are proper primitives
        return Object.is(a, b);
      } else {
        // both are \`new Primitive()\`s
        return Object.is(a.valueOf(), b.valueOf());
      }
    case '[object Date]':
      // Coerce dates to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of \`NaN\` are not equivalent.
      return +a == +b;
    // RegExps are compared by their source patterns and flags.
    case '[object RegExp]':
      return a.source === b.source && a.flags === b.flags;
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  // Add the first object to the stack of traversed objects.
  aStack.push(a);
  bStack.push(b);
  var size = 0;
  // Recursively compare objects and arrays.
  // Compare array lengths to determine if a deep comparison is necessary.
  if (className == '[object Array]') {
    size = a.length;
    if (size !== b.length) {
      return false;
    }

    while (size--) {
      result = eq(a[size], b[size], aStack, bStack, hasKey);
      if (!result) {
        return false;
      }
    }
  }

  // Deep compare objects.
  var aKeys = keys(a, className == '[object Array]', hasKey),
    key;
  size = aKeys.length;

  // Ensure that both objects contain the same number of properties before comparing deep equality.
  if (keys(b, className == '[object Array]', hasKey).length !== size) {
    return false;
  }

  while (size--) {
    key = aKeys[size];

    // Deep compare each member
    result =
      hasKey(b, key) &&
      eq(a[key], b[key], aStack, bStack, customTesters, hasKey);

    if (!result) {
      return false;
    }
  }
  // Remove the first object from the stack of traversed objects.
  aStack.pop();
  bStack.pop();

  return result;
}

function keys(
  obj,
  isArray,
  hasKey
) {
  var allKeys = (function(o) {
    var keys = [];
    for (var key in o) {
      if (hasKey(o, key)) {
        keys.push(key);
      }
    }
    return keys.concat(
      (Object.getOwnPropertySymbols(o)).filter(
        symbol =>
          (Object.getOwnPropertyDescriptor(o, symbol))
            .enumerable,
      ),
    );
  })(obj);

  if (!isArray) {
    return allKeys;
  }

  var extraKeys = [];
  if (allKeys.length === 0) {
    return allKeys;
  }

  for (var x = 0; x < allKeys.length; x++) {
    if (typeof allKeys[x] === 'symbol' || !allKeys[x].match(/^[0-9]+$/)) {
      extraKeys.push(allKeys[x]);
    }
  }

  return extraKeys;
}

function hasKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function expect(value) {

  function promiseToBe(x) {
    return promise(
      value.then(
        (resolved) => {
          if (!eq(x, resolved)) {
            throw new AssertionFailed(\`Expected \${JSON.stringify(resolved, undefined, 2)} to be \${x}\`)
          }
        }
      )
    )
  }

  function toBe(x) {
    if (!eq(x, value)) {
      throw new AssertionFailed(\`Expected \${value} to be \${x}\`)
    }
  }

  return {
    resolves: {
      toBe: promiseToBe,
      toEqual: promiseToBe,
      toStrictEqual: promiseToBe
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
    toBe: toBe,
    toEqual: toBe,
    toStrictEqual: toBe
  }
}

export { run }
`
