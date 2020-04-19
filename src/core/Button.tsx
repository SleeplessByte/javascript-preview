import React, { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'
import styles from './styles.module.css'
import { Link, LinkProps } from 'react-router-dom'

export function Button({
  className,
  children,
  disabled,
  ...otherProps
}: React.PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      disabled={disabled}
      className={[styles['action'], disabled && styles['action--disabled'], className].filter(Boolean).join(' ')}
      {...otherProps}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  className,
  children,
  disabled,
  type,
  to,
  ...otherProps
}: React.PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
    LinkProps & { disabled?: boolean; type?: 'secondary' }
>) {
  return (
    <Link
      className={[
        styles['action'],
        disabled && styles['action--disabled'],
        type && styles[`action--${type}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      to={disabled ? '#' : to}
      {...otherProps}
    >
      {children}
    </Link>
  )
}

export function ExternalLink({
  className,
  children,
  ...otherProps
}: React.PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) {
  return (
    <a
      className={[className].filter(Boolean).join(' ')}
      rel="noopner noreferrer"
      {...otherProps}
    >
      {children}
    </a>
  )
}
