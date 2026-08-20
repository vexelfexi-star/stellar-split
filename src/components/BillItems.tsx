import { isValidStellarAddress } from "../lib/stellar";

export type Participant = {
  id: string;
  name: string;
  shares: number;
};

type Props = {
  billTotal: string;
  onBillTotalChange: (value: string) => void;
  recipientAddress: string;
  onRecipientChange: (value: string) => void;
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  payerId: string;
  onPayerChange: (id: string) => void;
};

let nextId = 3;

export default function BillItems({
  billTotal,
  onBillTotalChange,
  recipientAddress,
  onRecipientChange,
  participants,
  onParticipantsChange,
  payerId,
  onPayerChange,
}: Props) {
  const updateParticipant = (id: string, patch: Partial<Participant>) => {
    onParticipantsChange(
      participants.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const removeParticipant = (id: string) => {
    if (participants.length <= 2) return;
    onParticipantsChange(participants.filter((p) => p.id !== id));
    if (payerId === id) onPayerChange(participants.find((p) => p.id !== id)?.id ?? "");
  };

  const addParticipant = () => {
    const id = `p${nextId++}`;
    onParticipantsChange([...participants, { id, name: "", shares: 1 }]);
  };

  const recipientValid =
    recipientAddress.length === 0 || isValidStellarAddress(recipientAddress);

  return (
    <div className="print-in">
      <p className="eyebrow">Open a tab</p>

      <div className="field">
        <label htmlFor="bill-total">Total bill (XLM)</label>
        <input
          id="bill-total"
          inputMode="decimal"
          placeholder="0.00"
          value={billTotal}
          onChange={(e) => onBillTotalChange(e.target.value.replace(/[^0-9.]/g, ""))}
        />
      </div>

      <div className="field">
        <label htmlFor="recipient">Who fronted it? (their Stellar address)</label>
        <input
          id="recipient"
          placeholder="G..."
          value={recipientAddress}
          onChange={(e) => onRecipientChange(e.target.value.trim())}
          style={!recipientValid ? { borderColor: "var(--stamp-red)" } : undefined}
        />
        {!recipientValid && (
          <p className="hint" style={{ color: "var(--stamp-red)" }}>
            That doesn't look like a valid Stellar address (starts with G, 56 characters).
          </p>
        )}
        {recipientValid && recipientAddress.length > 0 && (
          <p className="hint">
            Must be a funded testnet account. A brand-new address with no XLM will
            reject the payment.
          </p>
        )}
      </div>

      <p className="eyebrow" style={{ marginTop: 18 }}>
        Who's splitting it
      </p>

      <div className="participants">
        {participants.map((p) => (
          <div className="participant-row" key={p.id}>
            <input
              placeholder="Name"
              value={p.name}
              onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
            />
            <input
              inputMode="numeric"
              title="Shares — use more than 1 if they had extra items"
              value={p.shares}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                updateParticipant(p.id, { shares: Number.isFinite(n) && n > 0 ? n : 1 });
              }}
            />
            <button
              className="icon-btn"
              onClick={() => removeParticipant(p.id)}
              aria-label={`Remove ${p.name || "participant"}`}
              disabled={participants.length <= 2}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="add-row" onClick={addParticipant}>
        + Add person
      </button>

      <p className="hint">
        The second column is "shares" — bump it up if someone ordered extra. Everyone
        defaults to an even 1 share.
      </p>

      <p className="eyebrow" style={{ marginTop: 18 }}>
        Paying from this device
      </p>
      <div className="participants" style={{ marginBottom: 4 }}>
        {participants.map((p) => (
          <label
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="payer"
              checked={payerId === p.id}
              onChange={() => onPayerChange(p.id)}
              style={{ width: "auto" }}
            />
            {p.name || "Unnamed"}
          </label>
        ))}
      </div>
    </div>
  );
}
