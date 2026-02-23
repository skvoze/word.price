import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import AdminPage from "./pages/AdminPage";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CreateTask from "@/pages/CreateTask";
import TaskDetails from "@/pages/TaskDetails";
import Wallet from "@/pages/Wallet";
import Verify from "@/pages/Verify";
import AdminHistory from "@/pages/AdminHistory";
import Landing from "@/pages/Landing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import SuccessPage from "@/pages/SuccessPage";
import FailPage from "@/pages/FailPage";
import { useUser } from "@/hooks/use-user";

function Router() {
  const { data: user, isLoading } = useUser();
  const isAdmin = user?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/refund" component={Refund} />
         <Route path="/success" component={SuccessPage} />
        <Route path="/failed" component={FailPage} /> 
        <Route>
            <Redirect to="/" />
        </Route>
      </Switch>
    );
  }
    return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/">
          {isAdmin ? <Verify /> : <Home />}
        </Route>
        <Route path="/create" component={CreateTask} />
        <Route path="/task/:id" component={TaskDetails} />
        <Route path="/wallet" component={Wallet} />
        <Route path="/success" component={SuccessPage} />
        <Route path="/fail" component={FailPage} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/refund" component={Refund} />
        
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
