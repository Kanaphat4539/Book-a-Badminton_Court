import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apex Badminton - Book a Court",
  description: "Premium Court Booking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full font-sans bg-[#050505] text-on-surface flex justify-center">
        {/* Mobile View Wrapper */}
        <div 
          className="w-full max-w-md bg-background min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,1)] sm:border-x sm:border-[#2A2A2A] flex flex-col"
          style={{ transform: 'translateZ(0)' }} // This makes 'fixed' children relative to this container instead of the viewport
        >
          {children}
        </div>
        <Toaster position="top-center" theme="dark" />
      </body>
    </html>
  );
}
