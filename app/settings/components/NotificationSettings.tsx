'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Mail, MessageSquare } from 'lucide-react'

export function NotificationSettings() {
  const [notificationChannels, setNotificationChannels] = useState(['in-app'])
  const [lowStockAlert, setLowStockAlert] = useState(true)
  const [newSaleAlert, setNewSaleAlert] = useState(true)
  const [notificationEmail, setNotificationEmail] = useState('')
  const [notificationPhone, setNotificationPhone] = useState('')

  const toggleNotificationChannel = (channel: string) => {
    setNotificationChannels(current =>
      current.includes(channel)
        ? current.filter(c => c !== channel)
        : [...current, channel]
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notification Channels</h3>
          <div className="flex space-x-4">
            {['in-app', 'email', 'sms'].map((channel) => (
              <Button
                key={channel}
                variant="outline"
                className={`flex items-center ${
                  notificationChannels.includes(channel)
                    ? 'bg-green-500 text-white'
                    : ''
                }`}
                onClick={() => toggleNotificationChannel(channel)}
              >
                {channel === 'in-app' && <Bell className="mr-2 h-4 w-4" />}
                {channel === 'email' && <Mail className="mr-2 h-4 w-4" />}
                {channel === 'sms' && <MessageSquare className="mr-2 h-4 w-4" />}
                {channel.charAt(0).toUpperCase() + channel.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Alert Types</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="low-stock-alert">
                Low Stock Alert
                <span className="block text-sm text-gray-500">Get notified when stock is low</span>
              </Label>
              <Switch
                id="low-stock-alert"
                checked={lowStockAlert}
                onCheckedChange={setLowStockAlert}
              />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="new-sale-alert">
                New Sale Alert
                <span className="block text-sm text-gray-500">Get notified for new sales</span>
              </Label>
              <Switch
                id="new-sale-alert"
                checked={newSaleAlert}
                onCheckedChange={setNewSaleAlert}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notification-email">Email Address</Label>
              <Input
                id="notification-email"
                type="email"
                placeholder="Enter your email address"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notification-phone">Phone Number</Label>
              <Input
                id="notification-phone"
                type="tel"
                placeholder="Enter your phone number"
                value={notificationPhone}
                onChange={(e) => setNotificationPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button className="w-full bg-[#FF3B30] hover:bg-[#E6352B] text-white">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  )
} 