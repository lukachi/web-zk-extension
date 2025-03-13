import { FileArchiveIcon } from 'lucide-react'

import { Circuit, circuitsStore } from '@/store/circuits'

import CircuitItem from './CircuitItem'

const circuits: Circuit[] = [
  {
    iconUrl:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    name: 'Leslie Alexander',
    description: 'leslie.alexander@example.com',
    zKeyUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/circuit_final.zkey',
    wasmUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/zkLivenessFieldBits.wasm',
    timeAdded: new Date().getTime(),
    timeUpdated: new Date().getTime(),
    tag: 'liveness',
  },
  {
    iconUrl:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    name: 'Leslie Alexander',
    description: 'leslie.alexander@example.com',
    zKeyUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/circuit_final.zkey',
    wasmUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/zkLivenessFieldBits.wasm',
    timeAdded: new Date().getTime(),
    timeUpdated: new Date().getTime(),
    tag: 'liveness',
  },
  {
    iconUrl:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    name: 'Leslie Alexander',
    description: 'leslie.alexander@example.com',
    zKeyUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/circuit_final.zkey',
    wasmUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/zkLivenessFieldBits.wasm',
    timeAdded: new Date().getTime(),
    timeUpdated: new Date().getTime(),
    tag: 'liveness',
  },
  {
    iconUrl:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    name: 'Leslie Alexander',
    description: 'leslie.alexander@example.com',
    zKeyUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/circuit_final.zkey',
    wasmUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/zkLivenessFieldBits.wasm',
    timeAdded: new Date().getTime(),
    timeUpdated: new Date().getTime(),
    tag: 'liveness',
  },
  {
    iconUrl:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    name: 'Leslie Alexander',
    description: 'leslie.alexander@example.com',
    zKeyUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/circuit_final.zkey',
    wasmUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/zkLivenessFieldBits.wasm',
    timeAdded: new Date().getTime(),
    timeUpdated: new Date().getTime(),
    tag: 'liveness',
  },
  {
    iconUrl:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    name: 'Leslie Alexander',
    description: 'leslie.alexander@example.com',
    zKeyUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/circuit_final.zkey',
    wasmUrl:
      'https://tmp-dl.fra1.digitaloceanspaces.com/ZkLivenessAirdrop/zkLivenessFieldBits.wasm',
    timeAdded: new Date().getTime(),
    timeUpdated: new Date().getTime(),
    tag: 'liveness',
  },
]

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
