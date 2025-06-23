'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpFromLine, ArrowDownToLine, ThumbsUp, ThumbsDown, Plus, Twitter, Youtube, MessageCircle, Users } from "lucide-react";
import { SidebarProvider } from '../SidebarProvider';

// Mock voting data
const mockVotingProposals = [
  {
    id: 1,
    asset: 'LINK',
    description: 'Add Chainlink (LINK) to portfolio',
    upvotes: 156,
    downvotes: 23,
    status: 'active',
    timeLeft: '2 days'
  },
  {
    id: 2,
    asset: 'MATIC',
    description: 'Increase Polygon (MATIC) allocation',
    upvotes: 89,
    downvotes: 12,
    status: 'active',
    timeLeft: '4 days'
  },
  {
    id: 3,
    asset: 'AAVE',
    description: 'Add Aave (AAVE) to portfolio',
    upvotes: 67,
    downvotes: 45,
    status: 'active',
    timeLeft: '5 days'
  }
];

interface ITFDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itf: {
    name: string;
    description: string;
    icon: string;
    influencerImage: string;
    expenseRatio: string;
    aum: string;
    performance30D: string;
    bio?: string;
    socialMedia?: {
      twitter?: string;
      youtube?: string;
      telegram?: string;
      discord?: string;
    };
    holdings: Array<{ symbol: string; weight: string }>;
  };
}

export function ITFDetailDialog({ isOpen, onClose, itf }: ITFDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newProposal, setNewProposal] = useState('');
  const [userVotes, setUserVotes] = useState<Record<number, 'up' | 'down' | null>>({});

  const handleVote = (proposalId: number, voteType: 'up' | 'down') => {
    setUserVotes(prev => ({
      ...prev,
      [proposalId]: prev[proposalId] === voteType ? null : voteType
    }));
  };

  return (
    <SidebarProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                <Image 
                  src={itf.influencerImage} 
                  alt={itf.name}
                  width={48} 
                  height={48} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <DialogTitle className="text-2xl mb-1">{itf.name}</DialogTitle>
                <DialogDescription className="text-base">{itf.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-card/50">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Expense Ratio</h3>
                <p className="text-2xl font-bold text-foreground">{itf.expenseRatio}</p>
              </Card>
              <Card className="p-4 bg-card/50">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Assets Under Management</h3>
                <p className="text-2xl font-bold text-foreground">{itf.aum}</p>
              </Card>
              <Card className="p-4 bg-card/50">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">30 Day Performance</h3>
                <p className="text-2xl font-bold text-green-600">{itf.performance30D}</p>
              </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="allocation">Allocation</TabsTrigger>
                <TabsTrigger value="chains">Chains</TabsTrigger>
                <TabsTrigger value="deposit">Deposit/Withdraw</TabsTrigger>
                <TabsTrigger value="vote">Vote</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Bio Section */}
                {itf.bio && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">About This ITF</h3>
                    <p className="text-muted-foreground leading-relaxed">{itf.bio}</p>
                  </Card>
                )}

                {/* Social Media Section */}
                {itf.socialMedia && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Social Media & Community</h3>
                    <div className="flex flex-wrap gap-3">
                      {itf.socialMedia.twitter && (
                        <a
                          href={itf.socialMedia.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                        >
                          <Twitter className="w-4 h-4" />
                          <span className="text-sm font-medium">Twitter</span>
                        </a>
                      )}
                      {itf.socialMedia.youtube && (
                        <a
                          href={itf.socialMedia.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                        >
                          <Youtube className="w-4 h-4" />
                          <span className="text-sm font-medium">YouTube</span>
                        </a>
                      )}
                      {itf.socialMedia.telegram && (
                        <a
                          href={itf.socialMedia.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-400/10 text-blue-500 hover:bg-blue-400/20 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Telegram</span>
                        </a>
                      )}
                      {itf.socialMedia.discord && (
                        <a
                          href={itf.socialMedia.discord}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-medium">Discord</span>
                        </a>
                      )}
                    </div>
                  </Card>
                )}

                {/* Holdings Section */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Holdings</h3>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 font-medium text-sm text-muted-foreground pb-2 border-b">
                      <span>Asset</span>
                      <span className="text-right">Weight</span>
                      <span className="text-right">Value</span>
                    </div>
                    {itf.holdings.map((holding) => (
                      <div key={holding.symbol} className="grid grid-cols-3 text-sm items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {holding.symbol.slice(0, 1)}
                          </div>
                          <span className="font-medium">{holding.symbol}</span>
                        </div>
                        <span className="text-right">{holding.weight}</span>
                        <span className="text-right text-muted-foreground">
                          ${(parseFloat(itf.aum.replace(/[^0-9.]/g, '')) * parseFloat(holding.weight) / 100).toFixed(1)}M
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="performance" forceMount>
                <Card className="p-6 h-[450px]">
                  <h3 className="text-lg font-semibold mb-4">Historical Performance</h3>
                  <AnalyticsChart selectedTab="performance" timeframe="1m" itfData={itf} />
                </Card>
              </TabsContent>

              <TabsContent value="allocation" forceMount>
                <Card className="p-6 h-[450px]">
                  <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
                  <AnalyticsChart selectedTab="allocation" itfData={itf} />
                </Card>
              </TabsContent>

              <TabsContent value="chains" forceMount>
                <Card className="p-6 h-[450px]">
                  <h3 className="text-lg font-semibold mb-4">Chain Distribution</h3>
                  <AnalyticsChart selectedTab="chains" itfData={itf} />
                </Card>
              </TabsContent>

              <TabsContent value="deposit" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Deposit</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-lg"
                      />
                      <p className="text-sm text-muted-foreground">Balance: 1.23 ETH</p>
                    </div>
                    <Button className="w-full" size="lg">
                      <ArrowUpFromLine className="w-4 h-4 mr-2" />
                      Deposit
                    </Button>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Withdraw</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-lg"
                      />
                      <p className="text-sm text-muted-foreground">Your Balance: 100.00 ITF-Tokens</p>
                    </div>
                    <Button className="w-full" size="lg" variant="secondary">
                      <ArrowDownToLine className="w-4 h-4 mr-2" />
                      Withdraw
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="vote" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Community Proposals</h3>
                  <div className="space-y-4">
                    {mockVotingProposals.map((proposal) => (
                      <Card key={proposal.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{proposal.description}</p>
                          <p className="text-sm text-muted-foreground">{proposal.timeLeft} left</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={userVotes[proposal.id] === 'up' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVote(proposal.id, 'up')}
                          >
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            {proposal.upvotes}
                          </Button>
                          <Button
                            variant={userVotes[proposal.id] === 'down' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleVote(proposal.id, 'down')}
                          >
                            <ThumbsDown className="w-4 h-4 mr-2" />
                            {proposal.downvotes}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Submit a New Proposal</h3>
                  <div className="flex gap-2">
                    <Input
                      value={newProposal}
                      onChange={(e) => setNewProposal(e.target.value)}
                      placeholder="e.g., Add Solana (SOL) to portfolio"
                    />
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Submit
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Last rebalanced: 2 days ago
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
} 