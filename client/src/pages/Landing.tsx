import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ChevronDown, 
  ShieldCheck, 
  Mail, 
  Send, 
  Wallet, 
  Globe, 
  Zap, 
  Lock, 
  TrendingDown,
  AlertTriangle
} from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useUser } from "@/hooks/use-user";

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { isConnected } = useAccount();
  const { data: user } = useUser();

  useEffect(() => {
    if (isConnected && user) {
      if (user.role === "admin") {
        setLocation("/verify");
      } else {
        setLocation("/");
      }
    }
  }, [isConnected, user, setLocation]);

  const faq = [
    { 
      q: "Is this gambling or betting?", 
      a: "No. In gambling, you bet on luck. Here, you bet on yourself. You have 100% control over the outcome. If you do the work, you keep your money. If you fail, the protocol executes the penalty." 
    },
    { 
      q: "What counts as proof of completion?", 
      a: "Verifiable evidence: unedited photos or videos showing the result. Our moderators audit every report. Metadata (time/location) is cross-checked to ensure zero manipulation." 
    },
    { 
      q: "What happens if I miss the deadline?", 
      a: "The smart contract triggers a 'Slash' event. Your locked stake is permanently forfeited to the protocol. No excuses, no extensions." 
    },
    { 
      q: "Are my funds secure on Base?", 
      a: "Yes. All operations run on the Base Network (Layer 2 by Coinbase). We use non-custodial logic; the protocol handles the assets based on predefined rules you agree to when setting the stake." 
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-white selection:text-black">
      <main className="max-w-4xl mx-auto px-4 py-20">
        
        {/* ——— 1. HERO SECTION ——— */}
        <section className="text-center mb-28">
          <div className="inline-block px-3 py-1 border border-zinc-800 rounded-full mb-8">
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
               <Zap className="w-3 h-3 fill-current" /> High Stakes Accountability
             </span>
          </div>
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase mb-6 leading-[0.85]">
            Word <br /> Price
          </h1>
          <p className="text-xl font-bold text-zinc-500 uppercase tracking-tight max-w-lg mx-auto leading-tight">
            Put your money where your mouth is. <br/> 
            The final cure for procrastination.
          </p>
        </section>

        {/* ——— 2. THE PSYCHOLOGY ——— */}
        <section className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 p-10 rounded-[2.5rem] border border-zinc-900/80">
              <h3 className="text-zinc-600 uppercase font-black text-xs mb-6 tracking-widest">The Problem</h3>
              <p className="text-zinc-400 text-xl font-bold leading-tight italic">
                "Talk is cheap. Promises to yourself are broken because they cost <span className="text-white">nothing</span>."
              </p>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden group">
              <h3 className="text-zinc-400 uppercase font-black text-xs mb-6 tracking-widest">The Skin in the Game</h3>
              <div className="space-y-4">
                <p className="text-zinc-900 font-extrabold text-3xl leading-[0.9] uppercase italic tracking-tighter">
                  Succeed: <span className="text-zinc-400">Keep All</span> <br/>
                  Fail: <span className="text-red-600">Lose Stake</span>
                </p>
                <div className="pt-4 border-t border-zinc-200">
                   <p className="text-[10px] text-zinc-400 leading-tight uppercase font-bold">
                     Protocol execution is final. No second chances.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— 3. PROTOCOL STEPS ——— */}
        <section className="mb-40 space-y-20">
          <h2 className="text-center text-4xl font-black uppercase italic tracking-tighter">The Protocol</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              { n: "01", t: "Commit", d: "Set a clear goal, a hard deadline, and lock your stake in the smart contract.", icon: <Lock className="w-4 h-4" /> },
              { n: "02", t: "Execute", d: "Do the work. No excuses. Record your progress and upload evidence before time runs out.", icon: <Zap className="w-4 h-4" /> },
              { n: "03", t: "Verify", d: "Decentralized auditing verifies your proof. One mistake or missed minute leads to slashing.", icon: <ShieldCheck className="w-4 h-4" /> },
              { n: "04", t: "Recover", d: "Once approved, your full stake is released back to your balance instantly.", icon: <Wallet className="w-4 h-4" /> }
            ].map((step, i) => (
              <div key={i} className="flex flex-col gap-4 p-8 bg-zinc-900/20 border border-zinc-900 rounded-3xl hover:border-zinc-700 transition-colors group">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black italic text-zinc-800 group-hover:text-zinc-600 transition-colors">{step.n}</span>
                  <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-white transition-colors">{step.icon}</div>
                </div>
                <h4 className="font-bold uppercase text-white text-lg tracking-tight">{step.t}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ——— 4. MAIN CALL TO ACTION ——— */}
        <section className="flex flex-col items-center mb-48">
          <div className="bg-zinc-900/50 p-1 rounded-full border border-zinc-800 mb-10 scale-125">
            <ConnectButton label="Enter the Protocol" />
          </div>
          <div className="flex items-center gap-6 text-zinc-500">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
              <Globe className="w-3 h-3" /> Base Network
            </div>
            <div className="w-1 h-1 bg-zinc-800 rounded-full" />
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
              <TrendingDown className="w-3 h-3" /> Anti-Procrastination
            </div>
          </div>
        </section>

        {/* ——— 5. THE COST OF FAILURE ——— */}
        <section className="mb-40">
  <div className="bg-zinc-900/30 border border-zinc-800 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
    {/* Декоративный элемент USDC */}
    <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
    
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Assets & Logic</h2>
        <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold">Base Mainnet Protocol</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Левая колонка: Поддержка USDC */}
        <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black italic">S</div>
            <span className="text-white font-black uppercase italic tracking-tight">USDC Native</span>
          </div>
          <p className="text-zinc-500 text-[11px] leading-relaxed">
            We support <b>USDC on Base</b> for stable commitments. Your stake remains pegged to the dollar, unaffected by market volatility. No surprises when you recover your funds.
          </p>
        </div>

        {/* Правая колонка: Комиссии */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-zinc-950/30 border border-zinc-900 rounded-xl">
            <span className="text-zinc-500 font-bold uppercase text-[10px]">Success Fee</span>
            <span className="text-green-500 font-black tracking-tighter">0%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-zinc-950/30 border border-zinc-900 rounded-xl">
            <span className="text-zinc-500 font-bold uppercase text-[10px]">Failure (Slash)</span>
            <span className="text-red-500 font-black tracking-tighter">100%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-zinc-950/30 border border-zinc-900 rounded-xl">
            <div className="flex flex-col">
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Withdrawal Fee</span>
              <span className="text-[8px] text-zinc-600 uppercase">Operational Cost</span>
            </div>
            <span className="text-white font-black tracking-tighter">5%</span>
          </div>
        </div>
      </div>

      <div className="text-center pt-6">
        <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.2em] leading-relaxed max-w-sm mx-auto">
          Commit in ETH or USDC. Success costs nothing. <br/>
          Withdrawal fees sustain the verification engine.
        </p>
      </div>
    </div>
  </div>
</section>

        {/* ——— 6. FAQ ——— */}
        <section className="mb-40 max-w-2xl mx-auto">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter mb-12 italic">F.A.Q.</h2>
          <div className="space-y-3">
            {faq.map((item, i) => (
              <div key={i} className="bg-zinc-900/20 border border-zinc-900 rounded-2xl">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center"
                >
                  <span className="font-bold text-sm uppercase tracking-tight pr-4">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-zinc-500 text-sm leading-relaxed pt-2 border-t border-zinc-900/50">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ——— FOOTER ——— */}
        <footer className="border-t border-zinc-900 pt-20 pb-10">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-end">
    <div className="space-y-8">
      <h4 className="text-white font-black uppercase italic text-sm tracking-widest">Protocol Support</h4>
      <div className="space-y-4 text-sm text-zinc-500 font-bold uppercase tracking-tighter">
        <a href="https://t.me/word_price_help" className="flex items-center gap-3 hover:text-white transition-colors">
          <Send className="w-4 h-4" /> Telegram Support
        </a>
        <a href="mailto:word.price.help@gmail.com" className="flex items-center gap-3 hover:text-white transition-colors">
          <Mail className="w-4 h-4" /> word.price.help@gmail.com
        </a>
      </div>
    </div>
    <div className="flex flex-col md:items-end md:text-right gap-3 text-[10px] uppercase font-black tracking-[0.2em] text-zinc-600">
        <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
        <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
        <a href="/refund" className="hover:text-white transition-colors">Asset Recovery</a>
        <div className="mt-6 flex items-center justify-start md:justify-end gap-2 text-zinc-800">
          <ShieldCheck className="w-3 h-3" /> Verified Smart Contract
        </div>
    </div>
  </div>
  
  <div className="text-[9px] text-zinc-700 uppercase tracking-[0.4em] text-center border-t border-zinc-900 pt-10 space-y-6">
    <p className="text-zinc-500 italic">"The user assumes all risks associated with smart contract interactions and digital asset volatility."</p>
    <p>© 2026 WORD PRICE. DECENTRALIZED ACCOUNTABILITY ON BASE.</p>
    
    <div className="flex justify-center items-center gap-8 opacity-20 hover:opacity-100 transition-opacity duration-700 grayscale">
        <span className="font-black text-[10px]">BASE L2</span>
        <span className="font-black text-[10px]">NON-CUSTODIAL</span>
        <span className="font-black text-[10px]">SMART ESCROW</span>
    </div>
  </div>
</footer>
      </main>
    </div>
  );
}