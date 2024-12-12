import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, ShoppingCart, RotateCcw } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <Link href="/inventory/add">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
              <PlusCircle className="h-6 w-6" />
              <span>Add New Item</span>
            </Button>
          </Link>
          <Link href="/pos">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
              <ShoppingCart className="h-6 w-6" />
              <span>New Sale</span>
            </Button>
          </Link>
          <Link href="/inventory">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
              <RotateCcw className="h-6 w-6" />
              <span>Process Return</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

