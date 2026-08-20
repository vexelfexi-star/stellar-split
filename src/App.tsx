import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import WalletLine from "./components/WalletLine";
import BillItems, { type Participant } from "./components/BillItems";
import SplitSummary, { computeShares } from "./components/SplitSummary";
import PaySection from "./components/PaySection";
import TransactionStamp, { type TxOutcome } from "./components/TransactionStamp";

const initialParticipants: Participant[] = [
  { id: "p1", name: "", shares: 1 },
  { id: "p2", name: "", shares: 1 },
];

export default function App() {
  const wallet = useWallet();

  const [billTotal, setBillTotal] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [payerId, setPayerId] = useState("p1");
  const [outcome, setOutcome] = useState<TxOutcome | null>(null);

  const rows = computeShares(billTotal, participants);
  const payerRow = rows.find((r) => r.id === payerId);
  const payerShare = payerRow?.amount ?? 0;
  const readyToSplit = parseFloat(billTotal || "0") > 0 && rows.length > 0;

  return (
    <div className="tape-wrap">
      <div className="constellation-header">
        <span className="dot" />
        Stellar Testnet
        <span className="dot" />
      </div>

      <div className="receipt">
        <div className="receipt-inner">
          <h1 className="mark">
            <strong>Split</strong> the tab
          </h1>
          <p className="sub">Settle up in XLM · No spreadsheets, no IOUs</p>

          <WalletLine
            address={wallet.address}
            status={wallet.status}
            account={wallet.account}
            balanceLoading={wallet.balanceLoading}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
            onFund={wallet.fundAccount}
          />

          {wallet.error && <p className="error-text">{wallet.error}</p>}

          <hr className="perf" />

          <BillItems
            billTotal={billTotal}
            onBillTotalChange={setBillTotal}
            recipientAddress={recipientAddress}
            onRecipientChange={setRecipientAddress}
            participants={participants}
            onParticipantsChange={setParticipants}
            payerId={payerId}
            onPayerChange={setPayerId}
          />

          {readyToSplit && (
            <>
              <hr className="perf" />
              <SplitSummary
                billTotal={billTotal}
                participants={participants}
                payerId={payerId}
              />
            </>
          )}

          {readyToSplit && (
            <>
              <hr className="perf" />
              <PaySection
                address={wallet.address}
                recipientAddress={recipientAddress}
                amount={payerShare}
                balanceXlm={wallet.account?.balanceXlm ?? null}
                payerName={rows.find((r) => r.id === payerId)?.name ?? ""}
                onResult={setOutcome}
                onSettled={wallet.refreshBalance}
              />
            </>
          )}

          {outcome && (
            <>
              <hr className="perf" />
              <div role="status" aria-live="polite">
                <TransactionStamp outcome={outcome} />
              </div>
            </>
          )}
        </div>
      </div>

      <p className="footer-note">
        Built for the Stellar Journey to Mastery · White Belt submission
      </p>
    </div>
  );
}
