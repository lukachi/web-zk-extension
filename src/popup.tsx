import { definePegasusMessageBus } from '@webext-pegasus/transport'
import { initPegasusTransport } from '@webext-pegasus/transport/popup'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { PegasusMsgProtocolMap } from '@/background'
import ActionsHandler from '@/common/ActionsHandler'
import { ConfirmProvider } from '@/common/ConfirmationPopup'
import { circuitsStore } from '@/store/modules/circuits'

import { createRouter } from './routes'

initPegasusTransport()
export const messageBus = definePegasusMessageBus<PegasusMsgProtocolMap>()

Promise.all([circuitsStore.ready()]).then(() => {
  ReactDOM.createRoot(document.body).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>,
  )
})

const router = createRouter()

function Popup() {
  return (
    <ConfirmProvider>
      <PopupContent />
    </ConfirmProvider>
  )
}

function PopupContent() {
  return (
    <>
      <RouterProvider router={router} />
      <ActionsHandler />
    </>
  )
}
