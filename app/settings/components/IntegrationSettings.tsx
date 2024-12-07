'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button} from "@/components/ui/button"
import { Label} from "@/components/ui/label"
import { RefreshCw } from 'lucide-react'
import Image from 'next/image'

export function IntegrationSettings() {
  const [syncStatus, setSyncStatus] = useState('Connected')
  const [lastSyncTime, setLastSyncTime] = useState('2 hours ago')
  const [isReconnecting, setIsReconnecting] = useState(false)

  const handleReconnect = async () => {
    setIsReconnecting(true)
    // Simulate reconnection attempt
    await new Promise(resolve => setTimeout(resolve, 2000))
    setSyncStatus('Connected')
    setLastSyncTime('Just now')
    setIsReconnecting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/paperclip_logo_red@1x.jpg-t3B9TdkGvq1AYhUm9oz2nXTQvDf1IM.png"
            alt="Paperclip Logo"
            width={200}
            height={40}
            className="mb-4"
            priority
          />
          <p className="text-center text-sm text-muted-foreground">
            Your inventory is automatically synced with the Paperclip Marketplace.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base">Paperclip Marketplace Sync Status</Label>
            <span className={`font-semibold ${syncStatus === 'Connected' ? 'text-green-500' : 'text-red-500'}`}>
              {syncStatus}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Label className="text-base">Last Sync</Label>
            <span className="text-muted-foreground">
              {lastSyncTime}
            </span>
          </div>
          {syncStatus !== 'Connected' && (
            <div className="flex justify-end">
              <Button
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="bg-[#FF3B30] hover:bg-[#E6352B] text-white"
              >
                {isReconnecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  'Reconnect'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}