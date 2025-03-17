import Avatar from 'boring-avatars'

import { formatDateDMYT } from '@/helpers/formatters'
import { Circuit } from '@/store/modules/circuits'

type Props = {
  circuit: Circuit
}

export default function CircuitItem({ circuit, ...rest }: Props) {
  return (
    <li {...rest} className='flex flex-col justify-between gap-x-6 py-5'>
      <div className='flex min-w-0 gap-x-4'>
        {circuit.iconUrl ? (
          <img
            alt=''
            src={circuit.iconUrl}
            className='size-12 flex-none rounded-full bg-gray-50'
          />
        ) : (
          <Avatar name={circuit.name} size={12 * 4} />
        )}
        <div className='flex min-w-0 flex-auto flex-col gap-2'>
          <p className='text-sm/6 font-semibold text-gray-900'>
            {circuit.name}
          </p>
          <p className='truncate text-xs/5 text-gray-500'>
            {circuit.description}
          </p>

          <div className='flex flex-col'>
            {circuit.timeAdded && (
              <>
                <span className='text-sm/6 text-gray-900'>
                  Added {formatDateDMYT(circuit.timeAdded)}
                </span>
                {circuit.timeUpdated ? (
                  <span className='text-xs/5 text-gray-500'>
                    Last update{' '}
                    <time
                      dateTime={new Date(circuit.timeUpdated).toISOString()}
                    >
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
              </>
            )}
          </div>

          <div className='flex flex-col'>
            {circuit.loading ? (
              <p>
                Loading: zKey {circuit.zKeyProgress?.toFixed(0) || 0}% | wasm{' '}
                {circuit.wasmProgress?.toFixed(0) || 0}%
              </p>
            ) : circuit.loadError ? (
              <p className='text-red-500'>Error: {circuit.loadError}</p>
            ) : (
              <p>Loaded</p>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
