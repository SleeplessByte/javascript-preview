export interface TestRun {
  failed: number
  skipped: number
  passed: number
  messages: TestMessage[]
  promises: Promise<unknown>[]
  complete: boolean | null
}

export interface TestMessage {
  test: string
  message: 'failed' | 'passed'
  details?: string
}
