import { useCallback, useEffect, useState } from "react";
import {
  connectWallet,
  disconnectWallet,
  fetchBalance,
  readExistingSession,
  fundWithFriendbot,
  type AccountSnapshot,
} from "../lib/stellar";

export type WalletStatus = "idle" | "connecting" | "connected" | "error";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const refreshBalance = useCallback(async (addr: string) => {
    setBalanceLoading(true);
    try {
      const snapshot = await fetchBalance(addr);
      setAccount(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load balance.");
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  // Silently pick up an already-authorized session on load (no popup).
  useEffect(() => {
    readExistingSession().then((session) => {
      if (session?.address) {
        setAddress(session.address);
        setStatus("connected");
        refreshBalance(session.address);
      }
    });
  }, [refreshBalance]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const wallet = await connectWallet();
      setAddress(wallet.address);
      setStatus("connected");
      if (wallet.address) await refreshBalance(wallet.address);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't connect Freighter.");
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setAddress(null);
    setAccount(null);
    setStatus("idle");
    setError(null);
  }, []);

  const fundAccount = useCallback(async () => {
    if (!address) return;
    setBalanceLoading(true);
    try {
      await fundWithFriendbot(address);
      await refreshBalance(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Friendbot funding failed.");
    } finally {
      setBalanceLoading(false);
    }
  }, [address, refreshBalance]);

  return {
    address,
    status,
    error,
    account,
    balanceLoading,
    connect,
    disconnect,
    refreshBalance: () => address && refreshBalance(address),
    fundAccount,
    setError,
  };
}
