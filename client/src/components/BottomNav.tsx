import { Link, useLocation } from "wouter";
import { Home, PlusCircle, Wallet, CheckCircle, History } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/use-user";

export function BottomNav() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const isAdmin = user?.role === "admin";

  const navItems = isAdmin 
    ? [
        { href: "/verify", icon: CheckCircle, label: "Verify" },
        { href: "/admin/history", icon: History, label: "History" },
      ]
    : [
        { href: "/", icon: Home, label: "Home" },
        { href: "/create", icon: PlusCircle, label: "Pledge", highlight: true },
        { href: "/wallet", icon: Wallet, label: "Wallet" },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border/50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="relative group w-full">
              <div className="flex flex-col items-center justify-center space-y-1 py-1 cursor-pointer">
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(0,122,255,0.5)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div className={`
                  p-2 rounded-2xl transition-all duration-200
                  ${item.highlight ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 -mt-6 mb-2 hover:shadow-primary/40' : ''}
                  ${!item.highlight && isActive ? 'text-primary' : ''}
                  ${!item.highlight && !isActive ? 'text-muted-foreground hover:text-foreground' : ''}
                `}>
                  <item.icon className={item.highlight ? "w-6 h-6" : "w-5 h-5"} />
                </div>
                {!item.highlight && (
                  <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
