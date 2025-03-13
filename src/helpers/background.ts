import browser from 'webextension-polyfill'

// -----------------------------------------------
// Types for Messages & Handlers
// -----------------------------------------------
export interface ExtensionMessage {
  method: string
  id?: number
  data?: unknown
  error?: unknown
  tabId?: number
}

export type HandlerFunction = (
  message: ExtensionMessage,
  sender: browser.Runtime.MessageSender,
) => Promise<unknown>

// -----------------------------------------------
// Messaging Utilities
// -----------------------------------------------
export async function sendMessageToContentScript(
  tabId: number,
  message: ExtensionMessage,
): Promise<void> {
  try {
    await browser.tabs.sendMessage(tabId, {
      from: 'background',
      to: 'content-script',
      ...message,
    })
  } catch (error) {
    console.error(`Failed to send message to tab ${tabId}:`, error)
  }
}

export async function sendMessageToAllTabs(
  message: ExtensionMessage,
): Promise<void> {
  const tabs = await browser.tabs.query({})
  for (const tab of tabs) {
    if (tab.id) {
      await sendMessageToContentScript(tab.id, message)
    }
  }
}

export function registerMessageListener(handlers: {
  [method: string]: HandlerFunction
}) {
  browser.runtime.onMessage.addListener(
    async (message: ExtensionMessage, sender, sendResponse) => {
      const { method, id } = message
      if (handlers[method]) {
        try {
          const result = await handlers[method](message, sender)
          if (sender.tab && sender.tab.id) {
            await sendMessageToContentScript(sender.tab.id, {
              method,
              id,
              data: result,
            })
          }
        } catch (error) {
          if (sender.tab && sender.tab.id) {
            await sendMessageToContentScript(sender.tab.id, {
              method,
              id,
              error: error instanceof Error ? error.message : error,
            })
          }
        }
      } else {
        if (sender.tab && sender.tab.id) {
          await sendMessageToContentScript(sender.tab.id, {
            method,
            id,
            error: `No handler for method: ${method}`,
          })
        }
      }
      sendResponse()
      return true
    },
  )
}

// -----------------------------------------------
// Popup Management (Abstract Implementation)
// -----------------------------------------------
let _popupId: number | undefined = undefined
let _isClosingPopupByUserAction = false

export async function openPopup(url: string = ''): Promise<void> {
  const popup = await getPopup()
  if (popup) {
    await browser.windows.update(popup.id!, { focused: true })
  } else {
    const currentWin = await browser.windows.getCurrent()
    const width = 375
    const height = 620
    const left = Math.round(currentWin.left! + currentWin.width! - width)
    const popupWindow = await browser.windows.create({
      url: `index.html${url}`,
      type: 'popup',
      width,
      height,
      top: currentWin.top,
      left,
    })
    _popupId = popupWindow.id
  }
}

export async function getPopup(): Promise<browser.Windows.Window | null> {
  const windows = await browser.windows.getAll()
  return (
    windows.find(win => win.type === 'popup' && win.id === _popupId) || null
  )
}

export function initPopupManagement(): void {
  browser.windows.onRemoved.addListener(async windowId => {
    if (windowId === _popupId) {
      _popupId = undefined
      if (!_isClosingPopupByUserAction) {
        // Clean up pending operations as needed.
        console.log('Popup closed unexpectedly. Clean up pending operations.')
      }
      _isClosingPopupByUserAction = false
    }
  })
}

// -----------------------------------------------
// Badge Management (Abstract)
// -----------------------------------------------
export function updateBadge(count: number = 0): void {
  const label = count ? String(count) : ''
  browser.action.setBadgeText({ text: label })
  browser.action.setBadgeBackgroundColor({ color: '#01579b' })
}

export function updateBadgeOnStorageChange(): void {
  browser.storage.onChanged.addListener(() => {
    // Optionally implement logic to calculate a badge count.
    updateBadge()
  })
}
