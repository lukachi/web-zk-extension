import { initPegasusTransport } from '@webext-pegasus/transport/content-script'
import browser from 'webextension-polyfill'

import { circuitsStore } from '@/store/modules/circuits'

initPegasusTransport()

const url = browser.runtime.getURL('src/content-script/provider.js')

function injectScript(url: string) {
  try {
    const container = document.head || document.documentElement
    const scriptTag = document.createElement('script')
    scriptTag.setAttribute('async', 'false')
    scriptTag.setAttribute('src', url)
    container.insertBefore(scriptTag, container.children[0])
    // container.removeChild(scriptTag)
  } catch (error) {
    console.error('Provider injection failed.', error)
  }
}

Promise.all([circuitsStore.ready()]).then(() => {
  injectScript(url)
})

// Listen for window messages coming from the inpage script.
window.addEventListener('message', event => {
  // Handle regular (non-stream) requests.
  if (
    event.source === window &&
    event.data.method &&
    !event.data.isStreamRequest
  ) {
    const { method, from, to, data, id } = event.data
    if (from === 'inpage' && to === 'content-script') {
      browser.runtime.sendMessage({ id, method, data })
    }
  }

  // Handle streaming requests from the inpage context.
  if (
    event.source === window &&
    event.data.isStreamRequest &&
    event.data.method === 'stream_circuit'
  ) {
    const requestId = event.data.requestId
    // Directly use browser.runtime.sendMessage to get the stream ID.
    browser.runtime
      .sendMessage({
        method: 'stream_circuit',
        data: event.data.data,
        id: requestId,
      })
      .then(response => {
        // response should contain the streamId from background.
        const port = browser.runtime.connect()
        // Send an initialization message with the streamId and requestId.
        port.postMessage({
          type: 'init',
          streamId: response.streamId,
          requestId,
        })

        // Relay all messages from background to the inpage context.
        port.onMessage.addListener(message => {
          window.postMessage(
            { ...message, from: 'content-script', to: 'inpage' },
            '*',
          )
        })
      })
      .catch(error => {
        window.postMessage(
          {
            from: 'content-script',
            to: 'inpage',
            requestId,
            type: 'error',
            error: error.message,
          },
          '*',
        )
      })
  }
})

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const { method, data, from, to, error, id } = request
  if (from === 'background' && to === 'content-script') {
    window.postMessage(
      {
        from: 'content-script',
        to: 'inpage',
        id,
        method,
        data,
        error,
      },
      '*',
    )
  }
  sendResponse()
  return true
})
