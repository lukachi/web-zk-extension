import { registerRPCService } from '@webext-pegasus/rpc'
import {
  definePegasusEventBus,
  definePegasusMessageBus,
} from '@webext-pegasus/transport'
import { initPegasusTransport } from '@webext-pegasus/transport/background'

import {
  closePopup,
  DefaultListenerRequestMethods,
  DefaultListenerResponseMethods,
  ExtensionMessage,
  getSelfIDService,
  initPopupManagement,
  ISelfIDService,
  openPopup,
  updateBadgeOnStorageChange,
} from '@/helpers/background'
import { CachedRemoteFileLoader } from '@/helpers/chunked-loader'
import { sleep } from '@/helpers/promise'
import { Circuit, circuitsStore } from '@/store/modules/circuits'

export type PegasusProtocolMap = {
  [DefaultListenerRequestMethods.Request]: ExtensionMessage<never>
  [DefaultListenerResponseMethods.RequestResponse]: ExtensionMessage<unknown>

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

const init = async () => {
  initPegasusTransport()

  registerRPCService<ISelfIDService>('getSelfID', getSelfIDService)
  definePegasusEventBus<PegasusProtocolMap>()

  const messageBus = definePegasusMessageBus<PegasusProtocolMap>()

  // const activeStreams = new Map<string, CachedRemoteFileLoader>()

  const waitForConfirmationResponse = async <T>(
    title: string,
    message: string,
    data: T,
    id = Math.floor(Math.random() * 1000000), // FIXME: generate a random number as the id
  ): Promise<boolean> => {
    const windowId = await openPopup()

    await sleep(200)

    // Delegate confirmation: send a message to the popup.
    messageBus.sendMessage(
      DefaultListenerRequestMethods.RequestConfirmation,
      {
        method: DefaultListenerRequestMethods.RequestConfirmation,
        id: id,
        data: {
          title,
          message,
          data,
        },
      },
      'popup',
    )

    return new Promise(resolve => {
      messageBus.onMessage(
        DefaultListenerResponseMethods.ConfirmResponse,
        ({ data }) => {
          if (data.id !== id) return

          resolve(Boolean(data.data))
          closePopup(windowId)
        },
      )

      setTimeout(() => {
        resolve(false)
        closePopup(windowId)
      }, 30000)
    })
  }

  const registerMessageListener = (
    handlers: Record<
      string,
      (
        message: ExtensionMessage<never>,
      ) => Promise<unknown> | AsyncGenerator<unknown, void, unknown>
    >,
  ) => {
    messageBus.onMessage(
      DefaultListenerRequestMethods.Request,
      async message => {
        const sendResponse = (data: ExtensionMessage<unknown>) => {
          messageBus.sendMessage(
            DefaultListenerResponseMethods.RequestResponse,
            data,
            {
              context: 'window',
              tabId: message.sender.tabId,
            },
          )
        }

        const { method, id } = message.data

        const sender = message.sender

        if (!sender.tabId) {
          return
        }

        if (handlers[method]) {
          const handler = handlers[method]

          try {
            if (handler[Symbol.toStringTag] === 'AsyncGeneratorFunction') {
              handler(message.data)
              ;(async () => {
                try {
                  for await (const chunk of await handler(message.data)) {
                    console.log(chunk)
                    sendResponse({
                      id,
                      type: 'stream',
                      method,
                      data: {
                        type: 'chunk',
                        data: chunk,
                      },
                    })
                    // Yield control to avoid blocking.
                    await new Promise(resolve => setTimeout(resolve, 0))
                  }

                  sendResponse({
                    id,
                    type: 'stream',
                    method,
                    data: {
                      type: 'end',
                    },
                  })
                } catch (error) {
                  const errorMessage =
                    error instanceof Error ? error.message : String(error)
                  sendResponse({
                    id,
                    type: 'error',
                    method,
                    data: {
                      error: errorMessage,
                    },
                  })
                }
              })()

              return
            }

            const result = await handler(message.data)
            sendResponse({
              method,
              id,
              data: result,
            })
          } catch (error) {
            if (sender.tabId) {
              sendResponse({
                method,
                id,
                error: error instanceof Error ? error.message : error,
              })
            }
          }
        } else {
          if (sender.tabId) {
            sendResponse({
              method,
              id,
              error: `No handler for method: ${method}`,
            })
          }
        }
      },
    )
  }

  await Promise.all([circuitsStore.backendReady()])

  registerMessageListener({
    // Ping handler for testing.
    ping: async (message: ExtensionMessage<unknown>) => {
      return `received ${JSON.stringify(message)}, pong you back`
    },

    addCircuit: async (message: ExtensionMessage<Circuit>) => {
      console.log(message.data)
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

    async *getCircuit(message: ExtensionMessage<{ name: string }>) {
      if (!message.data?.name) throw new TypeError('Missing circuit name')

      const circuit = circuitsStore.useCircuitsStore
        .getState()
        .getCircuitByName(message.data?.name)

      if (!circuit) {
        throw new Error('Circuit not found')
      }

      const loader = new CachedRemoteFileLoader(circuit.zKey.url, {
        version: circuit.zKey.version,
        // pass any additional options if needed
      })

      if (!(await loader.isDownloaded())) {
        await loader.loadFile()
      }

      for await (const chunk of loader.streamFile()) {
        console.log('yielding chunk', chunk.length)
        yield Buffer.from(chunk.buffer).toString('base64')
      }
    },
  })

  updateBadgeOnStorageChange()
  initPopupManagement()
}

init()
