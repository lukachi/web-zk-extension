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

      return new Promise((resolve, reject) => {
        const removeRequestListener = messageBus.onMessage(
          'request_response',
          message => {
            const extensionMessage = message.data

            if (extensionMessage.type === 'stream') {
              console.log('streaming: ', extensionMessage)
              const chunks = []

              if (extensionMessage.type === 'chunk') {
                chunks.push(extensionMessage.data)
              } else if (extensionMessage.type === 'end') {
                resolve(chunks)
              } else if (extensionMessage.type === 'error') {
                reject(new Error(extensionMessage.error))
              }

              return
            }

            resolve(extensionMessage.data)

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
