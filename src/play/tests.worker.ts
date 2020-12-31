import { runTests } from '../tests/runner'

export default async function run(tests: string, code: string, slug: string) {
  return runTests(tests, code, slug)
}
