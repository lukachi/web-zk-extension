import { registerRPCService } from '@webext-pegasus/rpc'
import {
  definePegasusEventBus,
  definePegasusMessageBus,
} from '@webext-pegasus/transport'
import { initPegasusTransport } from '@webext-pegasus/transport/background'
import { Buffer } from 'buffer'
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

import { CachedRemoteFileLoader } from './helpers/chunked-loader'

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
  let activeStreams: Map<string, CachedRemoteFileLoader>
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
    const activeStreams = new Map<string, CachedRemoteFileLoader>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).activeStreams = activeStreams

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

        if (confirmed) {
          circuitsStore.useCircuitsStore.getState().addCircuit(message.data)
        }

        await sleep(100)
      },

      stream_circuit: async (message: ExtensionMessage<{ name: string }>) => {
        if (!message.data?.name) throw new TypeError('Missing circuit name')

        // Lookup the circuit info (adjust according to your store API)
        const circuit = circuitsStore.useCircuitsStore
          .getState()
          .getCircuitByName(message.data?.name)

        if (!circuit) {
          throw new Error('Circuit not found')
        }

        // Create a new loader instance for the circuit.
        const loader = new CachedRemoteFileLoader(circuit.zKey.url, {
          version: circuit.zKey.version,
          // pass any additional options if needed
        })

        // Generate a unique stream ID.
        const streamId = `${message.id}`
        activeStreams.set(streamId, loader)

        // Return the stream ID so the content script can initiate the connection.
        return { streamId }
      },
    })
    updateBadgeOnStorageChange()
    initPopupManagement()
  })
  .catch(err =>
    console.error('Error initializing extension store backend', err),
  )

browser.runtime.onConnect.addListener(port => {
  let streamId: string | null = null
  let cancelled = false

  // Listen for disconnect events.
  port.onDisconnect.addListener(() => {
    cancelled = true
  })

  // Wait for the initial "init" message that carries the stream ID.
  const initListener = (msg: any) => {
    if (msg && msg.type === 'init' && msg.requestId) {
      streamId = msg.requestId
      // Remove this listener once we got the init.
      port.onMessage.removeListener(initListener)

      // Look up the loader using our streamId.
      const loader = activeStreams.get(streamId!)

      if (!loader) {
        port.postMessage({
          type: 'error',
          error: 'Stream not found',
          requestId: streamId,
        })
        port.disconnect()
        return
      }

      // Start streaming in an async loop.
      ;(async () => {
        try {
          for await (const chunk of loader.streamFile()) {
            if (cancelled) break

            // Send each chunk as a transferable ArrayBuffer.
            port.postMessage({
              type: 'chunk',
              data: Buffer.from(chunk.buffer).toString('base64'),
              requestId: streamId,
            })
            // Yield control to avoid blocking.
            await new Promise(resolve => setTimeout(resolve, 0))
          }
          if (!cancelled) {
            // Signal end-of-stream.
            port.postMessage({ type: 'end', requestId: streamId })
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          port.postMessage({
            type: 'error',
            error: errorMessage,
            requestId: streamId,
          })
        } finally {
          port.disconnect()
          activeStreams.delete(streamId!)
        }
      })()
    }
  }

  port.onMessage.addListener(initListener)
})
