import { getRPCService } from '@webext-pegasus/rpc'
import {
  definePegasusEventBus,
  definePegasusMessageBus,
} from '@webext-pegasus/transport'
import { initPegasusTransport } from '@webext-pegasus/transport/window'

const init = async () => {
  initPegasusTransport({
    namespace: 'zk-ext',
  })
  definePegasusEventBus()

  const messageBus = definePegasusMessageBus()

  await getRPCService('getSelfID', 'background')()

  const provider = {
    request: args => {
      messageBus.sendMessage('request', args, 'background')

      return new Promise(resolve => {
        // Variables to help track a streaming response.
        let streamInitialized = false
        let streamController = null

        const removeRequestListener = messageBus.onMessage(
          'request_response',
          message => {
            const extensionMessage = message.data

            if (extensionMessage.type === 'stream') {
              // For the first message, initialize the stream.
              if (!streamInitialized) {
                streamInitialized = true

                // eslint-disable-next-line no-undef
                const stream = new ReadableStream({
                  start(controller) {
                    streamController = controller
                    // Process the first streaming message.
                    if (extensionMessage.data.type === 'chunk') {
                      controller.enqueue(extensionMessage.data.data)
                    } else if (extensionMessage.data.type === 'end') {
                      controller.close()
                      removeRequestListener()
                    } else if (extensionMessage.data.type === 'error') {
                      controller.error(new Error(extensionMessage.data.error))
                      removeRequestListener()
                    }
                  },
                })

                resolve(stream)
              } else {
                // Already streaming: enqueue subsequent messages.
                if (extensionMessage.data.type === 'chunk') {
                  streamController.enqueue(extensionMessage.data.data)
                } else if (extensionMessage.data.type === 'end') {
                  streamController.close()
                  removeRequestListener()
                } else if (extensionMessage.data.type === 'error') {
                  streamController.error(new Error(extensionMessage.data.error))
                  removeRequestListener()
                }
              }

              return
            }

            if (!streamInitialized) {
              resolve(extensionMessage.data)
            }
            removeRequestListener()
          },
        )
      })
    },
  }

  // eslint-disable-next-line no-undef
  window.zkExt = provider
}

init()
