import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

const description =
  'Environment-tinted favicons for Next.js and Vite — see at a glance whether a tab is dev, preview, staging, or production.'

export const metadata: Metadata = {
  title: 'env.style — environment-tinted favicons',
  description,
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
      <body>{children}</body>
    </html>
  )
}
