import type { WalletStatus } from "../hooks/useWallet";
import type { AccountSnapshot } from "../lib/stellar";

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}···${address.slice(-4)}`;
}

type Props = {
  address: string | null;
  status: WalletStatus;
  account: AccountSnapshot | null;
  balanceLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onFund: () => void;
};

export default function WalletLine({
  address,
  status,
  account,
  balanceLoading,
  onConnect,
  onDisconnect,
  onFund,
}: Props) {
  return (
    <div className="print-in">
      <p className="eyebrow">Terminal</p>

      <div className="wallet-row" style={{ marginBottom: 10 }}>
        <div className="wallet-status">
          <span className={`pulse ${address ? "live" : ""}`} />
          {address ? (
            <span className="addr" title={address}>
              {shortenAddress(address)}
            </span>
          ) : (
            <span style={{ color: "var(--ink-faint)" }}>Not connected</span>
          )}
        </div>

        {address ? (
          <button className="btn btn-ghost" onClick={onDisconnect}>
            Disconnect
          </button>
        ) : (
          <button
            className="btn"
            onClick={onConnect}
            disabled={status === "connecting"}
          >
            {status === "connecting" ? "Connecting…" : "Connect Freighter"}
          </button>
        )}
      </div>

      {address && (
        <div className="line">
          <span className="label">Balance</span>
          <span className="leader" />
          <span className="value">
            {balanceLoading
              ? "reading…"
              : account?.exists
              ? `${Number(account.balanceXlm).toFixed(4)} XLM`
              : "unfunded"}
          </span>
        </div>
      )}

      {address && account && !account.exists && (
        <div style={{ marginTop: 10 }}>
          <p className="hint" style={{ marginBottom: 8 }}>
            This testnet account has no XLM yet. Fund it once, for free, via Friendbot.
          </p>
          <button className="btn" onClick={onFund} disabled={balanceLoading}>
            {balanceLoading ? "Funding…" : "Fund with Friendbot"}
          </button>
        </div>
      )}
    </div>
  );
}
