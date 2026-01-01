import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function RoleToggle() {
  const { data: user, refetch } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleToggleRole = async () => {
    if (!user) return;
    
    const newRole = user.role === "admin" ? "user" : "admin";
    const newTelegramId = newRole === "admin" ? "demo_admin_user" : "demo_user_123";
    
    try {
      const res = await fetch("/api/users/role", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-telegram-id": newTelegramId,
        },
        body: JSON.stringify({ role: newRole }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update role");
      
      localStorage.setItem("testTelegramId", newTelegramId);
      
      // Clear cache and refetch to get fresh user data with new ID
      queryClient.clear();
      
      // Navigate immediately and refetch in parallel
      const navigatePromise = setLocation(newRole === "admin" ? "/verify" : "/");
      const refetchPromise = refetch();
      
      await Promise.all([navigatePromise, refetchPromise]);
      
      toast({
        title: `Switched to ${newRole === "admin" ? "Admin" : "User"} Mode`,
        description: `You now have ${newRole === "admin" ? "admin" : "user"} permissions.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change role",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleRole}
      data-testid="button-toggle-role"
      className="text-xs font-medium"
    >
      {user.role === "admin" ? (
        <>
          <Shield className="w-4 h-4 mr-1" />
          Admin
        </>
      ) : (
        <>
          <User className="w-4 h-4 mr-1" />
          User
        </>
      )}
    </Button>
  );
}
