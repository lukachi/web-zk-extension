import { ArchiveIcon, CogIcon, HomeIcon } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'

import { RoutePaths } from '@/routes'
import UiDock from '@/ui/UiDock'

export default function App({ children }: PropsWithChildren) {
  const navigate = useNavigate()

  const items = [
    {
      icon: <HomeIcon className='text-white' size={18} />,
      label: 'Library',
      onClick: () => {
        navigate(RoutePaths.AppLibrary)
      },
    },
    {
      icon: <ArchiveIcon className='text-white' size={18} />,
      label: `Marketplace`,
      onClick: () => {
        navigate(RoutePaths.AppMarketplace)
      },
    },
    // {
    //   icon: <UserIcon className='text-white' size={18} />,
    //   label: 'Profile',
    //   onClick: () => alert('Profile!'),
    // },
    {
      icon: <CogIcon className='text-white' size={18} />,
      label: 'Settings',
      onClick: () => {
        navigate(RoutePaths.AppSettings)
      },
    },
  ]

  return (
    <div className='flex size-full flex-col'>
      <div className='absolute inset-0 size-full h-10/12 overflow-y-auto p-4 pt-2'>
        {children}
      </div>
      <UiDock items={items} />
    </div>
  )
}
