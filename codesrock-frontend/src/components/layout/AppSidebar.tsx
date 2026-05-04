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

  const adminRoles = ['admin', 'school_admin', 'content_admin', 'super_admin'];
  const isAdmin = user && adminRoles.includes(user.role);

  const filteredAdminItems = isAdmin
    ? adminMenuItems.filter((item) => item.roles.includes(user!.role))
    : [];

  const menuItems = isAdmin ? filteredAdminItems : teacherMenuItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-muted/50 bg-white/50 backdrop-blur-xl">
      <SidebarContent>
        <div className="p-6 border-b border-muted/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-lg group-hover:scale-110 transition-transform duration-500">
              <div className="w-full h-full bg-white rounded-[0.9rem] flex items-center justify-center overflow-hidden">
                <img src={codesrockLogo} alt="CodesRock" className="w-9 h-9 object-contain" />
              </div>
            </div>
            {open && (
              <div className="animate-fade-in">
                <h2 className="font-heading font-black text-xl text-deep-purple leading-tight tracking-tight italic">CodesRock</h2>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">
                  {isAdmin ? 'Admin Console' : 'Teacher Hub'}
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="px-3 pt-6">
          <SidebarGroupLabel className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
            {isAdmin ? 'Management' : 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 rounded-xl transition-all duration-300">
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/30 font-bold scale-[1.02]"
                            : "text-deep-purple/70 hover:bg-primary/10 hover:text-primary font-bold"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm tracking-tight">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Rocky Mini Presence in Sidebar */}
        {open && (
          <div className="mt-auto p-6 animate-slide-up">
            <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-[2rem] p-5 border border-white/40 backdrop-blur-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 blur-xl" />
               <div className="flex items-center gap-3 relative z-10">
                  <img src="/assets/rocky/signature.png" alt="Rocky" className="w-12 h-12 object-contain drop-shadow-md group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-[11px] font-black text-deep-purple leading-none mb-1 uppercase tracking-wider">Logic Spark</p>
                    <p className="text-[10px] font-bold text-muted-foreground leading-tight italic">"Keep rocking the code! 🤘"</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
