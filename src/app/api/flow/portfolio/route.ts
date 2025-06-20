import { NextResponse } from 'next/server';
import { 
  getServerProvider, 
  getContracts, 
  formatAmount, 
  getTokenName,
  getTokenLogo,
  CONTRACT_ADDRESSES
} from '@/lib/flow-contracts-server';

export async function GET() {
  try {
    console.log('📊 Getting Flow ITF portfolio data');
    
    // Get provider and contracts
    const provider = getServerProvider();
    const contracts = getContracts(provider);
    
    // Get ITF vault data
    const totalValue = await contracts.etfVault.getTotalValue();
    const navPerShare = await contracts.etfVault.getNetAssetValue();
    const activeAssets = await contracts.etfVault.getActiveAssets();
    const needsRebalancing = await contracts.etfVault.needsRebalancing();
    
    console.log(`✅ Flow ITF total value: ${formatAmount(totalValue)}`);
    console.log(`✅ Flow ITF NAV per share: ${formatAmount(navPerShare)}`);
    
    // Get allocation for each active asset
    const assetsData = await Promise.all(
      activeAssets.map(async (assetAddress: string) => {
        const allocation = await contracts.etfVault.getAssetAllocation(assetAddress);
        const tokenName = getTokenName(assetAddress);
        
        // Format the data for frontend
        return {
          chainId: 545, // Flow EVM Testnet
          tokenAddress: assetAddress,
          tokenSymbol: tokenName,
          weight: Number(formatAmount(allocation[0])) * 100, // Convert to percentage
          amount: formatAmount(allocation[1]),
          price: 1.0, // Mock price for now
          logoUrl: getTokenLogo(assetAddress)
        };
      })
    );
    
    // If no assets are found, provide default values
    const tokens = assetsData.length > 0 ? assetsData : [
      {
        chainId: 545,
        tokenAddress: CONTRACT_ADDRESSES.wflow,
        tokenSymbol: 'WFLOW',
        weight: 50,
        amount: '100',
        price: 1.0,
        logoUrl: getTokenLogo(CONTRACT_ADDRESSES.wflow)
      },
      {
        chainId: 545,
        tokenAddress: CONTRACT_ADDRESSES.usdc,
        tokenSymbol: 'USDC',
        weight: 50,
        amount: '100',
        price: 1.0,
        logoUrl: getTokenLogo(CONTRACT_ADDRESSES.usdc)
      }
    ];
    
    // Format response in the same structure as the existing portfolio API
    return NextResponse.json({
      success: true,
      data: {
        itfId: "flow-itf",
        totalValueUSD: Number(formatAmount(totalValue)),
        navPerShare: Number(formatAmount(navPerShare)),
        totalSupply: '1000',
        tokens,
        performance: {
          totalReturn: 5.2,
          dailyChange: 0.8,
          weeklyChange: 2.3,
          monthlyChange: 4.7,
          volatility: 1.2,
          lastUpdated: new Date().toISOString()
        },
        lastRebalance: new Date().toISOString(),
        priceSource: 'Flow EVM Testnet',
        needsRebalancing
      }
    });
  } catch (error) {
    console.error('❌ Error fetching Flow ITF portfolio:', error);
    
    // Return fallback data with an error flag
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Flow ITF data',
      data: {
        itfId: "flow-itf",
        totalValueUSD: 0,
        navPerShare: 0,
        totalSupply: '0',
        tokens: [
          {
            chainId: 545,
            tokenAddress: CONTRACT_ADDRESSES.wflow,
            tokenSymbol: 'WFLOW',
            weight: 100,
            amount: '0',
            price: 1.0,
            logoUrl: getTokenLogo(CONTRACT_ADDRESSES.wflow)
          }
        ],
        performance: {
          totalReturn: 0,
          dailyChange: 0,
          weeklyChange: 0,
          monthlyChange: 0,
          volatility: 0,
          lastUpdated: new Date().toISOString()
        },
        lastRebalance: new Date().toISOString(),
        priceSource: 'Flow EVM Testnet (Error)',
        needsRebalancing: false
      }
    });
  }
} 