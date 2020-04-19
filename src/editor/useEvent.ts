import mitt from 'mitt'
import { useEffect } from 'react'

const emitter = mitt()

export function useEvent(event: keyof typeof EVENTS, handler: mitt.Handler) {
  useEffect(() => {
    const key = EVENTS[event]

    emitter.on(key, handler)
    console.log("add event", event)

    return () => {
      console.log("remove event", event)
      emitter.off(key, handler)
    }
  }, [event, handler])
}

export function on(event: keyof typeof EVENTS , handler: mitt.Handler) {
  const key = EVENTS[event]

  emitter.on(key, handler)

  return () => {
    emitter.off(key, handler)
  }
}

export function emit(event: keyof typeof EVENTS , ...params: Parameters<mitt.Handler>) {
  emitter.emit(EVENTS[event], ...params)
}

const EVENTS = {
  commands: 'commands',
  export: 'export',
  refresh: 'exercise.refresh',
  reset: 'exercise.reset',
  instructions: 'view.instructions',
  hints: 'view.hints',
  executeTests: 'execute.tests'
}
