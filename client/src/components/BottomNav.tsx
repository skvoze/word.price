import { Link, useLocation } from "wouter";
import { PlusCircle, CheckCircle, History, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/use-user"; 

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  highlight?: boolean; 
}

export function BottomNav() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const isAdmin = user?.role === "admin";
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const safeAreaStyle = {
  paddingBottom: isMobile 
    ? 'calc(env(safe-area-inset-bottom) + 40px)' 
    : '12px',
  height: 'auto',
  minHeight: isMobile 
    ? 'calc(env(safe-area-inset-bottom) + 100px)' 
    : '70px'
};

  const navItems: NavItem[] = isAdmin 
    ? [
        { href: "/verify", icon: CheckCircle, label: "Verify" },
        { href: "/admin/history", icon: History, label: "History" },
      ]
    : [
        { href: "/create", icon: PlusCircle, label: "New Task", highlight: true },
      ];

  if (!isAdmin) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute bottom-full left-0 right-0 h-20 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        <div 
          className="bg-background/40 backdrop-blur-3xl border-t border-white/5 px-6 transition-all"
          style={safeAreaStyle}
        >
          <Link href="/create" className="w-full max-w-xs mx-auto">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.95 }} // Чуть сильнее уменьшаем при нажатии для фидбека
              className="cursor-pointer relative group"
            >
              <div className="absolute inset-0 bg-primary/25 blur-2xl rounded-full group-hover:bg-primary/35 transition-colors" />
              <div className="relative bg-primary text-primary-foreground h-14 rounded-2xl shadow-[0_8px_32px_rgba(0,122,255,0.4)] flex items-center justify-center space-x-3 border border-white/10 px-8">
                <PlusCircle className="w-6 h-6 stroke-[2.5px]" />
                <span className="text-base font-black uppercase tracking-wider">
                  New Task
                </span>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    );
  }


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
                  <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
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