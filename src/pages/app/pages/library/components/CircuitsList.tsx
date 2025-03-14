import { FileArchiveIcon } from 'lucide-react'

import { circuitsStore } from '@/store/modules/circuits'

import CircuitItem from './CircuitItem'

export default function CircuitsList() {
  const circuits = circuitsStore.useCircuitsStore(state => state.circuits)

  if (!circuits.length) {
    return (
      <div className='flex size-full flex-col items-center justify-center gap-2'>
        <FileArchiveIcon size={148} className='text-black/90' />
        <span className='text-black/50'>No circuits loaded</span>
      </div>
    )
  }

  return (
    <ul role='list' className='size-full divide-y divide-gray-100'>
      {circuits.map((circuit, idx) => (
        <CircuitItem key={idx} circuit={circuit} />
      ))}
    </ul>
  )
}
