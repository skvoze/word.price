import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function Privacy() {
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      window.history.back(); 
    } else {
      window.location.href = "/";
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24 text-zinc-300">
      <button onClick={handleBack} className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group text-sm font-bold uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to App
      </button>

      <h1 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter text-white">Privacy Policy</h1>
      
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 rounded-[2rem]">
        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Blockchain Data Transparency</h2>
          <p>
            1.1. Due to the nature of the Base blockchain, your wallet address, transaction amounts, and task timestamps are <b>publicly recorded</b> and cannot be deleted.
            <br />
            1.2. By using the app, you consent to the public broadcast of these transactions.
          </p>
          <ul className="list-disc ml-5 space-y-1 mt-2 text-zinc-400">
            <li><b>Identifiers:</b> Public Wallet Address (0x...).</li>
            <li><b>Technical Data:</b> IP address (temporary for security), device type.</li>
            <li><b>Content:</b> Verification media (photos/videos) uploaded by the user.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Data Retention</h2>
          <p>
            2.1. <b>Media Storage:</b> Verification content is stored for a maximum of 30 days post-task completion for audit purposes, then purged from our servers.
            <br />
            2.2. <b>On-chain Data:</b> Transaction history remains permanent on the Base network.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Third-Party Services</h2>
          <p>
            3.1. We interact with the Base network and decentralized storage protocols. We do not require or store private keys, passwords, or personal names.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 mt-6">
          <div className="bg-black/20 p-4 rounded-xl space-y-1 font-mono text-[10px] text-zinc-400 uppercase tracking-tight">
            <p>Protocol Support: cena.slova.help@gmail.com</p>
            <p>Jurisdiction: Decentralized Application (Base L2)</p>
            <p className="mt-2 text-[9px] lowercase italic">Last Updated: 2026-03-27</p>
          </div>
        </section>
      </Card>
    </div>
  );
}