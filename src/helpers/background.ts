import { PegasusRPCMessage } from '@webext-pegasus/rpc'
import browser from 'webextension-polyfill'

// -----------------------------------------------
// Types for Messages & Handlers
// -----------------------------------------------
export interface ExtensionMessage<T> {
  method: string
  id?: number
  data?: T
  error?: unknown
  type?: string
}

// -----------------------------------------------
// Popup Management (Abstract Implementation)
// -----------------------------------------------
let _popupId: number | undefined = undefined
let _isClosingPopupByUserAction = false

export async function openPopup(url: string = ''): Promise<number> {
  const popup = await getPopup()
  if (popup) {
    await browser.windows.update(popup.id!, { focused: true })

    return -1
  }

  const currentWin = await browser.windows.getCurrent()
  const width = 375
  const height = 620
  const left = Math.round(currentWin.left! + currentWin.width! - width)
  const popupWindow = await browser.windows.create({
    url: `src/popup.html${url}`,
    type: 'popup',
    width,
    height,
    top: currentWin.top,
    left,
  })
  _popupId = popupWindow.id
  return popupWindow.id || -1
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
        console.warn('Popup closed unexpectedly. Clean up pending operations.')
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

export type ISelfIDService = typeof getSelfIDService

export async function getSelfIDService(message: PegasusRPCMessage): Promise<{
  tabId: number
  frameId?: number
}> {
  let tabId: number | undefined = message.sender.tabId
  if (message.sender.context === 'popup') {
    tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0]
      .id
  }
  if (tabId === undefined) {
    throw new Error(`Could not get tab ID for message: ${message.toString()}`)
  }
  return { frameId: message.sender.frameId, tabId }
}

export enum MsgProtocolRequestMethods {
  Request = 'request',
  RequestConfirmation = 'requestConfirmation',
}
export enum MsgProtocolResponseMethods {
  ConfirmResponse = 'CONFIRM_RESPONSE',
  RequestResponse = 'request_response',
}

export enum EventProtocolListeners {
  CircuitLoadingProgress = 'circuit_loading_progress',
  CircuitLoadingError = 'circuit_loading_error',
}

export async function closePopup(id: number) {
  await browser.runtime.sendMessage({
    method: 'closePopupByUserAction',
  })
  await browser.windows.remove(id)
}
