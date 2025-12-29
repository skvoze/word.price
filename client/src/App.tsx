import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CreateTask from "@/pages/CreateTask";
import TaskDetails from "@/pages/TaskDetails";
import Wallet from "@/pages/Wallet";
import Verify from "@/pages/Verify";

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/create" component={CreateTask} />
        <Route path="/task/:id" component={TaskDetails} />
        <Route path="/wallet" component={Wallet} />
        <Route path="/verify" component={Verify} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
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
