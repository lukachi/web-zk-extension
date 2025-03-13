import { useEffect } from 'react';

export default function() {
  useEffect(() => {
    console.log("Hello from the popup!");
  }, []);

  return (
    <div className='h-full flex flex-col gap-4 items-center justify-center'>
      <img className='size-[200px]' src="/icon-with-shadow.svg" />
      <h1 className='text-[18px] text-white font-bold m-0'>vite-plugin-web-extension</h1>
      <p className='text-white/70 m-0'>
        Template: <code className='text-[12px] px-[2px] py-1 bg-[#ffffff24] rounded-[2px]'>react-ts</code>
      </p>
    </div>
  )
}
