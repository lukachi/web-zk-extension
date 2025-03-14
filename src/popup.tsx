import { initPegasusTransport } from '@webext-pegasus/transport/popup'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { circuitsStore } from '@/store/modules/circuits'

import { createRouter } from './routes'

initPegasusTransport()

const router = createRouter()

Promise.all([circuitsStore.ready()]).then(() => {
  ReactDOM.createRoot(document.body).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
})
