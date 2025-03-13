import { Circuit } from '../types'
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
  return (
    <ul role='list' className='size-full divide-y divide-gray-100'>
      {circuits.map((circuit, idx) => (
        <CircuitItem key={idx} circuit={circuit} />
      ))}
    </ul>
  )
}
