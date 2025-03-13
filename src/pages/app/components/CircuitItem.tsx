import { useMemo, useState } from 'react'

import { CachedRemoteFileLoader } from '@/helpers/chunked-loader'
import { formatDateDMYT } from '@/helpers/formatters'
import { UiButton } from '@/ui/UiButton'

import { Circuit } from '../types'

type Props = {
  circuit: Circuit
}

export default function CircuitItem({ circuit, ...rest }: Props) {
  const [, setDownloadProgress] = useState(0)
  const [, setDownloadError] = useState<Error | null>(null)

  const fileLoader = useMemo(
    () =>
      new CachedRemoteFileLoader(circuit.url, {
        onProgress: progress => setDownloadProgress(progress),
        onError: error => setDownloadError(error),
      }),
    [circuit.url],
  )

  return (
    <li {...rest} className='flex flex-col justify-between gap-x-6 py-5'>
      <div className='flex min-w-0 gap-x-4'>
        <img
          alt=''
          src={circuit.iconUrl}
          className='size-12 flex-none rounded-full bg-gray-50'
        />
        <div className='flex min-w-0 flex-auto flex-col gap-2'>
          <p className='text-sm/6 font-semibold text-gray-900'>
            {circuit.name}
          </p>
          <p className='truncate text-xs/5 text-gray-500'>
            {circuit.description}
          </p>

          {circuit.timeAdded && (
            <>
              <span className='text-sm/6 text-gray-900'>
                {formatDateDMYT(circuit.timeAdded)}
              </span>
              {circuit.timeUpdated ? (
                <span className='text-xs/5 text-gray-500'>
                  Last update{' '}
                  <time dateTime={new Date(circuit.timeUpdated).toISOString()}>
                    {formatDateDMYT(circuit.timeUpdated)}
                  </time>
                </span>
              ) : (
                <div className='flex items-center gap-x-1.5'>
                  <div className='flex-none rounded-full bg-emerald-500/20 p-1'>
                    <div className='size-1.5 rounded-full bg-emerald-500' />
                  </div>
                  <span className='text-xs/5 text-gray-500'>Online</span>
                </div>
              )}

              <UiButton
                variant={'outline'}
                onClick={() => fileLoader.loadFile()}
              >
                Load
              </UiButton>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
