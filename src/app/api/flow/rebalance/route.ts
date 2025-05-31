import { NextResponse } from 'next/server';
import { 
  getServerProvider, 
  getContracts, 
  getTokenName
} from '@/lib/flow-contracts';

export async function POST(request: Request) {
  try {
    const { userAddress } = await request.json();
    
    if (!userAddress) {
      return NextResponse.json({
        success: false,
        error: "Missing required parameter: userAddress"
      }, { status: 400 });
    }
    
    console.log(`🔄 Checking if ETF needs rebalancing for ${userAddress}`);
    
    // Get provider and contracts
    const provider = getServerProvider();
    const contracts = getContracts(provider);
    
    // Check if the ETF needs rebalancing
    const needsRebalancing = await contracts.etfVault.needsRebalancing();
    
    if (!needsRebalancing) {
      console.log('✅ ETF is already balanced');
      return NextResponse.json({
        success: true,
        data: {
          rebalanced: false,
          message: "ETF is already balanced"
        }
      });
    }
    
    console.log('🔄 ETF needs rebalancing, simulating rebalance operation');
    
    // In a real implementation, you would:
    // 1. Get the signer from a private key
    // 2. Call the rebalance function on the ETF vault
    
    // For demo purposes, we'll simulate the rebalancing
    
    // Get active assets
    const activeAssets = await contracts.etfVault.getActiveAssets();
    
    // Create a simulated new portfolio
    const newPortfolio = {
      tokens: await Promise.all(
        activeAssets.map(async (assetAddress: string) => {
          const allocation = await contracts.etfVault.getAssetAllocation(assetAddress);
          const tokenName = getTokenName(assetAddress);
          
          // Simulate rebalanced weights (for demo)
          const oldWeight = Number(allocation[0]) * 100;
          const newWeight = oldWeight + (Math.random() * 10 - 5); // Add/subtract up to 5%
          
          return {
            chainId: 545, // Flow EVM Testnet
            tokenAddress: assetAddress,
            tokenSymbol: tokenName,
            weight: Math.max(1, Math.min(99, newWeight)), // Keep between 1% and 99%
            oldWeight: oldWeight
          };
        })
      ),
      lastRebalance: new Date().toISOString()
    };
    
    console.log('✅ Simulated rebalance complete');
    
    return NextResponse.json({
      success: true,
      data: {
        rebalanced: true,
        txHash: `0x${Math.random().toString(16).slice(2)}`,
        newPortfolio,
        timestamp: new Date().toISOString()
      }
    });
    
    /* 
    // Uncomment this for actual implementation with ethers.js
    
    // Import when implementing
    import { getServerSigner } from '@/lib/flow-contracts';
    
    // Get signer and contracts
    const privateKey = process.env.FLOW_ETF_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('❌ No private key found in environment variables');
      return NextResponse.json({
        success: false,
        error: "Server configuration error: Missing private key"
      }, { status: 500 });
    }
    
    const signer = getServerSigner(privateKey);
    const contractsWithSigner = getContracts(signer);
    
    // Trigger rebalance
    const tx = await contractsWithSigner.etfVault.rebalance();
    const receipt = await tx.wait();
    
    // Get updated asset allocations
    const updatedAssets = await contracts.etfVault.getActiveAssets();
    const newPortfolio = {
      tokens: await Promise.all(
        updatedAssets.map(async (assetAddress: string) => {
          const allocation = await contracts.etfVault.getAssetAllocation(assetAddress);
          const tokenName = getTokenName(assetAddress);
          
          return {
            chainId: 545, // Flow EVM Testnet
            tokenAddress: assetAddress,
            tokenSymbol: tokenName,
            weight: Number(allocation[0]) * 100
          };
        })
      ),
      lastRebalance: new Date().toISOString()
    };
    
    console.log(`✅ Rebalance successful: ${receipt.hash}`);
    
    return NextResponse.json({
      success: true,
      data: {
        rebalanced: true,
        txHash: receipt.hash,
        newPortfolio,
        timestamp: new Date().toISOString()
      }
    });
    */
    
  } catch (error) {
    console.error('❌ Error rebalancing ETF:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to rebalance ETF"
    }, { status: 500 });
  }
} 