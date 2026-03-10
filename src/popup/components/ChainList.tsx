import type { Chain } from "@/types/chain";
import { ChainCard } from "./ChainCard";

interface ChainListProps {
  chains: Chain[];
  onSelectChain: (chainId: string) => void;
}

export function ChainList({ chains, onSelectChain }: ChainListProps) {
  if (chains.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-400">No applications tracked yet.</p>
        <p className="mt-1 text-xs text-gray-400">
          Sync will run shortly after connecting.
        </p>
      </div>
    );
  }

  // Group active vs closed
  const active = chains.filter(
    (c) => !["REJECTED", "WITHDRAWN", "GHOSTED"].includes(c.status)
  );
  const closed = chains.filter((c) =>
    ["REJECTED", "WITHDRAWN", "GHOSTED"].includes(c.status)
  );

  return (
    <div className="px-3 pb-3">
      {active.length > 0 && (
        <section aria-label="Active applications">
          <div className="space-y-2">
            {active.map((chain) => (
              <ChainCard
                key={chain.chain_id}
                chain={chain}
                onClick={onSelectChain}
              />
            ))}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section aria-label="Closed applications" className="mt-3">
          <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            Closed ({closed.length})
          </h3>
          <div className="space-y-1.5 opacity-60">
            {closed.slice(0, 3).map((chain) => (
              <ChainCard
                key={chain.chain_id}
                chain={chain}
                onClick={onSelectChain}
              />
            ))}
            {closed.length > 3 && (
              <p className="px-1 text-center text-xs text-gray-400">
                +{closed.length - 3} more
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
