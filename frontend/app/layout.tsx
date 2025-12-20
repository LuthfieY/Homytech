import type React from "react"
import { Outfit } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"

// Load Outfit font
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Homytech Dashboard</title>
        <meta name="description" content="A warm and inviting smart home dashboard" />
      </head>
      <body className={outfit.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
