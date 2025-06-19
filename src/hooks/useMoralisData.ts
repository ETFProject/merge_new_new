import { useState, useEffect } from 'react';
import Moralis from 'moralis';
import { Erc20Value } from '@moralisweb3/common-evm-utils';

interface WalletData {
  address: string;
  nativeBalance: string;
  tokens: Erc20Value[];
  chainId: string;
}

export const useMoralisData = (address?: string, chainId?: string) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async (walletAddress: string, chain: string) => {
    if (!walletAddress || !chain) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get native balance
      const balanceResponse = await Moralis.EvmApi.balance.getNativeBalance({
        address: walletAddress,
        chain: chain,
      });

      // Get ERC20 token balances
      const tokensResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
        address: walletAddress,
        chain: chain,
      });

      setWalletData({
        address: walletAddress,
        nativeBalance: balanceResponse.result.balance.ether,
        tokens: tokensResponse.result,
        chainId: chain,
      });
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to fetch wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNFTs = async (walletAddress: string, chain: string) => {
    if (!walletAddress || !chain) return [];

    try {
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        address: walletAddress,
        chain: chain,
        limit: 20,
      });

      return response.result;
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      return [];
    }
  };

  const fetchTokenPrice = async (tokenAddress: string, chain: string) => {
    try {
      const response = await Moralis.EvmApi.token.getTokenPrice({
        address: tokenAddress,
        chain: chain,
      });

      return response.result;
    } catch (err) {
      console.error('Error fetching token price:', err);
      return null;
    }
  };

  useEffect(() => {
    if (address && chainId) {
      fetchWalletData(address, chainId);
    }
  }, [address, chainId]);

  return {
    walletData,
    isLoading,
    error,
    fetchWalletData,
    fetchNFTs,
    fetchTokenPrice,
  };
}; 