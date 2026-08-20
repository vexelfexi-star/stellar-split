import { QRCodeSVG } from "qrcode.react";
import { explorerUrl } from "../lib/stellar";

export type TxOutcome =
  | { kind: "success"; hash: string }
  | { kind: "failed"; message: string };

export default function TransactionStamp({ outcome }: { outcome: TxOutcome }) {
  if (outcome.kind === "failed") {
    return (
      <div className="stamp-area print-in">
        <div className="stamp failed">DECLINED</div>
        <p className="error-text" style={{ marginTop: 12, textAlign: "center" }}>
          {outcome.message}
        </p>
      </div>
    );
  }

  const url = explorerUrl(outcome.hash);

  return (
    <div className="stamp-area print-in">
      <div className="stamp">SETTLED</div>
      <p className="tx-hash">
        <a href={url} target="_blank" rel="noreferrer">
          {outcome.hash.slice(0, 10)}···{outcome.hash.slice(-10)}
        </a>
        <br />
        view on Stellar Expert
      </p>
      <div className="qr-wrap">
        <QRCodeSVG value={url} size={104} fgColor="#1b1a2e" />
      </div>
    </div>
  );
}
