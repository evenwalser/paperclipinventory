'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, MessageSquare, Tag, Clock, CheckCircle2, XCircle, CornerUpRight, DollarSign, MoreHorizontal, ArrowLeft } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'offer' | 'message' | 'email'
  sender: string
  subject: string
  content: string
  date: string
  read: boolean
  offerAmount?: number
  itemImage?: string
  itemTitle?: string
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'offer',
    sender: 'John Doe',
    subject: 'Offer on Vintage Watch',
    content: 'I\'m interested in your vintage watch. Would you accept £150?',
    date: '2024-11-25T10:30:00Z',
    read: false,
    offerAmount: 150,
    itemImage: '/placeholder.svg?height=100&width=100',
    itemTitle: 'Vintage Watch'
  },
  {
    id: '2',
    type: 'message',
    sender: 'Jane Smith',
    subject: 'Question about item condition',
    content: 'Hi, I\'m wondering about the condition of the antique vase you\'re selling. Are there any chips or cracks?',
    date: '2024-11-23T09:15:00Z',
    read: false
  },
  {
    id: '3',
    type: 'email',
    sender: 'Paperclip Support',
    subject: 'Welcome to Paperclip!',
    content: 'Welcome to Paperclip! We\'re excited to have you on board.',
    date: '2024-11-22T14:20:00Z',
    read: true
  }
]

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'offer':
      return <Tag className="h-5 w-5 text-green-500" />
    case 'message':
      return <MessageSquare className="h-5 w-5 text-blue-500" />
    case 'email':
      return <Mail className="h-5 w-5 text-purple-500" />
    default:
      return null
  }
}

const NotificationBadge = ({ type }: { type: string }) => {
  switch (type) {
    case 'offer':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Offer</Badge>
    case 'message':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Message</Badge>
    case 'email':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Email</Badge>
    default:
      return null
  }
}

export default function NotificationsPage() {
  const [notificationList, setNotificationList] = useState(notifications)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [counterOffer, setCounterOffer] = useState('')

  const handleAction = (action: string, notification: Notification) => {
    setActiveModal(action)
    setActiveNotification(notification)
  }

  const handleReply = async () => {
    console.log('Sending reply:', replyContent)
    setNotificationList(prev => prev.map(n => 
      n.id === activeNotification?.id ? { ...n, read: true } : n
    ))
    setActiveModal(null)
    setReplyContent('')
  }

  const handleOfferAction = async (action: 'accept' | 'counter' | 'decline') => {
    console.log('Offer action:', action, counterOffer)
    setNotificationList(prev => prev.map(n => 
      n.id === activeNotification?.id ? { ...n, read: true } : n
    ))
    setActiveModal(null)
    setCounterOffer('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'dd/MM/yyyy, HH:mm')
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <Link href="/" passHref>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Notifications</h1>
      
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
          <CardTitle className="text-xl">Inbox</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <AnimatePresence>
              {notificationList.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`
                    border-b border-gray-100 dark:border-gray-800 
                    hover:bg-gray-50 dark:hover:bg-gray-800/50 
                    transition-colors duration-200
                    ${!notification.read ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}
                  `}
                >
                  <div className="p-4 flex items-start gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <NotificationIcon type={notification.type} />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <NotificationBadge type={notification.type} />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          from {notification.sender}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {notification.subject}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                        {notification.content}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        {formatDate(notification.date)}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      {notification.type === 'offer' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleAction('accept-offer', notification)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAction('decline-offer', notification)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {(notification.type === 'message' || notification.type === 'email') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleAction('reply', notification)}
                        >
                          <CornerUpRight className="h-4 w-4" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => console.log('Mark as read')}>
                            Mark as {notification.read ? 'unread' : 'read'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log('Delete')}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={activeModal === 'reply'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reply to {activeNotification?.sender}</DialogTitle>
            <DialogDescription>{activeNotification?.subject}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Type your reply here..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleReply}>
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal?.includes('offer')} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {activeModal === 'accept-offer' ? 'Accept' : 'Decline'} Offer
            </DialogTitle>
            <DialogDescription>
              {activeNotification?.sender} offered ${activeNotification?.offerAmount}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {activeNotification?.itemImage && (
              <img
                src={activeNotification.itemImage}
                alt={activeNotification.itemTitle}
                className="w-full h-40 object-cover rounded-lg"
              />
            )}
            {activeModal === 'accept-offer' && (
              <Input
                type="number"
                placeholder="Enter counter offer amount"
                value={counterOffer}
                onChange={(e) => setCounterOffer(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            {activeModal === 'accept-offer' ? (
              <>
                <Button onClick={() => handleOfferAction('counter')}>
                  Counter Offer
                </Button>
                <Button onClick={() => handleOfferAction('accept')}>
                  Accept Offer
                </Button>
              </>
            ) : (
              <Button 
                variant="destructive" 
                onClick={() => handleOfferAction('decline')}
              >
                Decline Offer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

