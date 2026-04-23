import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Calendar, MessageSquare, MessageCircleCode, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctors", label: "Doctors", icon: Users },
    { href: "/appointments", label: "Appointments", icon: Calendar },
    { href: "/reminders", label: "Reminders", icon: Bell },
    { href: "/conversations", label: "Conversations", icon: MessageSquare },
    { href: "/simulator", label: "Simulator", icon: MessageCircleCode },
  ];

  return (
    <div className="flex h-screen bg-background w-full">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col hidden md:flex">
        <div className="p-6 border-b flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm tracking-tight text-foreground truncate">
              {user?.clinicName ?? "ClinicAI"}
            </div>
            <div className="text-xs text-muted-foreground truncate">{user?.adminEmail}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Header */}
        <header className="md:hidden border-b bg-card p-4 flex items-center justify-between">
          <div className="font-bold text-lg text-foreground">{user?.clinicName ?? "ClinicAI"}</div>
          <div className="flex space-x-2 items-center">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={`p-2 rounded-md ${location.startsWith(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                  <item.icon className="w-5 h-5" />
                </div>
              </Link>
            ))}
            <button
              onClick={logout}
              className="p-2 rounded-md text-muted-foreground hover:bg-muted"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-muted/30 p-6 md:p-8 w-full">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
