import React, { Component, PropsWithChildren } from 'react'

import { PortalConsumer } from './PortalConsumer'
import { PortalHost, PortalContext } from './PortalHost'

/**
 * Portal allows to render a component at a different place in the parent tree.
 * You can use it to render content which should appear above other elements, similar to `Modal`.
 * It requires a `Portal.Host` component to be rendered somewhere in the parent tree.
 *
 * ## Usage
 * ```js
 * import * as React from 'react';
 * import { Portal } from '/path/to/Portal';
 *
 * export default class MyComponent extends React.Component {
 *   render() {
 *     return (
 *       <Portal>
 *         <Text>This is rendered at a different place</Text>
 *       </Portal>
 *     );
 *   }
 * }
 * ```
 */
export class Portal extends Component<PropsWithChildren<{}>> {
  // @component ./PortalHost.tsx
  static Host = PortalHost

  render() {
    const { children } = this.props

    return (
      <PortalContext.Consumer>
        {(manager) => (
          <PortalConsumer manager={manager}>{children}</PortalConsumer>
        )}
      </PortalContext.Consumer>
    )
  }
}
