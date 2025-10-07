import { Home, Play, BookOpen, CheckSquare, Trophy, Award, Calendar } from "lucide-react";
import { NavLink } from "react-router-dom";
import codesrockLogo from "@/assets/codesrock-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Video Library", url: "/videos", icon: Play },
  { title: "Resources", url: "/resources", icon: BookOpen },
  { title: "Evaluation", url: "/evaluation", icon: CheckSquare },
  { title: "Achievements", url: "/achievements", icon: Trophy },
  { title: "Certificates", url: "/certificates", icon: Award },
  { title: "Calendar", url: "/calendar", icon: Calendar },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={codesrockLogo} alt="CodesRock Logo" className="w-10 h-10 object-contain" />
            {open && (
              <div>
                <h2 className="font-bold text-lg text-foreground">CodesRock</h2>
                <p className="text-xs text-muted-foreground">Teacher Portal</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
