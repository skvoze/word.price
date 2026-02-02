import { Switch, Route, Redirect } from "wouter";
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
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import { Link } from "wouter";

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
  {!user ? null : user.role === "admin" ? <AdminPage /> : <Redirect to="/" />}
</Route>
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {


  return (
      <TooltipProvider>
        <div className="antialiased min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>

  );
}

export default App;
