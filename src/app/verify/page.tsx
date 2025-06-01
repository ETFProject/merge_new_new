'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// Configuration - set to true for development, false for production
const MOCK_API_ENABLED = true; // This is a constant now, not visible in UI

interface TwitterUserData {
  screen_name: string;
  name: string;
  description: string;
  verified: boolean;
  followers_count: number;
  following_count: number;
  location?: string;
}

interface TweetData {
  id: string;
  text: string;
  user: {
    screen_name: string;
    name: string;
    verified: boolean;
    followers_count: number;
  };
  created_at: string;
  retweet_count: number;
  favorite_count: number;
}

interface VerificationResult {
  walletAddress: string;
  twitterHandle: string;
  verificationMethod: string;
  verified: boolean;
  verifiedAt: string;
  tweetId?: string;
  tweetData?: TweetData;
  userProfile?: TwitterUserData;
  flareAttestation?: {
    attestationId: string;
    txHash: string;
    merkleProof: string;
    consensusReached: boolean;
    validators: number;
  };
}

export default function VerifyPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("bio");
  const [loading, setLoading] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [twitterHandle, setTwitterHandle] = useState<string>("");
  const [tweetId, setTweetId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "initiated" | "complete" | "error">("idle");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Check wallet format
  const isValidWallet = (wallet: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(wallet);
  };

  // Check Twitter handle format
  const isValidTwitterHandle = (handle: string) => {
    const cleanHandle = handle.replace('@', '');
    return /^[a-zA-Z0-9_]{1,15}$/.test(cleanHandle);
  };

  // Normalize Twitter handle (remove @ if present)
  const normalizeTwitterHandle = (handle: string) => {
    return handle.replace('@', '');
  };

  // Extract tweet ID from URL or direct ID
  const extractTweetId = (input: string) => {
    // Handle direct tweet IDs
    if (/^\d+$/.test(input)) {
      return input;
    }
    
    // Extract from URLs (both twitter.com and x.com)
    const urlPattern = /(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/;
    const match = input.match(urlPattern);
    return match ? match[1] : null;
  };

  // Initiate bio verification
  const initiateBioVerification = async () => {
    try {
      if (!walletAddress || !isValidWallet(walletAddress)) {
        toast({
          title: "Invalid Wallet Address",
          description: "Please enter a valid Ethereum wallet address.",
          variant: "destructive"
        });
        return;
      }

      if (!twitterHandle || !isValidTwitterHandle(twitterHandle)) {
        toast({
          title: "Invalid Twitter Handle",
          description: "Please enter a valid Twitter handle.",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/verify-twitter/bio/initiate${MOCK_API_ENABLED ? '?mock=true' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          twitterHandle: normalizeTwitterHandle(twitterHandle)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to initiate verification';
        } catch {
          // If response is not valid JSON
          errorMessage = errorText || 'Failed to initiate verification';
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setVerificationCode(data.verificationCode);
      setVerificationStatus("initiated");
      toast({
        title: "Verification Initiated",
        description: "Please add the verification code to your Twitter bio."
      });
    } catch (error) {
      console.error('Error initiating verification:', error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Complete bio verification
  const completeBioVerification = async () => {
    try {
      if (!walletAddress || !twitterHandle) {
        toast({
          title: "Missing Information",
          description: "Wallet address and Twitter handle are required.",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/verify-twitter/bio/complete${MOCK_API_ENABLED ? '?mock=true' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          twitterHandle: normalizeTwitterHandle(twitterHandle)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to complete verification';
        } catch {
          // If response is not valid JSON
          errorMessage = errorText || 'Failed to complete verification';
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setVerificationResult(data.verification);
      setVerificationStatus("complete");
      toast({
        title: "Verification Complete",
        description: "Your Twitter account has been successfully verified."
      });
    } catch (error) {
      console.error('Error completing verification:', error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      setVerificationStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Verify via tweet
  const verifyViaTweet = async () => {
    try {
      if (!walletAddress || !isValidWallet(walletAddress)) {
        toast({
          title: "Invalid Wallet Address",
          description: "Please enter a valid Ethereum wallet address.",
          variant: "destructive"
        });
        return;
      }

      if (!twitterHandle || !isValidTwitterHandle(twitterHandle)) {
        toast({
          title: "Invalid Twitter Handle",
          description: "Please enter a valid Twitter handle.",
          variant: "destructive"
        });
        return;
      }

      if (!tweetId) {
        toast({
          title: "Missing Tweet ID",
          description: "Please enter a tweet ID or URL.",
          variant: "destructive"
        });
        return;
      }

      const extractedTweetId = extractTweetId(tweetId);
      if (!extractedTweetId) {
        toast({
          title: "Invalid Tweet ID",
          description: "Please enter a valid tweet ID or URL.",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/verify-twitter${MOCK_API_ENABLED ? '?mock=true' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          twitterHandle: normalizeTwitterHandle(twitterHandle),
          tweetId: extractedTweetId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to verify via tweet';
        } catch {
          // If response is not valid JSON
          errorMessage = errorText || 'Failed to verify via tweet';
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setVerificationResult(data.verification);
      setVerificationStatus("complete");
      toast({
        title: "Verification Complete",
        description: "Your Twitter account has been successfully verified via tweet."
      });
    } catch (error) {
      console.error('Error verifying via tweet:', error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check verification status for a wallet
  const checkVerificationStatus = async (walletToCheck: string) => {
    try {
      if (!isValidWallet(walletToCheck)) {
        toast({
          title: "Invalid Wallet Address",
          description: "Please enter a valid Ethereum wallet address.",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      const response = await fetch(`/api/verification/status/${walletToCheck}${MOCK_API_ENABLED ? '?mock=true' : ''}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to check verification status';
        } catch {
          // If response is not valid JSON
          errorMessage = errorText || 'Failed to check verification status';
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (data.verified) {
        setVerificationResult(data);
        setVerificationStatus("complete");
        toast({
          title: "Verification Found",
          description: `Wallet ${walletToCheck.substring(0, 6)}...${walletToCheck.substring(38)} is verified.`
        });
      } else {
        toast({
          title: "Not Verified",
          description: "No verification found for this wallet address.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      toast({
        title: "Error",
        description: "Failed to check verification status.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset the verification process
  const resetVerification = () => {
    setVerificationStatus("idle");
    setVerificationResult(null);
    setVerificationCode("");
  };

  // Styles inspired by the original verification page
  const verificationStyles = {
    container: "max-w-3xl mx-auto p-4",
    header: "text-center mb-8",
    title: "text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent",
    description: "text-gray-500 dark:text-gray-400",
    infoBox: "my-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300",
    verificationCode: "font-mono text-lg bg-blue-100 dark:bg-blue-900 p-3 rounded border border-blue-300 dark:border-blue-700 text-center my-4 tracking-wider text-blue-700 dark:text-blue-300",
    completeBox: "my-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300",
    errorBox: "my-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300",
    attestationBox: "my-4 p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-700 dark:text-purple-300 text-sm",
    input: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50",
    button: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    buttonOutline: "w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    step: "flex items-center",
    stepNumber: "h-8 w-8 rounded-full flex items-center justify-center",
    stepText: "ml-2 text-sm",
  };

  useEffect(() => {
    // If wallet is in URL params, check verification status
    const checkParamWallet = () => {
      const url = new URL(window.location.href);
      const wallet = url.searchParams.get('wallet');
      if (wallet && isValidWallet(wallet)) {
        setWalletAddress(wallet);
        checkVerificationStatus(wallet);
      }
    };

    checkParamWallet();
  }, []);

  // Render different views based on verification status
  const renderVerificationContent = () => {
    switch (verificationStatus) {
      case "idle":
        return (
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
            // Add a stable key to prevent hydration mismatch
            key="verification-tabs"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bio">Bio Verification</TabsTrigger>
              <TabsTrigger value="tweet">Tweet Verification</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bio" className="mt-4 space-y-4">
              <div className={verificationStyles.infoBox}>
                <p><strong>Bio Verification Method:</strong></p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Enter your wallet address and Twitter handle</li>
                  <li>Add the provided verification code to your Twitter bio</li>
                  <li>Complete verification to create your blockchain attestation</li>
                </ol>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twitterHandle">Twitter Handle</Label>
                  <Input
                    id="twitterHandle"
                    placeholder="@username"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  onClick={initiateBioVerification} 
                  disabled={loading || !walletAddress || !twitterHandle}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    "Start Bio Verification"
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="tweet" className="mt-4 space-y-4">
              <div className={verificationStyles.infoBox}>
                <p><strong>Tweet Verification Method:</strong></p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Post a tweet containing your wallet address and the hashtags #FlareVerified #AIETF</li>
                  <li>Enter your wallet address, Twitter handle, and tweet ID/URL below</li>
                  <li>Complete verification to create your blockchain attestation</li>
                </ol>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddressTweet">Wallet Address</Label>
                  <Input
                    id="walletAddressTweet"
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twitterHandleTweet">Twitter Handle</Label>
                  <Input
                    id="twitterHandleTweet"
                    placeholder="@username"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tweetId">Tweet ID or URL</Label>
                  <Input
                    id="tweetId"
                    placeholder="1234567890 or https://twitter.com/user/status/1234567890"
                    value={tweetId}
                    onChange={(e) => setTweetId(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  onClick={verifyViaTweet} 
                  disabled={loading || !walletAddress || !twitterHandle || !tweetId}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify via Tweet"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        );
      
      case "initiated":
        return (
          <div className="space-y-4">
            <div className={verificationStyles.infoBox}>
              <h3 className="text-lg font-semibold mb-2">Add This Code to Your Twitter Bio</h3>
              <p>Please add the following verification code to your Twitter bio, then click &quot;Complete Verification&quot;.</p>
              <div className={verificationStyles.verificationCode}>
                {verificationCode}
              </div>
              <p className="text-sm mt-2">This code will expire in 10 minutes.</p>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={resetVerification}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              
              <Button 
                onClick={completeBioVerification} 
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Complete Verification"
                )}
              </Button>
            </div>
          </div>
        );
      
      case "complete":
        return (
          <div className="space-y-4">
            <div className={verificationStyles.completeBox}>
              <h3 className="text-lg font-semibold mb-2">✅ Verification Complete</h3>
              <p>Your Twitter account has been successfully verified and recorded on the blockchain.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Wallet Address:</span>
                <p className="font-mono">{verificationResult?.walletAddress}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Twitter Handle:</span>
                <p>@{verificationResult?.twitterHandle}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Method:</span>
                <p>{verificationResult?.verificationMethod}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Verified At:</span>
                <p>{new Date(verificationResult?.verifiedAt || "").toLocaleString()}</p>
              </div>
            </div>
            
            {verificationResult?.flareAttestation && (
              <div className={verificationStyles.attestationBox}>
                <h3 className="text-sm font-semibold mb-2">Blockchain Attestation</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium">Attestation ID:</span>
                    <p className="font-mono text-xs break-all">{verificationResult.flareAttestation.attestationId}</p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium">Transaction Hash:</span>
                    <p className="font-mono text-xs break-all">{verificationResult.flareAttestation.txHash}</p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium">Validators:</span>
                    <p className="text-xs">{verificationResult.flareAttestation.validators}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={resetVerification}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Verify Another Account
            </Button>
          </div>
        );
      
      case "error":
        return (
          <div className="space-y-4">
            <div className={verificationStyles.errorBox}>
              <h3 className="text-lg font-semibold mb-2">❌ Verification Failed</h3>
              <p>There was an error during the verification process. Please try again.</p>
            </div>
            
            <Button 
              onClick={resetVerification}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={verificationStyles.container}>
      <div className={verificationStyles.header}>
        <h1 className={verificationStyles.title}>Twitter Verification</h1>
        <p className={verificationStyles.description}>
          Verify your identity by connecting your Twitter account to your wallet
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification</CardTitle>
          <CardDescription>
            Verify your identity to interact with the ETF platform
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Progress Steps */}
          <div className="flex justify-between mb-6 relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
            
            <div className={verificationStyles.step}>
              <div className={`${verificationStyles.stepNumber} ${
                verificationStatus !== "idle" ? "bg-green-500 text-white" : "bg-blue-500 text-white"
              }`}>
                1
              </div>
              <div className={verificationStyles.stepText}>
                Choose Method
              </div>
            </div>
            
            <div className={verificationStyles.step}>
              <div className={`${verificationStyles.stepNumber} ${
                verificationStatus === "initiated" ? "bg-blue-500 text-white" : 
                verificationStatus === "complete" ? "bg-green-500 text-white" : 
                "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}>
                2
              </div>
              <div className={verificationStyles.stepText}>
                Verify
              </div>
            </div>
            
            <div className={verificationStyles.step}>
              <div className={`${verificationStyles.stepNumber} ${
                verificationStatus === "complete" ? "bg-green-500 text-white" : 
                "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}>
                3
              </div>
              <div className={verificationStyles.stepText}>
                Complete
              </div>
            </div>
          </div>
          
          {renderVerificationContent()}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <a 
            href="https://flare.network" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Learn about blockchain attestations
          </a>
          
          <a 
            href="/dashboard" 
            className="text-sm text-blue-600 hover:underline"
          >
            Return to Dashboard
          </a>
        </CardFooter>
      </Card>
    </div>
  );
} 