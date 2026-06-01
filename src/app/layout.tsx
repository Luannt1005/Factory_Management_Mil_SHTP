import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AppFooter from "@/components/app.footer";
import PageTransition from "@/components/PageTransition";
import { UserProvider } from "@/app/context/UserContext";

export const metadata: Metadata = {
  title: "OrgChart TTI SHTP",
  description: "Organization Chart Management System",
  icons: {
    icon: "/Milwaukee-logo-red.png",
    shortcut: "/Milwaukee-logo-red.png",
    apple: "/Milwaukee-logo-red.png",
  },
};


import { NextAuthProvider } from "@/components/NextAuthProvider";
import PageHeader from "@/components/PageHeader";
import LayoutContentWrapper from "@/components/LayoutContentWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-[var(--color-bg-page)]"
        suppressHydrationWarning
      >
        <NextAuthProvider>
          <UserProvider>
            <div className="flex flex-col w-full h-screen overflow-hidden">
              <Header />
              <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto bg-[var(--color-bg-page)] relative scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent transition-colors duration-300 flex flex-col">
                  <LayoutContentWrapper>
                    <PageHeader />
                    <PageTransition>
                      {children}
                    </PageTransition>
                  </LayoutContentWrapper>
                  <AppFooter />
                </main>
              </div>
            </div>
          </UserProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}


// Force rebuild to fix CSS 404s
