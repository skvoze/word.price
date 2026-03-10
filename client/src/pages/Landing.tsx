import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronDown, ArrowRight, ShieldCheck, Mail, User, Send, Wallet, Globe } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useUser } from "@/hooks/use-user";
import { useEffect } from "react";

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { isConnected } = useAccount();
  const { data: user } = useUser();

  // Автоматический редирект после подключения
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
      q: "What counts as proof of completion?", 
      a: "Photo or video evidence clearly showing the result of your work (e.g., a project screenshot, a gym photo, or a completed report)." 
    },
    { 
      q: "How does the refund work?", 
      a: "Once the moderator approves the report (within 24 hours), the staked amount is released back to your balance. You can withdraw it to your wallet or use it for a new goal." 
    },
    { 
      q: "How can I dispute a decision?", 
      a: "If you disagree with a moderator's decision, you can file an appeal via our support channel @price_of_word_help within 24 hours of report rejection." 
    },
    { 
      q: "Are the transactions secure?", 
      a: "All operations are performed on the Base network (Layer 2). We do not have access to your private keys; all logic is governed by the protocol." 
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-white selection:text-black">
      <main className="max-w-4xl mx-auto px-4 py-20">
        
        {/* ——— 1. HEADER ——— */}
        <section className="text-center mb-24">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 leading-none">
            Price of <br /> Word
          </h1>
          <p className="text-xl font-bold text-zinc-500 uppercase tracking-tight">
            Discipline tool through financial accountability
          </p>
        </section>

        {/* ——— 2. PAIN POINTS ——— */}
        <section className="mb-32 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
              <h3 className="text-zinc-500 uppercase font-black text-xs mb-4 tracking-widest">The Problem</h3>
              <p className="text-zinc-400 text-lg leading-tight">
                Promises to yourself are often worthless because there are no consequences for breaking them.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl flex flex-col justify-center relative overflow-hidden">
              <h3 className="text-zinc-400 uppercase font-black text-xs mb-4 tracking-widest text-center md:text-left">The Solution</h3>
              <div className="space-y-4">
                <p className="text-zinc-900 font-extrabold text-xl leading-none text-center md:text-left uppercase italic tracking-tighter">
                  Achieve result — free <br/>
                  <span className="text-zinc-400">Fail — pay the stake*</span>
                </p>
                <p className="text-[9px] text-zinc-400 leading-tight uppercase tracking-tighter text-center md:text-left">
                  * “Price of Word” refers to the retention of funds as payment for 
                  monitoring and verification services according to the terms of use.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ——— 3. MECHANICS ——— */}
        <section className="mb-32 space-y-16">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter">How it works</h2>
          <div className="grid grid-cols-1 gap-12">
            {[
              { n: "01", t: "Set a Goal", d: "Create a task, set a deadline, and deposit your commitment amount." },
              { n: "02", t: "Execution", d: "Complete what you promised and upload proof (photo/video) to the app interface." },
              { n: "03", t: "Verification", d: "A moderator reviews the report within 24 hours. If no report is provided, the stake is forfeited." },
              { n: "04", t: "Result", d: "Upon approval, the amount is returned to your balance. Goal achieved." }
            ].map((step, i) => (
              <div key={i} className="flex gap-6 items-start border-l border-zinc-800 pl-8 relative group">
                <div className="absolute -left-3 top-0 w-6 h-6 bg-zinc-950 border-2 border-zinc-800 group-hover:border-white transition-colors rounded-full flex items-center justify-center text-[10px] font-bold">{step.n}</div>
                <div>
                  <h4 className="font-bold uppercase text-white mb-2">{step.t}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ——— 4. CTA (Wallet Connect) ——— */}
        <section className="flex flex-col items-center mb-40">
          <div className="scale-125 origin-center">
            <ConnectButton label="Get Started" />
          </div>
          <p className="mt-6 text-zinc-600 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
            <Globe className="w-3 h-3" /> Secured on Base Mainnet
          </p>
        </section>

        {/* ——— 5. FEES ——— */}
        <section className="mb-32">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter mb-12">Service Fees</h2>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4 text-white">
                  <Wallet className="w-6 h-6" />
                  <span className="text-2xl font-black uppercase italic">Custom Stake</span>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  You define the amount of financial commitment for each task.
                </p>
                <ul className="space-y-3 text-sm font-bold uppercase tracking-tight">
                  <li className="flex justify-between border-b border-zinc-800 pb-2 text-zinc-300">
                    <span>Minimum Stake</span>
                    <span>~1.00 USD</span>
                  </li>
                  <li className="flex justify-between border-b border-zinc-800 pb-2 text-zinc-300">
                    <span>Protocol Fee</span>
                    <span>0% (on success)</span>
                  </li>
                  <li className="flex justify-between text-white pt-2">
                    <span>Verification</span>
                    <span>Free*</span>
                  </li>
                </ul>
                <p className="mt-4 text-[10px] text-zinc-600 italic">
                  *Monitoring services are only paid if obligations are not met within the set deadline.
                </p>
              </div>
              <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700">
                <h4 className="font-bold text-white mb-2 uppercase text-xs tracking-widest">Refund Process:</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Upon successful completion, the stake remains on your internal balance. You can withdraw it or reuse it. Onchain withdrawals are processed according to network congestion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ——— 6. FAQ ——— */}
        <section className="mb-40 max-w-2xl mx-auto">
          <h2 className="text-center text-3xl font-black uppercase italic tracking-tighter mb-12">F.A.Q.</h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-zinc-900/50 transition-colors"
                >
                  <span className="font-bold text-sm uppercase tracking-tight pr-4">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-zinc-900 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ——— FOOTER ——— */}
        <footer className="border-t border-zinc-900 pt-20 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 items-end">
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase italic text-sm tracking-widest">Support</h4>
              <div className="space-y-4 text-sm text-zinc-400 font-medium">
                <div className="flex items-center gap-3">
                  <Send className="w-4 h-4 text-zinc-600" /> 
                  <a href="https://t.me/price_of_word_help" className="hover:text-white transition-colors">Telegram: @price_of_word_help</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-zinc-600" />
                  <a href="mailto:support@priceofword.com" className="hover:text-white transition-colors">support@priceofword.com</a>
                </div>
                <div className="pt-4 border-t border-zinc-900/50">
                  <div className="text-[10px] text-zinc-500 mb-1 tracking-wider uppercase font-bold flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Decentralized Identity Verified
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:items-end gap-3 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 justify-end">
               <a href="/terms" className="hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Terms of Service</a>
               <a href="/privacy" className="hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Privacy Policy</a>
               <a href="/refund" className="hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">Refund Policy</a>
               <p className="mt-4 text-zinc-700 text-right max-w-[220px]">Support response time: up to 24 hours.</p>
            </div>
          </div>
          
          <div className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] text-center border-t border-zinc-900 pt-10 space-y-4">
            <p className="text-zinc-400">© 2026 PRICE OF WORD. All rights reserved.</p>
            <p className="italic text-zinc-600 lowercase">This service is not a game of chance, betting, or a financial pyramid.</p>
            <div className="flex justify-center items-center gap-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 scale-90">
                <span className="font-black text-white text-xs tracking-tighter">BASE</span>
                <span className="font-black text-white text-xs tracking-tighter">ETHEREUM L2</span>
                <span className="font-black text-white text-xs tracking-tighter">USDC SUPPORT</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}