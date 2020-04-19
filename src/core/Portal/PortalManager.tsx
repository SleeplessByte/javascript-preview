import React, { PureComponent, ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'

import styles from './style.module.css'

type State = {
  portals: Array<{
    key: number
    children: React.ReactNode
  }>
}

export class PortalManager extends PureComponent<{}, State> {
  state: State = {
    portals: [],
  }

  mount = (key: number, children: ReactNode) => {
    this.setState((state) => ({
      portals: [...state.portals, { key, children }],
    }))
  }

  update = (key: number, children: ReactNode) =>
    this.setState((state) => ({
      portals: state.portals.map((item) => {
        if (item.key === key) {
          return { ...item, children }
        }
        return item
      }),
    }))

  unmount = (key: number) =>
    this.setState((state) => ({
      portals: state.portals.filter((item) => item.key !== key),
    }))

  render() {
    return (
      <AnimatePresence>
        {this.state.portals.map(({ key, children }) => (
          <div className={styles['portals']} key={key}>
            {children}
          </div>
        ))}
      </AnimatePresence>
    )
  }
}
