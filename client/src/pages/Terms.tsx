import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function Terms() {
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
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24">
      <button onClick={handleBack} className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group text-sm font-bold uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to App
      </button>

      <h1 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter text-white">Terms of Service</h1>
      
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 text-zinc-300 rounded-[2rem]">
      <section className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
  <p className="text-red-200 font-semibold text-xs uppercase tracking-wider">Risk Disclosure</p>
  <p className="text-red-100/80 text-[11px] mt-1">
    The user assumes all risks associated with smart contract interactions and digital asset volatility. 
    Blockchain transactions are irreversible.
  </p>
</section>
        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. General Provisions</h2>
          <p>
            This document constitutes a public agreement for the "Word Price" protocol. 
            By connecting a digital wallet and locking assets, the User provides 
            <b> full and unconditional acceptance</b> of these terms.
          </p>
        </section>
        
        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Subject of Agreement</h2>
          <p>
            2.1. The Service provides a decentralized platform for automated monitoring and verification of User-defined goals.
            <br />
            2.2. Any amount locked by the User is a <b>commitment stake</b> held via smart contract. It is not an investment, deposit, or regulated financial product.
            <br />
            2.3. The release or forfeiture of the stake is governed strictly by the smart contract logic based on task completion evidence.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Financial & Network Conditions</h2>
          <p>
            3.1. All transactions are processed on the <b>Base Network (Layer 2)</b>. Users are responsible for all network (Gas) fees.
            <br />
            3.2. <b>Asset Release:</b> Upon successful verification of the task, the locked amount is released back to the User's wallet.
            <br />
            3.3. <b>Slashing:</b> If the task is not completed or verified by the deadline, the assets are "slashed" (forfeited) as per the protocol rules.
            <br />
            3.4. <b>Service Fee:</b> A protocol fee of <b>5%</b> may be applied to non-task-related withdrawals or specified reward distributions to cover operational costs.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Verification Criteria</h2>
          <p>
            4.1. Tasks are deemed completed only upon submission of verifiable evidence (photos/videos). The Protocol reserves the right to audit metadata (geolocation, timestamps).
            <br />
            4.2. In case of rejection, the User has 24 hours to provide additional proof or submit an appeal via the integrated support channel.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">5. Risks & Force Majeure</h2>
          <p>
            5.1. The User assumes all risks related to smart contract vulnerabilities, wallet security, and Base network outages.
            <br />
            5.2. Blockchain transactions are irreversible. The Service is not responsible for lost funds due to incorrect wallet usage or private key loss.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 mt-8">
          <h2 className="font-semibold text-base text-white mb-3">Protocol Details</h2>
          <div className="bg-black/20 p-4 rounded-xl space-y-1 font-mono text-[11px]">
            <p>Network: Base Mainnet (L2)</p>
            <p>Verification Model: Decentralized Oracle / Manual Audit Hybrid</p>
            <p>Contact: cena.slova.help@gmail.com</p>
            <p className="mt-4 text-zinc-500 italic">
              Version: 2.1 (Base Chain). Updated: March 2026.
            </p>
          </div>
        </section>
      </Card>
    </div>
  );
}