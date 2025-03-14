import { registerRPCService } from '@webext-pegasus/rpc'
import { definePegasusEventBus } from '@webext-pegasus/transport'
import { initPegasusTransport } from '@webext-pegasus/transport/background'
import browser from 'webextension-polyfill'

import {
  ExtensionMessage,
  getSelfIDService,
  initPopupManagement,
  registerMessageListener,
  sendMessageToAllTabs,
  updateBadgeOnStorageChange,
} from '@/helpers/background'
import { Circuit, circuitsStore } from '@/store/modules/circuits'

const initStore = async () => {
  initPegasusTransport()
  registerRPCService('getSelfID', getSelfIDService)

  const eventBus = definePegasusEventBus<{
    'test-event': string
  }>()
  eventBus.onBroadcastEvent('test-event', data => {
    // eslint-disable-next-line no-console
    console.log('received test-event at background script', data)
  })
  eventBus.emitBroadcastEvent(
    'test-event',
    'Hello world from background script!',
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).pegasusEventBus = eventBus
}

initStore().then(() => {
  Promise.all([circuitsStore.backendReady()])
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

          circuitsStore.useCircuitsStore.getState().addCircuit(message.data)
        },
      })

      updateBadgeOnStorageChange()
      initPopupManagement()
    })
    .catch(err =>
      console.error('Error initializing extension store backend', err),
    )
})
