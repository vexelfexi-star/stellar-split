import type { Participant } from "./BillItems";

type Props = {
  billTotal: string;
  participants: Participant[];
  payerId: string;
};

export function computeShares(billTotal: string, participants: Participant[]) {
  const total = parseFloat(billTotal || "0");
  const totalShares = participants.reduce((sum, p) => sum + p.shares, 0) || 1;
  return participants.map((p) => ({
    ...p,
    amount: Number.isFinite(total) ? (total * p.shares) / totalShares : 0,
  }));
}

export default function SplitSummary({ billTotal, participants, payerId }: Props) {
  const rows = computeShares(billTotal, participants);
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="print-in">
      <p className="eyebrow">Itemized split</p>
      {rows.map((r) => (
        <div className={`line ${r.id === payerId ? "" : "muted"}`} key={r.id}>
          <span className="label">
            {r.name || "Unnamed"}
            {r.shares > 1 ? ` ×${r.shares}` : ""}
            {r.id === payerId ? " (you)" : ""}
          </span>
          <span className="leader" />
          <span className="value">{r.amount.toFixed(4)} XLM</span>
        </div>
      ))}
      <hr className="perf" style={{ margin: "12px 0" }} />
      <div className="line total">
        <span className="label">Total</span>
        <span className="leader" />
        <span className="value">{total.toFixed(4)} XLM</span>
      </div>
    </div>
  );
}
