import './globals.css'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CartProvider } from './contexts/CartContext'
import { ASSETS } from '@/lib/constants'
import Image from 'next/image'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Paperclip Consign MVP',
  description: 'Digital inventory management for consignment stores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <CartProvider>
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-900 to-gray-950 p-8">
                  {children}
                </main>
              </div>
            </div>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

