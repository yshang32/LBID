import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "LBID | Logistics Marketplace",
  description: "A global logistics matching and digital transaction platform for clients, agents, traders, and forwarders.",
  icons: {
    icon: "/assets/favicon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <div className="grid-glow fixed inset-0 -z-10 opacity-45" />
        {children}
      </body>
    </html>
  )
}
