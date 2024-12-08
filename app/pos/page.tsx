'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '../contexts/CartContext'
import { ShoppingCart, CreditCard, Smartphone, QrCode, Plus, Minus, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Image from 'next/image'

export default function POSPage() {
  const { items, updateQuantity, removeItem, total } = useCart()
  const router = useRouter()

  const [amount, setAmount] = useState("0.00")

  useEffect(() => {
    if (typeof total === 'number') {
      setAmount(total.toFixed(2))
    }
  }, [total])

  const handleNumberClick = (num: string) => {
    if (amount === "0.00") {
      setAmount(num)
    } else {
      setAmount(prev => prev + num)
    }
  }

  const handleClear = () => {
    setAmount(typeof total === 'number' ? total.toFixed(2) : "0.00")
  }

  const handleDecimal = () => {
    if (!amount.includes(".")) {
      setAmount(prev => prev + ".")
    }
  }

  const handleProcessRefund = () => {
    router.push('/inventory')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">Point of Sale</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cart Section */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5 text-paperclip-red" />
              Cart Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 py-2 border-b">
                  <div className="w-16 h-16 flex-shrink-0 relative rounded-md overflow-hidden">
                    <img
                      src={item.image_url || '/placeholder.svg'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.title}</h3>
                    <div className="text-sm text-gray-500 space-x-1">
                      <span>{item.category}</span>
                      {item.size && <span>• {item.size}</span>}
                    </div>
                    <div className="text-sm font-semibold">£{item.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <span className="text-xl font-semibold">Total:</span>
            <span className="text-2xl font-bold text-paperclip-red">
              £{total.toFixed(2)}
            </span>
          </CardFooter>
        </Card>

        {/* Payment Section */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-paperclip-red" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-right mb-6">
              <span className="text-4xl font-bold text-paperclip-red">£{amount}</span>
            </div>

            <Button 
              className="w-full bg-paperclip-red hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg mb-6"
              onClick={() => {/* Handle payment */}}
            >
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="h-5 w-5" />
                <Smartphone className="h-5 w-5" />
                <QrCode className="h-5 w-5" />
                <span>Tap, insert, or swipe</span>
              </div>
            </Button>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map((num) => (
                <Button
                  key={num}
                  variant={num === 'C' ? "destructive" : "outline"}
                  className="h-16 text-xl font-semibold"
                  onClick={() => {
                    if (num === 'C') handleClear();
                    else if (num === '.') handleDecimal();
                    else handleNumberClick(num.toString());
                  }}
                >
                  {num}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex gap-4">
        <Button 
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg"
          onClick={() => {
            /* Handle charge */
            clearCart()
          }}
        >
          Complete Sale
        </Button>
        <Button 
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg"
          onClick={handleProcessRefund}
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Process Refund
        </Button>
      </div>
    </div>
  )
}

