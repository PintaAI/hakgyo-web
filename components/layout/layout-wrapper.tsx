"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar"
import { SessionProvider, useSession } from "@/components/session-provider"

interface LayoutWrapperProps {
  children: React.ReactNode
}

// Routes that should not have the sidebar
const noSidebarRoutes = [
   "/",// Landing page
  "/auth",  // Auth page
]

function LayoutWrapperContent({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const session = useSession()
  const { user, isAuthenticated, isLoading } = session
  
  // Handle role-based redirects for authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Only redirect MURID users from dashboard to home
      // Admin and Guru can access all routes freely
      if (pathname === "/dashboard" && user.role === "MURID") {
        router.push("/home")
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router])
  
  // Check if current route should have sidebar
  const shouldShowSidebar = !noSidebarRoutes.includes(pathname)
  
  if (!shouldShowSidebar) {
    return <>{children}</>
  }
  
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {children}
      </main>
    </SidebarProvider>
  )
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <SessionProvider>
      <LayoutWrapperContent>{children}</LayoutWrapperContent>
    </SessionProvider>
  )
}
