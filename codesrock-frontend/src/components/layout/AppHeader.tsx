import React, { useState } from "react";
import { Bell, Search, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { authService } from "@/services";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const navigate = useNavigate();
  const user = authService.getStoredUser();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-muted/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-tour="sidebar-trigger" />
        <form onSubmit={handleSearch} className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-muted/50 dark:bg-slate-800/40 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all w-64 lg:w-80"
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-primary/10 hover:text-primary group dark:hover:bg-primary/25">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-12 w-12 rounded-xl border border-muted/30 dark:border-white/10 p-0 overflow-hidden group">
              <Avatar className="h-full w-full rounded-xl group-hover:scale-105 transition-transform">
                <AvatarImage src="" alt={user?.firstName} />
                <AvatarFallback className="bg-primary/10 text-primary font-black">
                  {user?.firstName?.[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 rounded-2xl p-2 shadow-2xl border-muted/30 dark:border-white/10 bg-white dark:bg-slate-900" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-black text-deep-purple dark:text-white leading-none">{user?.fullName}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-muted/50 dark:bg-white/5" />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-xl p-3 font-bold gap-3 focus:bg-primary/10 focus:text-primary cursor-pointer">
              <User className="h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="rounded-xl p-3 font-bold gap-3 focus:bg-destructive/10 focus:text-destructive cursor-pointer text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
