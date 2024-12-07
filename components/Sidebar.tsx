'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LayoutDashboard, Package, PoundSterling, Bell, Settings, LogOut } from 'lucide-react'
import Image from 'next/image'

const sidebarItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'POS', href: '/pos', icon: PoundSterling },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      <div className="p-4 flex items-center">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/paperclip_logo_red@1x.jpg-t3B9TdkGvq1AYhUm9oz2nXTQvDf1IM.png"
          alt="Paperclip Logo"
          width={180}
          height={36}
          priority
          className="object-contain"
        />
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-2 p-2 pt-16">
          {sidebarItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start rounded-lg",
                  pathname === item.href ? "bg-[#FF3B30] text-white" : "hover:bg-gray-800"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-gray-800">
        <Button variant="ghost" className="w-full justify-start rounded-lg">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

