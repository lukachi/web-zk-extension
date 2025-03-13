import CircuitsList from './components/CircuitsList'

export default function Library() {
  return (
    <div className='flex size-full flex-col'>
      <h3 className='text-center text-lg'>My Circuits</h3>
      <CircuitsList />
    </div>
  )
}
