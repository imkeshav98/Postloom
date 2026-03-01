import type { Metadata } from "next";
import type { Blog, Category, SiteConfig } from "@autoblog/database";
import { Poppins } from "next/font/google";
import { getBlogConfig } from "@/lib/data";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

// Fallback for build time when BLOG_ID is not set
type BlogConfig = Blog & { siteConfig: SiteConfig | null; categories: Category[] };

async function safeGetBlogConfig(): Promise<BlogConfig | null> {
  if (!process.env.BLOG_ID) return null;
  try {
    return await getBlogConfig();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const blog = await safeGetBlogConfig();
  if (!blog) return { title: "Blog" };

  return {
    title: {
      default: blog.name,
      template: `%s | ${blog.name}`,
    },
    description: blog.description ?? undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const blog = await safeGetBlogConfig();
  const palette = blog?.siteConfig?.palette ?? "default";

  return (
    <html
      lang={blog?.language ?? "en"}
      suppressHydrationWarning
      data-palette={palette !== "default" ? palette : undefined}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.setAttribute("data-theme","dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Header blogName={blog?.name ?? "Blog"} />
        <main className="min-h-screen">{children}</main>
        <Footer
          blog={blog ?? ({ name: "Blog" } as Blog)}
          categories={blog?.categories ?? []}
        />
      </body>
    </html>
  );
}
