"use client"

import { Settings, FileText, MoreHorizontal, Plus } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SidebarProject } from "./sidebar-data"
import { useSession } from "@/components/session-provider"

interface SidebarDevToolsProps {
  projects: SidebarProject[]
}

export function SidebarDevTools({ projects }: SidebarDevToolsProps) {
  const { user } = useSession()

  // Only show development tools to admin users
  if (!user || user.role !== 'ADMIN') {
    return null
  }
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden mt-auto">
      <SidebarGroupLabel>Development Tools</SidebarGroupLabel>
      <SidebarGroupAction title="Add Project">
        <Plus />
        <span className="sr-only">Add Project</span>
      </SidebarGroupAction>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side="bottom"
                align="end"
              >
                <DropdownMenuItem>
                  <Settings className="text-muted-foreground" />
                  <span>Configure</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="text-muted-foreground" />
                  <span>View Details</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
