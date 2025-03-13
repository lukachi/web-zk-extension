import CircuitsList from "./components/CircuitsList";
import UiDock from "../../ui/UiDock";
import {ArchiveIcon, CogIcon, HomeIcon, UserIcon} from "lucide-react";

const items = [
    { icon: <HomeIcon className='text-white' size={18} />, label: 'Home', onClick: () => alert('Home!') },
    { icon: <ArchiveIcon className='text-white' size={18} />, label: 'Archive', onClick: () => alert('Archive!') },
    { icon: <UserIcon className='text-white' size={18} />, label: 'Profile', onClick: () => alert('Profile!') },
    { icon: <CogIcon className='text-white' size={18} />, label: 'Settings', onClick: () => alert('Settings!') },
]

export default function App() {
    return (
        <div className='size-full flex flex-col'>
            <div className="overflow-y-auto size-full absolute inset-0 p-4 pt-0 h-10/12">
                <CircuitsList />
            </div>

            <UiDock items={items} />
        </div>
    )
}
