import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KMITL Badminton - Book a Court",
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
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full font-sans bg-background text-on-surface" suppressHydrationWarning>
        <Script
          id="storage-polyfill"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                window.localStorage.getItem('test');
              } catch (e) {
                var memStorage = {};
                var memStorage2 = {};
                try {
                  Object.defineProperty(window, 'localStorage', {
                    value: {
                      getItem: function(k) { return memStorage[k] || null; },
                      setItem: function(k, v) { memStorage[k] = v; },
                      removeItem: function(k) { delete memStorage[k]; },
                      clear: function() { memStorage = {}; }
                    },
                    writable: true
                  });
                  Object.defineProperty(window, 'sessionStorage', {
                    value: {
                      getItem: function(k) { return memStorage2[k] || null; },
                      setItem: function(k, v) { memStorage2[k] = v; },
                      removeItem: function(k) { delete memStorage2[k]; },
                      clear: function() { memStorage2 = {}; }
                    },
                    writable: true
                  });
                } catch (e2) {}
              }
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
