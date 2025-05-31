'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { JsonFragment } from 'ethers';
import ETFVaultJSON from '@/lib/abis/FlowETFVault.json';
import WrappedFlowJSON from '@/lib/abis/WrappedFlow.json';
import type { ChangeEvent } from 'react';

const addresses = {
  etfVault: "0xb41Eebc041d8eFDB38dB7e5a6f1b1CC295702C2b",
  assetFactory: "0x00908d528c53ca7d802ddc91e3b38b9a6095c680",
  eip7702Implementation: "0x2e3746fAfba8e075612aD00e06B55ef21C055F79"
};

const assets = {
  WFLOW:    "0x9a7623494c986b443a26f79bf3e715bb1763f610",
  USDC:     "0x4608acb5aef179f2d89d2643368e6cd16a0761c0",
  WETH:     "0xf5935f7557f82ea203228947bb574a64393a72ed",
  ankrFLOW: "0xda54ac65cf7d1d51bfefc2f7c1c881b86010b168",
  TRUMP:    "0xb664eab8e811b3a4af872d01b75ccbdc4d28fd2d"
};

// Ensure correct ABI array
const vaultAbi: JsonFragment[] = Array.isArray(ETFVaultJSON)
  ? (ETFVaultJSON as unknown as JsonFragment[])
  : (ETFVaultJSON as { abi: JsonFragment[] }).abi;
const tokenAbi: JsonFragment[] = Array.isArray(WrappedFlowJSON)
  ? (WrappedFlowJSON as unknown as JsonFragment[])
  : (WrappedFlowJSON as { abi: JsonFragment[] }).abi;

export default function AbiTestPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState("");
  const [etfInfo, setEtfInfo] = useState({ name: "", symbol: "", agent: "", totalValue: "" });
  const [activeAssets, setActiveAssets] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<keyof typeof assets>("WFLOW");
  const [tokenBalance, setTokenBalance] = useState("");
  const [depositToken, setDepositToken] = useState<keyof typeof assets>("WFLOW");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawToken, setWithdrawToken] = useState<keyof typeof assets>("WFLOW");
  const [withdrawShares, setWithdrawShares] = useState("");
  const [withdrawMin, setWithdrawMin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize provider to Flow EVM Testnet RPC
    const rpcProvider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
    setProvider((window.ethereum)
      ? new ethers.BrowserProvider(window.ethereum)
      : rpcProvider as unknown as ethers.BrowserProvider
    );
  }, []);

  const connect = async () => {
    if (!provider) return;
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    setSigner(signer);
    const address = await signer.getAddress();
    setUserAddress(address);
  };

  const fetchEtfInfo = async () => {
    if (!provider) return;
    const contract = new ethers.Contract(addresses.etfVault, vaultAbi, provider);
    const [name, symbol, agent, total] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.agentWallet(),
      contract.getTotalValue()
    ]);
    setEtfInfo({ name, symbol, agent, totalValue: ethers.formatEther(total) });
  };

  const fetchActiveAssets = async () => {
    if (!provider) return;
    const contract = new ethers.Contract(addresses.etfVault, vaultAbi, provider);
    const list = await contract.getActiveAssets();
    setActiveAssets(list);
  };

  const fetchTokenBalance = async () => {
    if (!provider || !userAddress) return;
    const tokenAddress = assets[selectedToken];
    const contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
    const bal = await contract.balanceOf(userAddress);
    setTokenBalance(ethers.formatEther(bal));
  };

  const faucetToken = async () => {
    if (!signer) return;
    setLoading(true);
    const tokenAddress = assets[selectedToken];
    const contract = new ethers.Contract(tokenAddress, tokenAbi, signer);
    await (await contract.faucet()).wait();
    await fetchTokenBalance();
    setLoading(false);
  };

  const handleDeposit = async () => {
    if (!signer) return;
    setLoading(true);
    const tokenAddress = assets[depositToken];
    const amt = ethers.parseEther(depositAmount);
    const tokenC = new ethers.Contract(tokenAddress, tokenAbi, signer);
    await (await tokenC.approve(addresses.etfVault, amt)).wait();
    const vaultC = new ethers.Contract(addresses.etfVault, vaultAbi, signer);
    await (await vaultC.deposit(tokenAddress, amt)).wait();
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!signer) return;
    setLoading(true);
    const shares = ethers.parseEther(withdrawShares);
    const minOut = ethers.parseEther(withdrawMin);
    const vaultC = new ethers.Contract(addresses.etfVault, vaultAbi, signer);
    await (await vaultC.withdraw(shares, assets[withdrawToken], minOut)).wait();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Button onClick={connect} disabled={!!userAddress}>{userAddress ? 'Connected' : 'Connect Wallet'}</Button>

      <Card>
        <CardHeader><CardTitle>ETF Vault Info</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={fetchEtfInfo}>Fetch ETF Info</Button>
          <div>Name: {etfInfo.name}</div>
          <div>Symbol: {etfInfo.symbol}</div>
          <div>Agent: {etfInfo.agent}</div>
          <div>Total Value: {etfInfo.totalValue} ETH</div>
          <Button onClick={fetchActiveAssets}>Fetch Active Assets</Button>
          <ul className="list-disc list-inside">
            {activeAssets.map(addr => <li key={addr}>{addr}</li>)}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Token Faucet & Balance</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <label htmlFor="selectedToken">Token:</label>
          <select id="selectedToken" value={selectedToken} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedToken(e.target.value as keyof typeof assets)}>
            {Object.keys(assets).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <Button onClick={faucetToken} disabled={loading}>Faucet</Button>
          <Button onClick={fetchTokenBalance}>Get Balance</Button>
          <div>Balance: {tokenBalance}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Deposit to ETF</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <label htmlFor="depositToken">Token:</label>
          <select id="depositToken" value={depositToken} onChange={(e: ChangeEvent<HTMLSelectElement>) => setDepositToken(e.target.value as keyof typeof assets)}>
            {Object.keys(assets).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <label htmlFor="depositAmount">Amount:</label>
          <input id="depositAmount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
          <Button onClick={handleDeposit} disabled={loading}>Deposit</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Withdraw from ETF</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <label htmlFor="withdrawToken">Token Out:</label>
          <select id="withdrawToken" value={withdrawToken} onChange={(e: ChangeEvent<HTMLSelectElement>) => setWithdrawToken(e.target.value as keyof typeof assets)}>
            {Object.keys(assets).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <label htmlFor="withdrawShares">Shares:</label>
          <input id="withdrawShares" value={withdrawShares} onChange={e => setWithdrawShares(e.target.value)} />
          <label htmlFor="withdrawMin">Min Amount Out:</label>
          <input id="withdrawMin" value={withdrawMin} onChange={e => setWithdrawMin(e.target.value)} />
          <Button onClick={handleWithdraw} disabled={loading}>Withdraw</Button>
        </CardContent>
      </Card>
    </div>
  );
} 