import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import AdminPage from "./pages/AdminPage";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CreateTask from "@/pages/CreateTask";
import TaskDetails from "@/pages/TaskDetails";
import Wallet from "@/pages/Wallet";
import Verify from "@/pages/Verify";
import AdminHistory from "@/pages/AdminHistory";

import { useUser } from "@/hooks/use-user";

function Router() {
  const { data: user } = useUser();
  const isAdmin = user?.role === "admin";

  return (
    <AnimatePresence mode="wait">
      <Switch>
        {/* User Routes */}
        <Route path="/">
          {isAdmin ? <Verify /> : <Home />}
        </Route>
        <Route path="/create" component={CreateTask} />
        <Route path="/task/:id" component={TaskDetails} />
        <Route path="/wallet" component={Wallet} />
        
        {/* Admin Routes */}
        <Route path="/verify" component={Verify} />
        <Route path="/admin/history" component={AdminHistory} />
        <Route path="/admin">
  {() => {
    const { data: user, isLoading } = useUser();

    if (isLoading) return null;

    if (user?.role === "admin") {
      return <AdminPage />;
    }
    return <Home />;
  }}
</Route>
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  // Initialize default Telegram ID for testing
  if (!localStorage.getItem("testTelegramId")) {
    localStorage.setItem("testTelegramId", "demo_user_123");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="antialiased min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
