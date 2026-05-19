import { Switch, Route, Redirect } from "wouter";
import { WagmiProvider, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { config } from "@/lib/web3Config";
import { base } from 'viem/chains'; 
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/use-user";
import "./index.css";
import '@rainbow-me/rainbowkit/styles.css';
import Home from "@/pages/Home";
import CreateTask from "@/pages/CreateTask";
import TaskDetails from "@/pages/TaskDetails";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/AdminPage";
import Verify from "@/pages/Verify";
import AdminHistory from "@/pages/AdminHistory";
import Landing from "@/pages/Landing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";


function Router() {
  const { isConnected, isConnecting } = useAccount();
  const { data: user, isLoading: isUserLoading, isError } = useUser();
  
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }
  if (!isConnected) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/refund" component={Refund} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    );
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/">
          {isAdmin ? <Verify /> : <Home />}
        </Route>

        <Route path="/create" component={CreateTask} />
        <Route path="/task/:id" component={TaskDetails} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/refund" component={Refund} />
        
        <Route path="/verify" component={Verify} />
        <Route path="/admin/history" component={AdminHistory} />
        <Route path="/admin">
          {isAdmin ? <AdminPage /> : <Redirect to="/" />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
        <OnchainKitProvider chain={base as any}>
          <RainbowKitProvider 
            theme={darkTheme({ 
              accentColor: '#ffffff', 
              accentColorForeground: '#000000',
              borderRadius: 'medium'
            })}
            modalSize="compact"
          >
            <TooltipProvider>
              <div className="antialiased min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
                <Router />
                <Toaster />
              </div>
            </TooltipProvider>
          </RainbowKitProvider>
        </OnchainKitProvider>
    </WagmiProvider>
  );
}