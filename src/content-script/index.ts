import browser from 'webextension-polyfill'

const url = browser.runtime.getURL('src/content-script/provider.js')
injectScript(url)

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

window.addEventListener('message', event => {
  if (event.source === window && event.data.method) {
    const { method, from, to, data, id } = event.data
    if (from === 'inpage' && to === 'content-script') {
      browser.runtime.sendMessage({
        id,
        method,
        data,
      })
    }
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
