import { registerRPCService } from '@webext-pegasus/rpc'
import {
  definePegasusEventBus,
  definePegasusMessageBus,
} from '@webext-pegasus/transport'
import { initPegasusTransport } from '@webext-pegasus/transport/background'
import browser from 'webextension-polyfill'

import {
  DefaultListenerRequestMethods,
  DefaultListenerResponseMethods,
  ExtensionMessage,
  getSelfIDService,
  initPopupManagement,
  registerMessageListener,
  sendMessageToAllTabs,
  updateBadgeOnStorageChange,
  waitForConfirmationResponse,
} from '@/helpers/background'
import { sleep } from '@/helpers/promise'
import { Circuit, circuitsStore } from '@/store/modules/circuits'

export type PegasusProtocolMap = {
  [DefaultListenerRequestMethods.RequestConfirmation]: ExtensionMessage<{
    title: string
    message?: string
    data?: unknown
  }>
  [DefaultListenerResponseMethods.ConfirmResponse]: {
    id: number
    data: boolean
  }
}

declare global {
  let pegasusEventBus: ReturnType<
    typeof definePegasusEventBus<PegasusProtocolMap>
  >
  let pegasusMessageBus: ReturnType<
    typeof definePegasusMessageBus<PegasusProtocolMap>
  >
}

const initStore = async () => {
  initPegasusTransport()
  registerRPCService('getSelfID', getSelfIDService)

  const eventBus = definePegasusEventBus<PegasusProtocolMap>()
  const messageBus = definePegasusMessageBus<PegasusProtocolMap>()

  // eventBus.emitBroadcastEvent('test', 'test')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).pegasusEventBus = eventBus
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).pegasusMessageBus = messageBus

  await Promise.all([circuitsStore.backendReady()])
}

initStore()
  .then(() => {
    browser.runtime.onInstalled.addListener(() => {})

    registerMessageListener({
      // For example, an "event" handler that broadcasts an event to all tabs.
      event: async (message: ExtensionMessage<unknown>) => {
        await sendMessageToAllTabs({
          method: message.method,
          id: message.id,
          data: message.data,
        })
        return null
      },
      // Ping handler for testing.
      ping: async (message: ExtensionMessage<unknown>) => {
        return `received ${message}, pong you back`
      },

      addCircuit: async (message: ExtensionMessage<Circuit>) => {
        if (!message.data) return

        const confirmed = await waitForConfirmationResponse(
          'Add circuit?',
          'Are you sure you want to add this circuit?',
          message.data,
        )

        console.log('Add circuit', confirmed)

        if (confirmed) {
          circuitsStore.useCircuitsStore.getState().addCircuit(message.data)
        }

        await sleep(100)
      },
    })
    updateBadgeOnStorageChange()
    initPopupManagement()
  })
  .catch(err =>
    console.error('Error initializing extension store backend', err),
  )
