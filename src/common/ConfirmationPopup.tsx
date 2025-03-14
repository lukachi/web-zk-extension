// useConfirm.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react'
import ReactDOM from 'react-dom'

import { UiButton } from '@/ui/UiButton'

type ConfirmContextType = {
  confirm: (title?: string, message?: string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [options, setOptions] = useState<{
    title?: string
    message?: string
  } | null>(null)
  const [resolver, setResolver] = useState<(value: boolean) => void>(
    () => () => {},
  )

  const confirm = (title?: string, message?: string): Promise<boolean> => {
    setOptions({ title, message })
    return new Promise<boolean>(resolve => {
      setResolver(() => resolve)
    })
  }

  const handleConfirm = () => {
    resolver(true)
    setOptions(null)
  }

  const handleDecline = () => {
    resolver(false)
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options &&
        ReactDOM.createPortal(
          <ConfirmationPopup
            title={options.title}
            message={options.message}
            onConfirm={handleConfirm}
            onDecline={handleDecline}
          />,
          document.body,
        )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = (): ((
  title?: string,
  message?: string,
) => Promise<boolean>) => {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context.confirm
}

type Props = {
  title?: string
  message?: string
  onConfirm: () => void
  onDecline: () => void
}

function ConfirmationPopup({ title, message, onConfirm, onDecline }: Props) {
  return (
    <div className='fixed inset-0 z-50 flex flex-col items-center gap-2 bg-white p-4 text-center'>
      {title && <h2 className='mb-4 text-xl font-bold'>{title}</h2>}
      {message && <p className='mb-6'>{message}</p>}
      <div className='mt-auto flex items-center gap-4'>
        <UiButton variant='outline' onClick={onDecline}>
          Decline
        </UiButton>
        <UiButton onClick={onConfirm}>Confirm</UiButton>
      </div>
    </div>
  )
}
