import React, { useEffect, ReactNode, useRef } from 'react'
import { motion } from 'framer-motion'
import styles from './style.module.css'

interface ModalProps {
  title: string
  children: ReactNode
  footer?: ReactNode
  overlay?: boolean
  visible: boolean
  onBack(): void
}

export function Modal({
  title,
  onBack,
  children,
  footer,
  overlay,
  visible,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus when showing
  useEffect(() => {
    if (!visible) {
      return
    }

    if (dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [visible, dialogRef])

  // Handle escape
  useEffect(() => {
    const onEscape = (ev: KeyboardEvent) => {
      if (ev.which !== 27) {
        return
      }

      onBack()
    }

    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [onBack])

  return (
    <div className={styles['modal__wrapper']}
    >
      <Backdrop dismiss={onBack} visible={visible && overlay !== false} />
      <div
        className={[styles['modal'], visible && styles['modal--visible']]
          .filter(Boolean)
          .join(' ')}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="staticBackdropLabel"
        aria-hidden={!visible}
        aria-modal={visible}
        aria-live="polite"
        ref={dialogRef}
      >
        <motion.div
          exit="exit"
          initial="hidden"
          animate={visible ? 'visibile' : 'hidden'}
          variants={{
            hidden: {
              opacity: 0,
              scale: 0.8,
              y: 100,
              transition: {
                ease: 'easeOut',
                duration: 0.225,
              },
            },
            visibile: {
              opacity: 1,
              scale: 1,
              y: 0,
            },
            exit: {
              opacity: 0,
              scale: 0.5,
              y: 100,
              transition: {
                ease: 'easeIn',
                duration: 0.125,
              },
            },
          }}
          className={styles['modal__dialog']}
          role="document"
        >
          <div className={styles['modal__content']}>
            <div className={styles['modal__header']}>
              <h5 className={styles['modal__title']} id="staticBackdropLabel">
                {title}
              </h5>
              <button
                type="button"
                className={styles['modal__close']}
                data-dismiss="modal"
                aria-label="Close"
                onClick={onBack}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className={styles['modal__body']}>{children}</div>
            {footer && <div className={styles['modal__footer']}>{footer}</div>}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Backdrop({
  dismiss,
  visible,
}: {
  dismiss(): void
  visible?: boolean
}) {
  useEffect(() => {
    if (!visible) {
      return
    }

    document.body.classList.add('modal-active')

    return () => {
      document.body.classList.remove('modal-active')
    }
  }, [visible])

  return (
    <motion.div
      exit="hidden"
      initial="hidden"
      animate={visible ? 'backdrop' : 'hidden'}
      variants={{
        hidden: {
          opacity: 0,
        },
        backdrop: {
          opacity: 0.5,
        },
      }}
      className={`${styles['backdrop']} backdrop`}
      onClick={dismiss}
    />
  )
}
