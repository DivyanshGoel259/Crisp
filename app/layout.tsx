import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Crisp - AI Interview Assistant",
  description:
    "AI-powered interview platform for seamless candidate evaluation. Upload your resume and experience personalized technical interviews with real-time AI scoring and feedback.",
  generator: "v0.app",
  keywords: ["AI interview", "technical interview", "candidate evaluation", "resume analysis", "interview assistant"],
  authors: [{ name: "Crisp Team" }],
  openGraph: {
    title: "Crisp - AI Interview Assistant",
    description: "AI-powered interview platform for seamless candidate evaluation",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${inter.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
