import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Shield, User } from "lucide-react";
import { useLocation } from "wouter";

export function RoleToggle() {
  const { data: user } = useUser();
  const [location, setLocation] = useLocation();

  // Если пользователь не админ, кнопку вообще не показываем
  if (!user || user.role !== "admin") return null;

  const isAdminPage = location === "/admin";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocation(isAdminPage ? "/" : "/admin")}
      className="text-xs font-medium border border-border/40 bg-secondary/20"
    >
      {isAdminPage ? (
        <>
          <User className="w-4 h-4 mr-1 text-blue-500" />
          Верификация
        </>
      ) : (
        <>
          <Shield className="w-4 h-4 mr-1 text-amber-500" />
          Выплаты (Админ)
        </>
      )}
    </Button>
  );
}