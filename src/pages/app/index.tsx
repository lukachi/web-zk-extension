import { ArchiveIcon, CogIcon, HomeIcon, UserIcon } from 'lucide-react'

import UiDock from '@/ui/UiDock'

import CircuitsList from './components/CircuitsList'

const items = [
  {
    icon: <HomeIcon className='text-white' size={18} />,
    label: 'Home',
    onClick: () => alert('Home!'),
  },
  {
    icon: <ArchiveIcon className='text-white' size={18} />,
    label: 'Archive',
    onClick: () => alert('Archive!'),
  },
  {
    icon: <UserIcon className='text-white' size={18} />,
    label: 'Profile',
    onClick: () => alert('Profile!'),
  },
  {
    icon: <CogIcon className='text-white' size={18} />,
    label: 'Settings',
    onClick: () => alert('Settings!'),
  },
]

export default function App() {
  return (
    <div className='flex size-full flex-col'>
      <div className='absolute inset-0 size-full h-10/12 overflow-y-auto p-4 pt-0'>
        <CircuitsList />
      </div>

      <UiDock items={items} />
    </div>
  )
}
