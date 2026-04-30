import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './tokens.css'
import './globals.css'
import Sidebar        from '@/components/layout/Sidebar'
import MobileNav      from '@/components/layout/MobileNav'
import ThemeProvider  from '@/components/layout/ThemeProvider'

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`}>
        <ThemeProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 h-screen overflow-y-auto pb-[68px] md:pb-0">
              {children}
            </main>
          </div>
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
