export interface TestRun {
  failed: number
  skipped: number
  passed: number
  messages: TestMessage[]
  promises: Promise<unknown>[]
}
