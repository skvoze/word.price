import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function RoleToggle() {
  const { data: user, refetch } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleToggleRole = async () => {
    if (!user) return;
    
    const newRole = user.role === "admin" ? "user" : "admin";
    // Simulate different users by using different Telegram IDs
    const newTelegramId = newRole === "admin" ? "demo_admin_user" : "demo_user_123";
    
    try {
      // IMPORTANT: Update localStorage FIRST before API call
      localStorage.setItem("testTelegramId", newTelegramId);
      
      // Clear query cache BEFORE API call so refetch uses new headers
      queryClient.clear();
      
      // Update role for the new user with explicit header
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
      
      // Wait a moment for server to process, then refetch with new user
      await new Promise(resolve => setTimeout(resolve, 100));
      await refetch();
      
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
