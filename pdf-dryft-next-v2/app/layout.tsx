import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF DRYFT',
  description: 'PDF Processing and Search Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4">
          {children}
        </div>
      </body>
    </html>
  )
}
