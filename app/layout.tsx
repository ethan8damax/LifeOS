import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './tokens.css'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
  weight: '400 500',
})

export const metadata: Metadata = {
  title: 'Life OS',
  description: 'Personal productivity dashboard',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 h-screen overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
