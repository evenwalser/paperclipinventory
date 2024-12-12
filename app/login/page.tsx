import { ASSETS } from '@/lib/constants'
import Image from 'next/image'

// Inside the login component:
<div className="flex justify-center mb-8">
  <Image 
    src={ASSETS.LOGO}
    alt="Paperclip Logo"
    width={160}
    height={50}
    priority
  />
</div> 