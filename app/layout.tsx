import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans" 
})

export const metadata: Metadata = {
  title: "Five-A-Side League",
  description: "Manage your five-a-side football league - standings, fixtures, results, and more",
}

export const viewport: Viewport = {
  themeColor: "#0f1f1a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
