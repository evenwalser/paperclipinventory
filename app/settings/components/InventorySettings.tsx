'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export function InventorySettings() {
  const [lowStockThreshold, setLowStockThreshold] = useState(5)
  const [hideLowStock, setHideLowStock] = useState(false)
  const [defaultSorting, setDefaultSorting] = useState('newest')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
          <Input 
            id="lowStockThreshold" 
            type="number" 
            placeholder="e.g., 5 units"
            className="max-w-xs mt-1"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="hideLowStock" 
            checked={hideLowStock}
            onCheckedChange={setHideLowStock}
          />
          <Label htmlFor="hideLowStock">
            Hide Low Stock Items on Marketplace
          </Label>
        </div>
        
        <div>
          <Label htmlFor="defaultSorting">Default Inventory Sorting</Label>
          <Select onValueChange={setDefaultSorting} value={defaultSorting}>
            <SelectTrigger className="max-w-xs mt-1">
              <SelectValue placeholder="Select default sorting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="lowStock">Low Stock First</SelectItem>
              <SelectItem value="highStock">High Stock First</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full bg-[#FF3B30] hover:bg-[#E6352B] text-white">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  )
} 