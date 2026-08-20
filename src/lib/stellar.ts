import {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import {
  Horizon,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  BASE_FEE,
} from "@stellar/stellar-sdk";

/**
 * All network access in this file targets the Stellar TESTNET only.
 * Never point HORIZON_URL at a pubnet/mainnet host in this project.
 */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

const server = new Horizon.Server(HORIZON_URL);

export type WalletState = {
  address: string | null;
  network: string | null;
};

export class StellarError extends Error {}

/** Ask Freighter for account access and return the selected public key. */
export async function connectWallet(): Promise<WalletState> {
  const connected = await isConnected();
  if (connected.error || !connected.isConnected) {
    throw new StellarError(
      "Freighter isn't installed. Add the extension from freighter.app and reload the page."
    );
  }

  const allowed = await isAllowed();
  if (allowed.error) throw new StellarError(allowed.error.message);
  if (!allowed.isAllowed) {
    const permission = await setAllowed();
    if (permission.error) throw new StellarError(permission.error.message);
  }

  const access = await requestAccess();
  if (access.error) throw new StellarError(access.error.message);

  const net = await getNetwork();
  if (net.error) throw new StellarError(net.error.message);

  if (net.network !== "TESTNET") {
    throw new StellarError(
      `Freighter is set to ${net.network}. Switch the extension's network to Testnet and reconnect.`
    );
  }

  return { address: access.address, network: net.network };
}

/** Re-read the currently authorized address without prompting the user. */
export async function readExistingSession(): Promise<WalletState | null> {
  const connected = await isConnected();
  if (connected.error || !connected.isConnected) return null;

  const allowed = await isAllowed();
  if (allowed.error || !allowed.isAllowed) return null;

  const addr = await getAddress();
  if (addr.error || !addr.address) return null;

  const net = await getNetwork();
  if (net.error) return null;

  return { address: addr.address, network: net.network };
}

/** Freighter has no "disconnect" call — this just clears our local session. */
export function disconnectWallet() {
  return { address: null, network: null } satisfies WalletState;
}

export type AccountSnapshot = {
  exists: boolean;
  balanceXlm: string;
};

/** Fetch the XLM balance for an address. Unfunded testnet accounts return exists:false. */
export async function fetchBalance(address: string): Promise<AccountSnapshot> {
  try {
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find(
      (b) => b.asset_type === "native"
    );
    return {
      exists: true,
      balanceXlm: nativeBalance ? nativeBalance.balance : "0",
    };
  } catch (err: unknown) {
    const notFound =
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 404;
    if (notFound) return { exists: false, balanceXlm: "0" };
    throw new StellarError("Couldn't reach the Stellar testnet to fetch the balance.");
  }
}

/** Fund a brand-new testnet account via Friendbot. */
export async function fundWithFriendbot(address: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!res.ok) {
    throw new StellarError("Friendbot couldn't fund this account. Try again in a moment.");
  }
}

export type PaymentResult = {
  hash: string;
  ledger?: number;
};

/**
 * Build, sign (via Freighter), and submit a native XLM payment on testnet.
 * Amount is a decimal string, e.g. "12.50".
 */
export async function sendPayment(
  sourceAddress: string,
  destinationAddress: string,
  amount: string,
  memo?: string
): Promise<PaymentResult> {
  const sourceAccount = await server.loadAccount(sourceAddress);

  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(60);

  if (memo) {
    builder.addMemo(Memo.text(memo));
  }

  const transaction = builder.build();
  const xdr = transaction.toXDR();

  const signed = await signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: sourceAddress,
  });
  if (signed.error) throw new StellarError(signed.error.message);

  const signedTx = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    NETWORK_PASSPHRASE
  );

  try {
    const submission = await server.submitTransaction(signedTx);
    return { hash: submission.hash, ledger: submission.ledger };
  } catch (err: unknown) {
    throw new StellarError(describeHorizonError(err, destinationAddress));
  }
}

/** Turn a raw Horizon submission error into a message the person can act on. */
type HorizonErrorShape = {
  response?: {
    data?: {
      extras?: {
        result_codes?: {
          transaction?: string;
          operations?: string[];
        };
      };
    };
  };
};

function describeHorizonError(err: unknown, destinationAddress: string): string {
  const data =
    typeof err === "object" && err !== null && "response" in err
      ? (err as HorizonErrorShape).response?.data
      : undefined;

  const txCode = data?.extras?.result_codes?.transaction;
  const opCodes = data?.extras?.result_codes?.operations ?? [];

  if (opCodes.includes("op_no_destination")) {
    return `The recipient address (${destinationAddress.slice(0, 4)}···${destinationAddress.slice(
      -4
    )}) doesn't exist on testnet yet. It needs to receive at least 1 XLM (e.g. via Friendbot) before it can be paid.`;
  }
  if (opCodes.includes("op_underfunded")) {
    return "Your account doesn't have enough XLM to cover this payment plus the minimum reserve.";
  }
  if (txCode === "tx_insufficient_balance") {
    return "Your account doesn't have enough XLM to cover this payment, the fee, and the minimum reserve.";
  }
  if (txCode === "tx_bad_seq") {
    return "This transaction expired or was already used. Try sending again.";
  }
  if (txCode) {
    return `The network rejected this transaction (${txCode}${
      opCodes.length ? `: ${opCodes.join(", ")}` : ""
    }). Check the address and balance, then try again.`;
  }

  return "The network rejected this transaction. Check the address and balance, then try again.";
}

export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address.trim());
}

export function explorerUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}
