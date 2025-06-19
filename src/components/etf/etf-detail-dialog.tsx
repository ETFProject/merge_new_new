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
import { ArrowUpFromLine, ArrowDownToLine, ThumbsUp, ThumbsDown, Plus } from "lucide-react";

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

interface ETFDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  etf: {
    name: string;
    description: string;
    icon: string;
    iconText: string;
    expenseRatio: string;
    aum: string;
    performance30D: string;
    holdings: Array<{ symbol: string; weight: string }>;
  };
}

export function ETFDetailDialog({ isOpen, onClose, etf }: ETFDetailDialogProps) {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
              {etf.iconText}
            </div>
            <div>
              <DialogTitle className="text-2xl mb-1">{etf.name}</DialogTitle>
              <DialogDescription className="text-base">{etf.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-card/50">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Expense Ratio</h3>
              <p className="text-2xl font-bold text-foreground">{etf.expenseRatio}</p>
            </Card>
            <Card className="p-4 bg-card/50">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Assets Under Management</h3>
              <p className="text-2xl font-bold text-foreground">{etf.aum}</p>
            </Card>
            <Card className="p-4 bg-card/50">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">30 Day Performance</h3>
              <p className="text-2xl font-bold text-green-600">{etf.performance30D}</p>
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
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Holdings</h3>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 font-medium text-sm text-muted-foreground pb-2 border-b">
                    <span>Asset</span>
                    <span className="text-right">Weight</span>
                    <span className="text-right">Value</span>
                  </div>
                  {etf.holdings.map((holding) => (
                    <div key={holding.symbol} className="grid grid-cols-3 text-sm items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {holding.symbol.slice(0, 1)}
                        </div>
                        <span className="font-medium">{holding.symbol}</span>
                      </div>
                      <span className="text-right">{holding.weight}</span>
                      <span className="text-right text-muted-foreground">
                        ${(parseFloat(etf.aum.replace(/[^0-9.]/g, '')) * parseFloat(holding.weight) / 100).toFixed(1)}M
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Historical Performance</h3>
                <AnalyticsChart selectedTab="performance" timeframe="1m" />
              </Card>
            </TabsContent>

            <TabsContent value="allocation">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
                <AnalyticsChart selectedTab="allocation" />
              </Card>
            </TabsContent>

            <TabsContent value="chains">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Chain Distribution</h3>
                <AnalyticsChart selectedTab="chains" />
              </Card>
            </TabsContent>

            <TabsContent value="deposit" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Deposit</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Enter amount to deposit"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <Button className="w-full">Deposit</Button>
                    <p className="text-sm text-muted-foreground">
                      Minimum deposit: 10 USDC • Gas fee: ~0.002 ETH
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Withdraw</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Enter amount to withdraw"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <Button className="w-full">Withdraw</Button>
                    <p className="text-sm text-muted-foreground">
                      Available to withdraw: 2.5 USDC • Gas fee: ~0.002 ETH
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="vote" className="space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Community Proposals</h3>
                  <div className="flex gap-4 items-center">
                    <Input
                      placeholder="Propose new asset..."
                      value={newProposal}
                      onChange={(e) => setNewProposal(e.target.value)}
                      className="w-64"
                    />
                    <Button size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Proposal
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {mockVotingProposals.map((proposal) => (
                    <div key={proposal.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {proposal.asset.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-medium">{proposal.description}</p>
                          <p className="text-sm text-muted-foreground">Time left: {proposal.timeLeft}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={userVotes[proposal.id] === 'up' ? 'default' : 'outline'}
                            className="gap-1"
                            onClick={() => handleVote(proposal.id, 'up')}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{proposal.upvotes + (userVotes[proposal.id] === 'up' ? 1 : 0)}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant={userVotes[proposal.id] === 'down' ? 'default' : 'outline'}
                            className="gap-1"
                            onClick={() => handleVote(proposal.id, 'down')}
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>{proposal.downvotes + (userVotes[proposal.id] === 'down' ? 1 : 0)}</span>
                          </Button>
                        </div>
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(proposal.upvotes / (proposal.upvotes + proposal.downvotes)) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
  );
} 