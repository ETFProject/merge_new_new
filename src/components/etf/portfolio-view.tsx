'use client';
import { useState, useEffect } from "react";
import Image from "next/image";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCard } from "@/components/ui/client-card";
import { Button } from "@/components/ui/button";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import { TransitionWrapper } from "@/components/ui/transition-wrapper";

interface TokenAllocation {
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string;
  weight: number;
  amount?: string;
  price?: number;
  logoUrl?: string; // Add logo URL for token
}

interface PerformanceMetrics {
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
  totalReturn: number;
  volatility: number;
  lastUpdated: string;
}

interface Portfolio {
  tokens: TokenAllocation[];
  lastRebalance: string;
  performance?: PerformanceMetrics;
}

interface PortfolioViewProps {
  itfId: string;
}

export function PortfolioView({ itfId }: PortfolioViewProps) {
  const [portfolioData, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  
  // Setup optimistic updates for rebalancing
  const [portfolio, triggerRebalance] = useOptimisticMutation<Portfolio | null, void>(
    portfolioData,
    (currentPortfolio) => {
      if (!currentPortfolio) return null;
      
      // Create an optimistic update with slightly adjusted token values
      return {
        ...currentPortfolio,
        tokens: currentPortfolio.tokens.map(token => ({
          ...token,
          // Simulate slight changes to token amounts
          amount: token.amount ? 
            (parseFloat(token.amount) * (1 + (Math.random() * 0.06 - 0.03))).toFixed(2) 
            : token.amount
        })),
        lastRebalance: new Date().toISOString(),
        performance: currentPortfolio.performance ? {
          ...currentPortfolio.performance,
          // Simulate slight performance improvements
          dailyChange: currentPortfolio.performance.dailyChange + (Math.random() * 0.5 - 0.1),
          weeklyChange: currentPortfolio.performance.weeklyChange + (Math.random() * 0.3 - 0.1),
          lastUpdated: new Date().toISOString()
        } : undefined
      };
    }
  );
  
  useEffect(() => {
    async function fetchPortfolio() {
      setLoading(true);
      try {
        const response = await fetch(`/api/etf/${itfId}/portfolio`);
        const data = await response.json();
        
        if (data.success) {
          // Add logo URLs for tokens - in real app these would come from API
          const tokensWithLogos = data.data.tokens.map((token: TokenAllocation) => {
            // Map some token symbols to our available images
            let logoUrl = "";
            switch (token.tokenSymbol) {
              case "DAI":
                logoUrl = "/flower.png";
                break;
              case "COMP":
                logoUrl = "/cactus.png";
                break;
              case "UNI":
                logoUrl = "/jellyfish.png";
                break;
              case "AAVE":
                logoUrl = "/musicrainfdbow.png";
                break;
              case "WMATIC":
                logoUrl = "/1byone20.jpg";
                break;
              default:
                logoUrl = "/sandwave.png";
            }
            return {
              ...token,
              logoUrl
            };
          });
          
          setPortfolio({
            ...data.data,
            tokens: tokensWithLogos
          });
          setError(null);
        } else {
          setError(data.error || "Failed to load portfolio data");
        }
      } catch (err) {
        console.error("Error fetching portfolio:", err);
        setError("An error occurred while fetching the portfolio");
      } finally {
        setLoading(false);
      }
    }
    
    fetchPortfolio();
  }, [itfId]);
  
  async function handleRebalance() {
    try {
      await triggerRebalance(undefined, async () => {
        const response = await fetch(`/api/etf/${itfId}/rebalance`, {
          method: 'POST',
        });
        const data = await response.json();
        
        if (data.success) {
          // Update the real data when the request completes
          setPortfolio(prev => prev ? { ...prev, ...data.data.newPortfolio } : null);
        } else {
          throw new Error(data.error || "Unknown error during rebalance");
        }
      });
    } catch (err) {
      console.error("Error rebalancing portfolio:", err);
      alert("An error occurred during rebalancing");
    }
  }

  const getChainName = (chainId: number) => {
    switch(chainId) {
      case 1: return "Ethereum";
      case 11155111: return "Ethereum Sepolia";
      case 545: return "Flow EVM Testnet";
      case 137: return "Polygon";
      default: return `Chain ${chainId}`;
    }
  };

  const getChainClass = (chainId: number) => {
    switch(chainId) {
      case 1: 
      case 11155111: return "bg-blue-100 text-blue-800";
      case 545: return "bg-purple-100 text-purple-800";
      case 137: return "bg-purple-500/20 text-purple-700";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const getChainColor = (chainId: number) => {
    switch(chainId) {
      case 1: 
      case 11155111: return "#627EEA"; // Ethereum blue
      case 545: return "#8247E5"; // Flow purple
      case 137: return "#8A2BE2"; // Polygon purple
      default: return "#CBD5E1"; // Gray
    }
  };
  
  const getChainLogo = (chainId: number) => {
    switch(chainId) {
      case 1: 
      case 11155111: return "/tornado.png"; // Ethereum
      case 545: return "/jellyfish.png"; // Flow
      case 137: return "/sandwave.png"; // Polygon
      default: return "/snail.png"; // Default
    }
  };
  
  if (loading) {
    return (
      <ClientCard appear>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <div className="loading-indicator">
              <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
          </div>
        </CardContent>
      </ClientCard>
    );
  }
  
  if (error) {
    return (
      <ClientCard appear>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40 text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </ClientCard>
    );
  }
  
  if (!portfolio) {
    return (
      <ClientCard appear>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <p>No portfolio data available</p>
          </div>
        </CardContent>
      </ClientCard>
    );
  }
  
  const rebalancingButton = (
    <Button 
      onClick={handleRebalance} 
      disabled={loading || portfolio !== portfolioData}
      withHoverEffect
      withRipple
      className={portfolio !== portfolioData ? "loading-indicator" : ""}
    >
      {portfolio !== portfolioData ? "Rebalancing..." : "Rebalance"}
    </Button>
  );
  
  // Calculate chain distribution
  const chainDistribution = portfolio.tokens.reduce((acc: Record<number, { total: number, color: string, logo: string }>, token) => {
    if (!acc[token.chainId]) {
      acc[token.chainId] = { 
        total: 0, 
        color: getChainColor(token.chainId),
        logo: getChainLogo(token.chainId)
      };
    }
    acc[token.chainId].total += token.weight;
    return acc;
  }, {});
  
  // Filter tokens by selected chain or show all if none selected
  const filteredTokens = selectedChainId 
    ? portfolio.tokens.filter(token => token.chainId === selectedChainId)
    : portfolio.tokens;

  return (
    <ClientCard hover appear>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="animate-entry animate-delay-1">
          <CardTitle>Cross-Chain ITF Portfolio</CardTitle>
          <CardDescription>
            Last rebalanced: {new Date(portfolio.lastRebalance).toLocaleDateString()}
          </CardDescription>
        </div>
        <div className="flex gap-2 animate-entry animate-delay-2">
          <Button 
            variant="outline"
            onClick={() => setShowAgentModal(true)}
            withHoverEffect
          >
            <Image src="/1byone20.jpg" alt="AI" width={20} height={20} className="mr-2" />
            Ask Agent
          </Button>
          {rebalancingButton}
        </div>
      </CardHeader>
      <CardContent>
        {/* Portfolio Performance Summary */}
        {portfolio.performance && (
          <TransitionWrapper transitionType="card-appear" className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-stagger">
              <div className="bg-muted/40 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Daily</p>
                <p className={`text-xl font-bold ${portfolio.performance.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolio.performance.dailyChange.toFixed(2)}%
                </p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Weekly</p>
                <p className={`text-xl font-bold ${portfolio.performance.weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolio.performance.weeklyChange.toFixed(2)}%
                </p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Monthly</p>
                <p className={`text-xl font-bold ${portfolio.performance.monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolio.performance.monthlyChange.toFixed(2)}%
                </p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Return</p>
                <p className={`text-xl font-bold ${portfolio.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolio.performance.totalReturn.toFixed(2)}%
                </p>
              </div>
            </div>
          </TransitionWrapper>
        )}

        {/* Chain Distribution Visualization */}
        <TransitionWrapper transitionType="slide-up" className="mb-8">
          <div className="bg-card/50 rounded-xl p-6 border">
            <h3 className="text-lg font-medium mb-4">Multi-Chain Distribution</h3>
            
            {/* Chain selection buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedChainId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChainId(null)}
                className="rounded-full"
                withHoverEffect
              >
                All Chains
              </Button>
              
              {Object.entries(chainDistribution).map(([chainId, data]) => (
                <Button
                  key={chainId}
                  variant={selectedChainId === Number(chainId) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChainId(Number(chainId))}
                  className="rounded-full flex items-center gap-2"
                  withHoverEffect
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden">
                    <Image src={data.logo} alt={getChainName(Number(chainId))} width={16} height={16} />
                  </div>
                  {getChainName(Number(chainId))}
                </Button>
              ))}
            </div>
            
            {/* Visual distribution */}
            <div className="space-y-4">
              <div className="h-24 rounded-lg overflow-hidden relative bg-muted/30">
                <div className="absolute inset-0 flex">
                  {Object.entries(chainDistribution).map(([chainId, data], index, array) => {
                    // Calculate the starting position
                    let startPercent = 0;
                    for (let i = 0; i < index; i++) {
                      startPercent += Object.values(array)[i][1].total;
                    }
                    
                    return (
                      <div
                        key={chainId}
                        className="h-full relative group cursor-pointer"
                        style={{ 
                          width: `${data.total}%`,
                          backgroundColor: data.color,
                          left: `${startPercent}%`,
                          position: 'absolute'
                        }}
                        onClick={() => setSelectedChainId(selectedChainId === Number(chainId) ? null : Number(chainId))}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/70 text-white px-2 py-1 rounded text-sm">
                            {getChainName(Number(chainId))}: {data.total}%
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                          <Image 
                            src={data.logo} 
                            alt={getChainName(Number(chainId))}
                            width={24} 
                            height={24}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(chainDistribution).map(([chainId, data]) => (
                  <div 
                    key={chainId}
                    className={`p-3 rounded-lg border flex items-center gap-3 ${
                      selectedChainId === Number(chainId) ? 'bg-primary/10 border-primary/30' : 'bg-card/50'
                    } cursor-pointer hover:bg-primary/5 transition-colors`}
                    onClick={() => setSelectedChainId(selectedChainId === Number(chainId) ? null : Number(chainId))}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 p-1.5 flex-shrink-0">
                      <Image 
                        src={data.logo} 
                        alt={getChainName(Number(chainId))}
                        width={28} 
                        height={28}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{getChainName(Number(chainId))}</p>
                      <p className="text-sm text-muted-foreground">{data.total}% allocation</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TransitionWrapper>
        
        {/* Cross-Chain Bridging Visualization */}
        <TransitionWrapper transitionType="slide-up" className="mb-8">
          <div className="bg-card/50 rounded-xl p-6 border">
            <h3 className="text-lg font-medium mb-4">Cross-Chain Liquidity Flow</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Assets move between chains through bridges and swaps to maintain optimal allocations
            </p>
            
            <div className="relative h-36">
              {/* Chains representation */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center z-10">
                <Image src="/tornado.png" alt="Ethereum" width={40} height={40} />
              </div>
              
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center z-20 border-2 border-primary/30">
                <div className="text-center">
                  <Image src="/1byone20.jpg" alt="BAEVII" width={48} height={48} className="mx-auto" />
                  <p className="text-xs font-semibold mt-1">BAEVII</p>
                </div>
              </div>
              
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center z-10">
                <Image src="/jellyfish.png" alt="Flow" width={40} height={40} />
              </div>
              
              {/* Connecting lines */}
              <svg className="absolute inset-0 w-full h-full z-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                  </marker>
                </defs>
                
                {/* Left to Center */}
                <path 
                  d="M20,60 Q100,20 150,60" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="text-primary/60"
                  markerEnd="url(#arrowhead)"
                />
                
                {/* Center to Left */}
                <path 
                  d="M150,70 Q100,120 20,70" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="text-primary/60"
                  markerEnd="url(#arrowhead)"
                />
                
                {/* Right to Center */}
                <path 
                  d="M280,60 Q200,20 150,60" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="text-primary/60"
                  markerEnd="url(#arrowhead)"
                />
                
                {/* Center to Right */}
                <path 
                  d="M150,70 Q200,120 280,70" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="text-primary/60"
                  markerEnd="url(#arrowhead)"
                />
              </svg>
            </div>
          </div>
        </TransitionWrapper>
        
        {/* Tokens Table */}
        <TransitionWrapper transitionType="card-appear" className="mb-6">
          <div className="overflow-x-auto bg-card/50 rounded-xl p-6 border">
            <h3 className="text-lg font-medium mb-4">
              {selectedChainId ? `${getChainName(selectedChainId)} Tokens` : 'All Portfolio Tokens'}
            </h3>
            
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Token</th>
                  <th className="text-left pb-2">Network</th>
                  <th className="text-right pb-2">Weight</th>
                  <th className="text-right pb-2">Amount</th>
                  <th className="text-right pb-2">Value (USD)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map((token, index) => (
                  <tr key={index} className="border-b border-muted/20 table-row-hover">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2 overflow-hidden">
                          {token.logoUrl ? (
                            <Image src={token.logoUrl} alt={token.tokenSymbol} width={24} height={24} />
                          ) : (
                            token.tokenSymbol.substring(0, 2)
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{token.tokenSymbol}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{token.tokenAddress.substring(0, 8)}...{token.tokenAddress.substring(token.tokenAddress.length - 6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden">
                          <Image 
                            src={getChainLogo(token.chainId)} 
                            alt={getChainName(token.chainId)} 
                            width={20} 
                            height={20} 
                          />
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs token-badge ${getChainClass(token.chainId)}`}>
                          {getChainName(token.chainId)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">{token.weight}%</td>
                    <td className="py-3 text-right">{token.amount || "-"}</td>
                    <td className="py-3 text-right">
                      {token.amount && token.price 
                        ? `$${(parseFloat(token.amount) * token.price).toFixed(2)}`
                        : "-"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TransitionWrapper>

        {/* Cross-Chain Opportunities */}
        <TransitionWrapper transitionType="slide-up">
          <div className="bg-card/50 rounded-xl p-6 border">
            <h3 className="text-lg font-medium mb-4">Cross-Chain Opportunities</h3>
            <div className="bg-primary/5 rounded-lg p-4 animate-entry animate-delay-2 flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary-foreground text-xs">
                  <Image src="/1byone20.jpg" alt="AI" width={32} height={32} />
                </div>
              </div>
              <div>
                <p className="font-medium text-sm mb-2">Agent Recommendation</p>
                <p className="text-sm mb-3">
                  Based on current market conditions, consider optimizing your ITF allocation by moving 10% of your ETH to Flow EVM Testnet for enhanced cross-chain capabilities.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-xs" withHoverEffect>View Details</Button>
                  <Button size="sm" className="text-xs" withHoverEffect withRipple>Apply Recommendation</Button>
                </div>
              </div>
            </div>
          </div>
        </TransitionWrapper>

        {/* AI Agent Modal */}
        {showAgentModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center modal-enter">
            <div className="bg-card rounded-xl overflow-hidden shadow-lg border w-full max-w-md modal-content-enter">
              <div className="bg-primary/10 p-4 flex items-center gap-4 border-b">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-foreground overflow-hidden">
                  <Image src="/1byone20.jpg" alt="BAEVII AI Agent" width={24} height={24} />
                </div>
                <div>
                  <h3 className="font-bold">BAEVII AI Agent</h3>
                  <p className="text-sm text-muted-foreground">Cross-Chain Portfolio Assistant</p>
                </div>
                <button 
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAgentModal(false)}
                  aria-label="Close dialog"
                  title="Close dialog"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="p-4 h-64 overflow-auto space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 animate-entry">
                  <p className="text-sm">I&apos;ve analyzed your ITF portfolio and found that you could benefit from utilizing cross-chain bridges to rebalance 15% of your assets to Flow EVM Testnet.</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 ml-6 animate-entry animate-delay-1">
                  <p className="text-sm">Why should I move assets to Flow EVM Testnet?</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 animate-entry animate-delay-2">
                  <p className="text-sm">Flow EVM Testnet currently offers optimized performance for your ITF assets with enhanced cross-chain capabilities. I can facilitate this bridge operation through our integrated ITF bridge contracts.</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 ml-6 animate-entry animate-delay-3">
                  <p className="text-sm">How does the cross-chain rebalancing work?</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 animate-entry animate-delay-4">
                  <p className="text-sm">The ITFVault contract will approve your tokens to cross-chain aggregators, which will handle the complex routing between chains. The funds will be bridged to Flow EVM Testnet and deposited into your ITF there, all while maintaining your overall portfolio allocations.</p>
                </div>
              </div>
              <div className="p-4 border-t bg-card">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask about cross-chain operations..."
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button size="sm" withHoverEffect withRipple>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z"></path>
                      <path d="M22 2 11 13"></path>
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </ClientCard>
  );
} 