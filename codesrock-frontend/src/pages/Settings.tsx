import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { User, Mail, Shield, Building, Moon, Sun, Monitor, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const user = authService.getStoredUser();

  const themeOptions = [
    {
      id: "light",
      name: "Light Mode",
      description: "Clean and bright for well-lit environments",
      icon: Sun,
      colorClass: "text-amber-500 bg-amber-500/10",
      borderClass: "border-amber-500/20",
    },
    {
      id: "dark",
      name: "Dark Mode",
      description: "Easy on the eyes and saves screen power",
      icon: Moon,
      colorClass: "text-indigo-400 bg-indigo-400/10",
      borderClass: "border-indigo-400/20",
    },
    {
      id: "system",
      name: "System Sync",
      description: "Matches your operating system's theme settings",
      icon: Monitor,
      colorClass: "text-teal-400 bg-teal-400/10",
      borderClass: "border-teal-400/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 p-1 md:p-4 max-w-5xl mx-auto"
    >
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-black text-deep-purple dark:text-white tracking-tight italic">
          Account Settings
        </h1>
        <p className="text-sm font-bold text-muted-foreground mt-1">
          Manage your personal profiles, preferences, and theme modes.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Card Summary */}
        <div className="md:col-span-1 space-y-6">
          <Card className="glass-panel overflow-hidden border-muted/30 dark:border-white/10 shadow-xl rounded-3xl">
            <div className="h-24 bg-gradient-to-r from-primary/30 to-secondary/30 relative" />
            <CardContent className="pt-0 relative px-6 pb-6">
              <div className="flex flex-col items-center -mt-12">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent p-1 shadow-xl">
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[1.4rem] flex items-center justify-center text-3xl font-black text-primary">
                    {user?.firstName?.[0]}
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-deep-purple dark:text-white mt-4 leading-none">
                  {user?.fullName}
                </h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1 rounded-full">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/35 dark:bg-slate-800/40 border border-muted/10 dark:border-white/5">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-none">Email Address</p>
                    <p className="text-sm font-bold text-deep-purple dark:text-slate-200 truncate mt-1">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/35 dark:bg-slate-800/40 border border-muted/10 dark:border-white/5">
                  <Building className="h-5 w-5 text-secondary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-none">Institution</p>
                    <p className="text-sm font-bold text-deep-purple dark:text-slate-200 truncate mt-1">Codesrock Academy</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/35 dark:bg-slate-800/40 border border-muted/10 dark:border-white/5">
                  <Shield className="h-5 w-5 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-none">System ID</p>
                    <p className="text-xs font-mono font-bold text-deep-purple dark:text-slate-200 truncate mt-1">{user?.id}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configurations Area */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel border-muted/30 dark:border-white/10 shadow-xl rounded-3xl p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-black text-deep-purple dark:text-white">Appearance Settings</CardTitle>
              <CardDescription className="text-xs font-bold text-muted-foreground">
                Customize the UI theme colors of your portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`relative flex flex-col items-start p-5 rounded-3xl border-2 text-left transition-all duration-300 group hover:scale-[1.02] ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                          : "border-muted/30 hover:border-primary/50 bg-white/20 dark:bg-slate-900/20"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full shadow-md animate-scale-in">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                      <div className={`p-3 rounded-2xl ${opt.colorClass} ${opt.borderClass} border`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-heading font-black text-base text-deep-purple dark:text-white mt-6 leading-none">
                        {opt.name}
                      </h4>
                      <p className="text-xs font-bold text-muted-foreground mt-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-muted/20 dark:border-white/5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 gap-4">
                  <div>
                    <h5 className="font-heading font-black text-sm text-deep-purple dark:text-white leading-none">System Preference Sync</h5>
                    <p className="text-xs font-bold text-muted-foreground mt-1 leading-relaxed">
                      Enable system sync to transition between themes automatically matching your computer schedule.
                    </p>
                  </div>
                  <Button
                    onClick={() => setTheme("system")}
                    variant={theme === "system" ? "default" : "outline"}
                    className="rounded-xl font-bold h-9 text-xs border-primary/30 shrink-0 shadow-sm"
                  >
                    Sync Device Theme
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
