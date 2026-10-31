import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Geist covers Kazakh Cyrillic (ә ғ қ ң ө ұ ү һ і).
const geist = Geist({ subsets: ["latin", "cyrillic"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "JIHC Portal",
  description: "Жамбыл инновациялық жоғары колледжінің академиялық порталы",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kk" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
