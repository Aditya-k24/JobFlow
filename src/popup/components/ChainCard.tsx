import type { Chain } from "@/types/chain";
import { StatusBadge } from "./StatusBadge";
import { formatRelativeTime } from "@/shared/utils";

interface ChainCardProps {
  chain: Chain;
  onClick: (chainId: string) => void;
}

export function ChainCard({ chain, onClick }: ChainCardProps) {
  const initials = chain.canonical_company
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <button
      className="w-full rounded-lg bg-white px-3 py-2.5 text-left shadow-sm ring-1 ring-gray-100 hover:ring-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      onClick={() => onClick(chain.chain_id)}
      aria-label={`${chain.canonical_company} ${chain.role_title}, status: ${chain.status}`}
    >
      <div className="flex items-center gap-3">
        {/* Company avatar */}
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-bold text-white"
          aria-hidden="true"
        >
          {initials || "?"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {chain.canonical_company}
            </p>
            <StatusBadge status={chain.status} />
          </div>
          {chain.role_title && (
            <p className="truncate text-xs text-gray-500">{chain.role_title}</p>
          )}
          <p className="text-xs text-gray-400">
            {formatRelativeTime(chain.last_event_at)}
          </p>
        </div>
      </div>
    </button>
  );
}
