// src/background.ts

import {
  ExtensionMessage,
  initPopupManagement,
  registerMessageListener,
  sendMessageToAllTabs,
  updateBadgeOnStorageChange,
} from '@/helpers/background'

registerMessageListener({
  // For example, an "event" handler that broadcasts an event to all tabs.
  event: async (message: ExtensionMessage) => {
    await sendMessageToAllTabs({
      method: message.method,
      id: message.id,
      data: message.data,
    })
    return null
  },
  // Ping handler for testing.
  ping: async (message: ExtensionMessage) => {
    return `received ${message}, pong you back`
  },
})

updateBadgeOnStorageChange()
initPopupManagement()
