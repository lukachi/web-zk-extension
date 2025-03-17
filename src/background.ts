import { registerRPCService } from '@webext-pegasus/rpc'
import {
  definePegasusEventBus,
  definePegasusMessageBus,
} from '@webext-pegasus/transport'
import { initPegasusTransport } from '@webext-pegasus/transport/background'
import { Buffer } from 'buffer'

import {
  closePopup,
  EventProtocolListeners,
  ExtensionMessage,
  getSelfIDService,
  initPopupManagement,
  ISelfIDService,
  MsgProtocolRequestMethods,
  MsgProtocolResponseMethods,
  openPopup,
  updateBadgeOnStorageChange,
} from '@/helpers/background'
import { CachedRemoteFileLoader } from '@/helpers/chunked-loader'
import { sleep } from '@/helpers/promise'
import { Circuit, circuitsStore } from '@/store/modules/circuits'

export type PegasusMsgProtocolMap = {
  [MsgProtocolRequestMethods.Request]: ExtensionMessage<never>
  [MsgProtocolResponseMethods.RequestResponse]: ExtensionMessage<unknown>

  [MsgProtocolRequestMethods.RequestConfirmation]: ExtensionMessage<{
    title: string
    message?: string
    data?: unknown
  }>
  [MsgProtocolResponseMethods.ConfirmResponse]: {
    id: number
    data: boolean
  }
}

export type PegasusEventProtocolMap = {
  [EventProtocolListeners.CircuitLoadingProgress]: {
    name: string
    progress: number
  }
  [EventProtocolListeners.CircuitLoadingError]: Error
}

const init = async () => {
  initPegasusTransport()

  registerRPCService<ISelfIDService>('getSelfID', getSelfIDService)

  const eventBus = definePegasusEventBus<PegasusEventProtocolMap>()
  const messageBus = definePegasusMessageBus<PegasusMsgProtocolMap>()

  const startLoadingCircuit = async (
    circuit: Circuit,
    opts?: {
      onFinish?: () => void
      onError?: (error: Error) => void
    },
  ) => {
    // Create a function to update progress in the store:
    const updateProgress = (file: 'zKey' | 'wasm', progress: number) => {
      circuitsStore.useCircuitsStore.getState().updateCircuit(circuit.name, {
        // Only update the appropriate field:
        [file === 'zKey' ? 'zKeyProgress' : 'wasmProgress']: progress,
        loading: true,
      })

      eventBus.emitBroadcastEvent(
        EventProtocolListeners.CircuitLoadingProgress,
        {
          name: circuit.name,
          progress: progress,
        },
      )

      if (progress === 100) {
        opts?.onFinish?.()
      }
    }

    const handleError = (file: 'zKey' | 'wasm', error: Error) => {
      circuitsStore.useCircuitsStore.getState().updateCircuit(circuit.name, {
        loadError: `${file} error: ${error.message}`,
        loading: false,
      })

      eventBus.emitBroadcastEvent(
        EventProtocolListeners.CircuitLoadingError,
        error,
      )

      opts?.onError?.(error)
    }

    // Create loaders with callbacks:
    const zKeyLoader = new CachedRemoteFileLoader(circuit.zKey.url, {
      version: circuit.zKey.version,
      onProgress: progress => updateProgress('zKey', progress),
      onError: error => handleError('zKey', error),
    })

    const wasmLoader = new CachedRemoteFileLoader(circuit.wasm.url, {
      version: circuit.wasm.version,
      onProgress: progress => updateProgress('wasm', progress),
      onError: error => handleError('wasm', error),
    })

    try {
      await Promise.all([zKeyLoader.loadFile(), wasmLoader.loadFile()])
      // Mark as finished
      circuitsStore.useCircuitsStore.getState().updateCircuit(circuit.name, {
        loading: false,
        zKeyProgress: 100,
        wasmProgress: 100,
        loadError: null,
      })
    } catch (error) {
      circuitsStore.useCircuitsStore.getState().updateCircuit(circuit.name, {
        loadError: error instanceof Error ? error.message : String(error),
        loading: false,
      })
    }
  }

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
      MsgProtocolRequestMethods.RequestConfirmation,
      {
        method: MsgProtocolRequestMethods.RequestConfirmation,
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
        MsgProtocolResponseMethods.ConfirmResponse,
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
    messageBus.onMessage(MsgProtocolRequestMethods.Request, async message => {
      const sendResponse = (data: ExtensionMessage<unknown>) => {
        messageBus.sendMessage(
          MsgProtocolResponseMethods.RequestResponse,
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

      const handler = handlers[method]

      if (!handler) {
        sendResponse({
          method,
          id,
          error: `No handler for method: ${method}`,
        })

        return
      }

      try {
        const result = handler(message.data)

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (result && typeof result[Symbol.asyncIterator] === 'function') {
          // It's an async generator
          await (async () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            for await (const chunk of result) {
              // Send each chunk
              sendResponse({
                id,
                type: 'stream',
                method,
                data: { type: 'chunk', data: chunk },
              })
              // Yield control
              await new Promise(resolve => setTimeout(resolve, 0))
            }

            // End of stream
            sendResponse({
              id,
              type: 'stream',
              method,
              data: { type: 'end' },
            })
          })()
          return
        }

        sendResponse({
          method,
          id,
          data: await result,
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
    })
  }

  await Promise.all([circuitsStore.backendReady()])

  registerMessageListener({
    // Ping handler for testing.
    ping: async (message: ExtensionMessage<unknown>) => {
      return `received ${JSON.stringify(message)}, pong you back`
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
        startLoadingCircuit(message.data)
      }

      await sleep(100)
    },

    async *getCircuit(
      message: ExtensionMessage<{ name: string; type: 'zkey' | 'wasm' }>,
    ) {
      if (!message.data?.name) throw new TypeError('Missing circuit name')

      const circuit = circuitsStore.useCircuitsStore
        .getState()
        .getCircuitByName(message.data?.name)

      if (!circuit) {
        throw new Error('Circuit not found')
      }

      if (circuit.loading) {
        console.log('circuit is loading, waiting for it to finish')

        const checkLoading = async (): Promise<boolean> => {
          return new Promise<boolean>((resolve, reject) => {
            const timeout = setTimeout(() => {
              resolve(false)
            }, 30_000)

            // Listen for progress events.
            const unsubscribe = eventBus.onBroadcastEvent(
              EventProtocolListeners.CircuitLoadingProgress,
              msg => {
                if (msg.data.name === circuit.name) {
                  clearTimeout(timeout)
                  unsubscribe()
                  resolve(true)
                }
              },
            )
          })
        }

        if (!(await checkLoading())) {
          await new Promise<void>(resolve => {
            startLoadingCircuit(circuit, {
              onFinish: () => {
                resolve()
              },
            })
          })
        } else {
          await new Promise<void>(resolve => {
            eventBus.onBroadcastEvent(
              EventProtocolListeners.CircuitLoadingProgress,
              msg => {
                if (
                  msg.data.progress === 100 &&
                  msg.data.name === circuit.name
                ) {
                  resolve()
                }
              },
            )
          })
        }
      } else if (
        !circuit.loading &&
        circuit.zKeyProgress !== 100 &&
        circuit.wasmProgress !== 100
      ) {
        console.log('circuit is not loaded, loading it')
        await new Promise<void>(resolve => {
          startLoadingCircuit(circuit, {
            onFinish: () => {
              resolve()
            },
          })
        })

        await sleep(200)
      }

      const loader = new CachedRemoteFileLoader(
        message.data.type === 'zkey' ? circuit.zKey.url : circuit.wasm.url,
        {
          version:
            message.data.type === 'zkey'
              ? circuit.zKey.version
              : circuit.wasm.version,
          // pass any additional options if needed
        },
      )

      if (!(await loader.isDownloaded())) {
        await loader.loadFile()
      }

      for await (const chunk of loader.streamFile()) {
        yield Buffer.from(chunk.buffer).toString('base64')
      }
    },
  })

  updateBadgeOnStorageChange()
  initPopupManagement()
}

init()
