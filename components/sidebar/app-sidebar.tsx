"use client"

import { useMemo } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar"
import { AppSidebarHeader } from "./sidebar-header"
import { SidebarNav } from "./sidebar-nav"
import { SidebarDevTools } from "./sidebar-devtools"
import { AppSidebarFooter } from "./sidebar-footer"
import { getSidebarData } from "./sidebar-data"
import { useSession } from "@/components/session-provider"

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: AppSidebarProps) {
  const { user } = useSession()
  const sidebarData = useMemo(() => getSidebarData(user?.role), [user?.role])

  return (
    <Sidebar collapsible="icon" {...props}>
      <AppSidebarHeader />
      <SidebarContent>
        <div className="relative flex flex-col gap-2 transition-all duration-300 ease-in-out group-data-[state=expanded]:top-0 group-data-[state=expanded]:translate-y-0 group-data-[state=collapsed]:top-1/2 group-data-[state=collapsed]:-translate-y-1/2">
          <SidebarNav items={sidebarData.navMain} title="Menu" />
          <SidebarDevTools projects={sidebarData.projects} />
        </div>
      </SidebarContent>
      <AppSidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}
