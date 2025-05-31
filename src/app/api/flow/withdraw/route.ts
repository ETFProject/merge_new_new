import { NextResponse } from 'next/server';
import { 
  getTokenName,
  CONTRACT_ADDRESSES
} from '@/lib/flow-contracts';

export async function POST(request: Request) {
  try {
    const { shares, tokenOut, userAddress } = await request.json();
    
    if (!shares || !tokenOut || !userAddress) {
      return NextResponse.json({
        success: false,
        error: "Missing required parameters: shares, tokenOut, or userAddress"
      }, { status: 400 });
    }
    
    console.log(`📤 Processing withdrawal of ${shares} shares to ${tokenOut} for ${userAddress}`);
    
    // In a production app, you would need proper key management
    // This is just for demonstration purposes
    const privateKey = process.env.FLOW_ETF_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('❌ No private key found in environment variables');
      return NextResponse.json({
        success: false,
        error: "Server configuration error: Missing private key"
      }, { status: 500 });
    }
    
    // For demo purposes, we'll simulate the transaction
    // In a real implementation, you would:
    // 1. Get the signer from the private key
    // 2. Get contract instances
    // 3. Call the withdraw function
    
    // Determine token address from token name or symbol
    let tokenAddress = '';
    
    if (tokenOut.startsWith('0x')) {
      // If it's already an address, use it directly
      tokenAddress = tokenOut;
    } else {
      // Otherwise, look up the address by token name
      const tokenKey = Object.keys(CONTRACT_ADDRESSES).find(key => 
        key.toLowerCase() === tokenOut.toLowerCase() || 
        getTokenName(CONTRACT_ADDRESSES[key as keyof typeof CONTRACT_ADDRESSES]).toLowerCase() === tokenOut.toLowerCase()
      );
      
      if (!tokenKey) {
        return NextResponse.json({
          success: false,
          error: `Unsupported token: ${tokenOut}`
        }, { status: 400 });
      }
      
      tokenAddress = CONTRACT_ADDRESSES[tokenKey as keyof typeof CONTRACT_ADDRESSES];
    }
    
    // Simulate a successful withdrawal
    console.log(`✅ Simulated withdrawal of ${shares} shares to ${tokenOut} (${tokenAddress}) for ${userAddress}`);
    
    // Calculate estimated token amount received (simplified calculation)
    const estimatedAmount = parseFloat(shares) * 0.95; // Account for slippage and fees
    
    return NextResponse.json({
      success: true,
      data: {
        txHash: `0x${Math.random().toString(16).slice(2)}`,
        token: tokenOut,
        shares,
        amount: estimatedAmount.toString(),
        userAddress,
        timestamp: new Date().toISOString()
      }
    });
    
    /* 
    // Uncomment this for actual implementation with ethers.js
    
    // Import the necessary functions when implementing
    import { getServerSigner, getContracts, formatAmount, parseAmount } from '@/lib/flow-contracts';
    
    // Get signer and contracts
    const signer = getServerSigner(privateKey);
    const contracts = getContracts(signer);
    
    // Convert shares to wei
    const sharesWei = parseAmount(shares);
    
    // Call withdraw with minimum amount out of 0 (not recommended in production)
    // In production, you'd calculate a reasonable minAmountOut based on current prices
    const tx = await contracts.etfVault.withdraw(sharesWei, tokenAddress, 0);
    const receipt = await tx.wait();
    
    // Find the Transfer event for the token received
    const transferEvent = receipt.logs.find(log => 
      log.topics[0] === ethers.id('Transfer(address,address,uint256)')
    );
    
    let amountOut = '0';
    if (transferEvent) {
      const parsedLog = ethers.AbiCoder.parseLog({
        topics: transferEvent.topics,
        data: transferEvent.data,
        eventFragment: {
          name: 'Transfer',
          type: 'event',
          inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false }
          ]
        }
      });
      
      amountOut = formatAmount(parsedLog.args.value);
    }
    
    console.log(`✅ Withdrawal successful: ${receipt.hash}`);
    console.log(`✅ Received: ${amountOut} ${tokenOut}`);
    
    return NextResponse.json({
      success: true,
      data: {
        txHash: receipt.hash,
        token: tokenOut,
        shares,
        amount: amountOut,
        userAddress,
        timestamp: new Date().toISOString()
      }
    });
    */
    
  } catch (error) {
    console.error('❌ Error processing withdrawal:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to process withdrawal"
    }, { status: 500 });
  }
} 