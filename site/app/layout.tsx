import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

const description =
  'Color your favicon for dev, preview, and staging, so every tab shows where you are.'

export const metadata: Metadata = {
  title: 'env.style | Environment favicons',
  description,
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
      {/* the browser mock intentionally bleeds past the container to the viewport edge */}
      <body className="overflow-x-clip">{children}</body>
    </html>
  )
}
