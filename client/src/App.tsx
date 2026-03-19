import { Switch, Route, Redirect } from "wouter";
import { WagmiProvider, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { config } from "@/lib/web3Config";
import { baseSepolia } from 'viem/chains';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/use-user";

import "./index.css";
import '@rainbow-me/rainbowkit/styles.css';

// Твои оригинальные страницы
import Home from "@/pages/Home";
import CreateTask from "@/pages/CreateTask";
import TaskDetails from "@/pages/TaskDetails";
import Wallet from "@/pages/Wallet";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/AdminPage";
import Verify from "@/pages/Verify";
import AdminHistory from "@/pages/AdminHistory";
import Landing from "@/pages/Landing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import SuccessPage from "@/pages/SuccessPage";
import FailPage from "@/pages/FailPage";

const queryClient = new QueryClient();

function Router() {
  const { isConnected, isConnecting } = useAccount();
  const { data: user, isLoading: isUserLoading, isError } = useUser();
  
  // 1. Состояние первичной загрузки (когда wagmi еще думает)
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
        <Route path="/success" component={SuccessPage} />
        <Route path="/failed" component={FailPage} />
        <Route><Redirect to="/" /></Route>
      </Switch>
    );
  }


  if (isError && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
        <div className="bg-zinc-900 border border-white/10 p-8 rounded-2xl max-w-sm">
          <h1 className="text-xl font-bold mb-4 text-red-500">Connection Busy</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Database is under heavy load. We'll try to connect you in a moment.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 4. Если кошелек ПОДКЛЮЧЕН, но данные юзера еще в пути
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // 5. ТОЛЬКО ТЕПЕРЬ, когда у нас есть и коннект, и данные юзера, рисуем основной интерфейс
  const isAdmin = user?.role === "admin";

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
        <OnchainKitProvider chain={baseSepolia as any}>
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