/// <reference types="react-scripts" />

declare module 'worker-loader!*' {
  class WebpackWorker<T extends Record<string, Function>> extends Worker {
    public [K in T]: T[K]

    constructor()
  }

  export = WebpackWorker
}
