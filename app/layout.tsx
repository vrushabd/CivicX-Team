import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { FirebaseProvider } from "@/components/providers/firebase-provider"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "CivicReport - Municipal Issue Reporting",
  description: "Report and track civic issues like garbage in your community",
 generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <FirebaseProvider>{children}</FirebaseProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
