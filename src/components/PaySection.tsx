import { useState } from "react";
import { sendPayment, isValidStellarAddress, StellarError } from "../lib/stellar";
import type { TxOutcome } from "./TransactionStamp";

type Props = {
  address: string | null;
  recipientAddress: string;
  amount: number;
  balanceXlm: string | null;
  payerName: string;
  onResult: (outcome: TxOutcome) => void;
  onSettled: () => void;
};

export default function PaySection({
  address,
  recipientAddress,
  amount,
  balanceXlm,
  payerName,
  onResult,
  onSettled,
}: Props) {
  const [sending, setSending] = useState(false);

  const insufficientFunds =
    balanceXlm !== null && amount > 0 && parseFloat(balanceXlm) < amount + 0.5; // leave room for base reserve + fee

  const canPay =
    !!address &&
    isValidStellarAddress(recipientAddress) &&
    amount > 0 &&
    !sending &&
    !insufficientFunds;

  const handlePay = async () => {
    if (!address) return;
    setSending(true);
    try {
      const result = await sendPayment(
        address,
        recipientAddress,
        amount.toFixed(7),
        `split:${payerName || "guest"}`.slice(0, 28)
      );
      onResult({ kind: "success", hash: result.hash });
    } catch (err) {
      const message =
        err instanceof StellarError
          ? err.message
          : "The network rejected this transaction. Check the address and balance, then try again.";
      onResult({ kind: "failed", message });
    } finally {
      setSending(false);
      // A rejected transaction can still consume a fee once it's on-chain,
      // so always re-read the balance, not just on success.
      onSettled();
    }
  };

  return (
    <div className="print-in">
      <div className="line total" style={{ marginBottom: 4 }}>
        <span className="label">Your share</span>
        <span className="leader" />
        <span className="value">{amount.toFixed(4)} XLM</span>
      </div>

      {insufficientFunds && (
        <p className="hint" style={{ color: "var(--stamp-red)" }}>
          Not enough testnet XLM to cover this plus the network reserve. Try
          Friendbot above.
        </p>
      )}

      <button
        className="btn btn-primary"
        onClick={handlePay}
        disabled={!canPay}
        style={{ marginTop: 12 }}
      >
        {sending
          ? "Signing in Freighter…"
          : !address
          ? "Connect wallet to pay"
          : "Send my share"}
      </button>

      <p className="hint" style={{ textAlign: "center" }}>
        Freighter will ask you to review and sign before anything is sent.
      </p>
    </div>
  );
}
