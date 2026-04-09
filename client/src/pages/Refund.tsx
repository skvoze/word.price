import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function Refund() {
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

      <h1 className="text-2xl font-bold mb-6 italic uppercase tracking-tighter text-white">Asset Recovery & Refund</h1>
      
      <Card className="p-6 space-y-6 text-sm leading-relaxed border-white/5 bg-zinc-900/50 text-zinc-300 rounded-[2rem]">
        <section>
          <h2 className="font-semibold text-base text-white mb-2">1. Irreversibility of Blockchain</h2>
          <p>
            All transactions on the <b>Base Network</b> are final. If funds are forfeited due to a penalty triggered by the smart contract due to a failure to meet task requirements, they cannot be manually reversed.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">2. Conditions for Recovery</h2>
          <p>
            Asset release (refund of the amount) occurs automatically when:
            <br />
            • The task is verified as "Completed" before the deadline.
            <br />
            • A verified technical failure of the Protocol prevented evidence submission (requires proof).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">3. Appeals Process</h2>
          <p>
            If you believe your amount was debited incorrectly due to a verification error, you must contact <b>cena.slova.help@gmail.com</b> within 24 hours of the penalty event. 
            Provide your wallet address and Task Title.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-white mb-2">4. Fees</h2>
          <p>
            4.1. Network (Gas) fees incurred during locking or recovery are non-refundable.
            <br />
            4.2. Protocol processing fees (up to 5%) may be deducted from non-task-related recoveries.
          </p>
        </section>

        <section className="pt-6 border-t border-white/10 text-[11px] text-zinc-500 italic">
          Protocol: Word Price. Powered by Base Mainnet.
        </section>
      </Card>
    </div>
  );
}