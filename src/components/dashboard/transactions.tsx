'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for transactions
const mockTransactions = [
  {
    id: "tx1",
    type: "Deposit",
    asset: "USDT",
    amount: "+ 1,500.00",
    value: "$1,500.00",
    timestamp: "2023-04-15T09:24:17Z",
    status: "completed"
  },
  {
    id: "tx2",
    type: "Withdraw",
    asset: "ETH",
    amount: "- 0.55",
    value: "$1,203.71",
    timestamp: "2023-04-14T14:32:08Z",
    status: "completed"
  },
  {
    id: "tx3",
    type: "Buy",
    asset: "BTC",
    amount: "+ 0.025",
    value: "$742.33",
    timestamp: "2023-04-12T11:15:44Z",
    status: "completed"
  },
  {
    id: "tx4",
    type: "Rebalance",
    asset: "Multiple",
    amount: "±",
    value: "$12,500.00",
    timestamp: "2023-04-10T08:05:22Z",
    status: "completed"
  },
  {
    id: "tx5",
    type: "Sell",
    asset: "SOL",
    amount: "- 15.75",
    value: "$325.88",
    timestamp: "2023-04-08T16:45:31Z",
    status: "completed"
  }
];

// Helper function to format date for better accessibility
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function TransactionsTable() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your recent ITF transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div 
            className="overflow-auto max-h-[300px] pr-2" 
            tabIndex={0} 
            role="region" 
            aria-label="Recent transactions list"
          >
            <table className="w-full border-collapse text-sm" aria-label="Recent transactions">
              <thead className="sticky top-0 bg-background">
                <tr>
                  <th scope="col" className="text-left py-2 font-medium">Type</th>
                  <th scope="col" className="text-left py-2 font-medium">Asset</th>
                  <th scope="col" className="text-right py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx) => {
                  // Define the transaction type for screen readers
                  const typeLabel = tx.type === "Deposit" || tx.type === "Buy" 
                    ? "Incoming" 
                    : tx.type === "Withdraw" || tx.type === "Sell"
                    ? "Outgoing"
                    : "Adjustment";
                    
                  return (
                    <tr 
                      key={tx.id} 
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-2 h-2 rounded-full ${
                              tx.type === "Deposit" || tx.type === "Buy" 
                                ? "bg-green-500" 
                                : tx.type === "Withdraw" || tx.type === "Sell"
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                            aria-hidden="true"
                          ></div>
                          <span>{tx.type}</span>
                          <span className="sr-only">{typeLabel} transaction</span>
                        </div>
                      </td>
                      <td className="py-3">{tx.asset}</td>
                      <td className="py-3 text-right font-medium">
                        {tx.value}
                        <div className="text-xs text-muted-foreground">
                          <time dateTime={tx.timestamp}>{formatDate(tx.timestamp)}</time>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="outline" className="w-full" aria-label="View all transactions">
          View All Transactions
        </Button>
      </CardFooter>
    </Card>
  );
} 