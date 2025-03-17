import { useTimeoutFn } from 'react-use'

import { useConfirm } from '@/common/ConfirmationPopup'
import {
  MsgProtocolRequestMethods,
  MsgProtocolResponseMethods,
} from '@/helpers/background'
import { messageBus } from '@/popup'

export default function ActionsHandler() {
  const confirm = useConfirm()

  useTimeoutFn(() => {
    messageBus.onMessage(
      MsgProtocolRequestMethods.RequestConfirmation,
      async ({ data }) => {
        const confirmationData = data.data

        const isConfirmed = await confirm(
          confirmationData?.title,
          confirmationData?.message,
        )

        await messageBus.sendMessage(
          MsgProtocolResponseMethods.ConfirmResponse,
          {
            id: data.id!,
            data: isConfirmed,
          },
        )
      },
    )
  }, 10)

  return null
}
