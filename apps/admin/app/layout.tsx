import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "Postloom Admin",
    template: "%s | Postloom Admin",
  },
  description: "Postloom administration dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.setAttribute("data-theme","dark")}var a=localStorage.getItem("site-accent");if(a){var c=JSON.parse(a);var s=document.createElement("style");s.id="accent-override";s.textContent=":root{--site-primary:"+c.accent+";--site-primary-fill:"+c.accent+";--site-accent:"+c.dark+"}[data-theme=\\"dark\\"]{--site-primary:"+c.light+";--site-primary-fill:"+c.accent+";--site-accent:"+c.light+"}";document.head.appendChild(s)}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
