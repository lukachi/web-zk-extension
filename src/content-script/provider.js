/* eslint-disable no-undef */
class ExtensionProvider {
  constructor() {
    this._events = {}

    this._registerEventListeners()
  }
  async request(args) {
    return sendAsyncMessageToContentScript(args)
  }

  on(eventName, callback) {
    if (!this._events[eventName]) {
      this._events[eventName] = []
    }

    this._events[eventName].push(callback)
  }
  off(eventName, callback) {
    this._events[eventName] = this._events[eventName].filter(
      eventCallback => callback !== eventCallback,
    )
  }
  emit(eventName, args) {
    const event = this._events[eventName]

    if (event) {
      event.forEach(callback => callback.call(null, args))
    }
  }

  _registerEventListeners() {
    window.addEventListener('message', e => {
      if (
        e.data?.from === 'content-script' &&
        e.data?.to === 'inpage' &&
        e.data?.method === 'event'
      ) {
        this.emit(e.data?.data.name, e.data?.data?.args)
      }
    })
  }
}

const sendAsyncMessageToContentScript = async args => {
  return new Promise((resolve, reject) => {
    const id = Date.now()
    window.postMessage(
      {
        from: 'inpage',
        to: 'content-script',
        method: args.method,
        data: args.params,
        id,
      },
      '*',
    )

    // TODO: to add middleware to handle the response/error
    const handler = e => {
      if (e.data?.from !== 'content-script' && e.data?.to !== 'inpage') return
      if (e.data?.method === args.method && e.data?.id === id) {
        if (e.data.error) reject(e.data.error)
        resolve(e.data?.data)
        window.removeEventListener('message', handler)
      }
    }
    window.addEventListener('message', handler)
  })
}

window.zkExt = new ExtensionProvider()
