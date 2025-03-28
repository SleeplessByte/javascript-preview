import { useEffect, useState, useCallback } from 'react'
import isEqual from 'react-fast-compare'
import localForage from 'localforage'

const storage = localForage.createInstance({
  name: '@exercism/javascript-preview',
})

export type Unsubscribe = () => void
export type Listener<T> = (value: Readonly<T>) => void
type Update<T> = (value: Readonly<T> | undefined) => void

export class MemoryValue<T> {
  private listeners: Array<Listener<T | undefined>>
  private value: T | undefined

  constructor(initial?: Readonly<T>) {
    this.listeners = []
    this.value = initial
  }

  get current(): T | undefined {
    return this.value
  }

  subscribe(
    listener: Listener<T | undefined>,
    emit: boolean = true
  ): Unsubscribe {
    if (this.value !== undefined && emit) {
      listener(this.value)
    }

    this.listeners.push(listener)
    return () => this.unsubscribe(listener)
  }

  unsubscribe(listener: Listener<T | undefined>) {
    const index = this.listeners.indexOf(listener)
    if (index >= 0) {
      this.listeners.splice(index, 1)
    }
  }

  emit(value: T | undefined, newOnly: boolean = true) {
    if (newOnly && isEqual(this.value, value)) {
      return
    }

    this.value = value
    this.listeners.forEach((listener) => listener(value))
  }
}
export class StoredMemoryValue<T> {
  private value: MemoryValue<T | null>

  constructor(
    private storageKey: string,
    hydrate: boolean = true,
    initial?: Readonly<T>
  ) {
    this.value = new MemoryValue<T | null>(initial)

    this.storageKey = storageKey

    if (hydrate) {
      this.read()
    }
  }

  get current(): T | null | undefined {
    return this.value.current
  }

  subscribe(listener: Listener<T | null | undefined>, emit: boolean = true) {
    return this.value.subscribe(listener, emit)
  }

  unsubscribe(listener: Listener<T | null | undefined>) {
    return this.value.unsubscribe(listener)
  }

  emit(
    value: T | null | undefined,
    store: boolean = true,
    newOnly: boolean = true
  ) {
    if (newOnly && isEqual(value, this.current)) {
      return
    }

    if (store) {
      this.write(value)
    }

    this.value.emit(value, false)
  }

  private read() {
    storage.getItem(this.storageKey).then(
      (value) => {
        if (value) {
          this.emit(value as T, false)
        } else {
          this.emit(null, false)
        }
      },
      () => {}
    )
  }

  private write(value: T | null | undefined) {
    if (value === undefined) {
      return this.clear()
    }

    storage.setItem(this.storageKey, value).catch(() => {})
  }

  private clear() {
    storage.removeItem(this.storageKey).catch(() => {})
  }
}

const GLOBAL_STORED_VALUES: Record<string, StoredMemoryValue<unknown>> = {}

export function globalStoredValue<T>(
  key: string,
  hydrate: boolean = true,
  initial?: Readonly<T> | undefined
) {
  const current = GLOBAL_STORED_VALUES[key]
  if (current) {
    return current as StoredMemoryValue<T>
  }

  return (GLOBAL_STORED_VALUES[key] = new StoredMemoryValue<unknown>(
    key,
    hydrate,
    initial
  )) as StoredMemoryValue<T>
}

export function useMemoryValue<T>(
  value: StoredMemoryValue<T> | MemoryValue<T>
): Readonly<T> | null | undefined {
  return useMutableMemoryValue(value).current
}

export function useMutableMemoryValue<T>(
  value: StoredMemoryValue<T> | MemoryValue<T>
): { current: Readonly<T> | null | undefined; set: Update<T> } {
  const [state, setState] = useState<T | null | undefined>(value.current)

  const update = useCallback(
    (nextValue: T | undefined) => {
      value.emit(nextValue)
    },
    [value]
  )

  useEffect(() => {
    return value.subscribe(setState)
  }, [value, setState])

  return { current: state, set: update }
}
