import { Home, Play, BookOpen, CheckSquare, Trophy, Award, Calendar, Shield, Users, FileText, BarChart, Building2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import codesrockLogo from "@/assets/codesrock-logo.png";
import { authService } from "@/services";
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

const teacherMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Video Library", url: "/videos", icon: Play },
  { title: "Resources", url: "/resources", icon: BookOpen },
  { title: "Evaluation", url: "/evaluation", icon: CheckSquare },
  { title: "Achievements", url: "/achievements", icon: Trophy },
  { title: "Certificates", url: "/certificates", icon: Award },
  { title: "Calendar", url: "/calendar", icon: Calendar },
];

// Admin menu items with role-based access
const adminMenuItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield, roles: ['super_admin', 'school_admin', 'content_admin'] },
  { title: "Schools", url: "/admin/schools", icon: Building2, roles: ['super_admin'] },
  { title: "User Management", url: "/admin/users", icon: Users, roles: ['super_admin', 'school_admin'] },
  { title: "Content Management", url: "/admin/content", icon: FileText, roles: ['super_admin', 'content_admin'] },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart, roles: ['super_admin', 'school_admin', 'content_admin'] },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const user = authService.getStoredUser();

  // Determine if user is admin
  const adminRoles = ['admin', 'school_admin', 'content_admin', 'super_admin'];
  const isAdmin = user && adminRoles.includes(user.role);

  // Filter admin menu items based on user's role
  const filteredAdminItems = isAdmin
    ? adminMenuItems.filter((item) => item.roles.includes(user!.role))
    : [];

  // Select menu items based on role
  const menuItems = isAdmin ? filteredAdminItems : teacherMenuItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={codesrockLogo} alt="CodesRock Logo" className="w-10 h-10 object-contain" />
            {open && (
              <div>
                <h2 className="font-bold text-lg text-foreground">CodesRock</h2>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? 'Admin Portal' : 'Teacher Portal'}
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? 'Admin' : 'Main Navigation'}</SidebarGroupLabel>
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
