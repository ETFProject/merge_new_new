'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Configuration 
const MOCK_API_ENABLED = true; // Set to false when real API is available

interface VerificationMethod {
  id: string;
  title: string;
  icon: string;
  description: string;
  recommended?: boolean;
}

interface VerificationState {
  walletAddress: string;
  twitterHandle: string;
  tweetId?: string;
  verificationCode?: string;
  expiresIn?: number;
  verificationMethod?: string;
}

interface TwitterUserData {
  id: string;
  screen_name?: string;
  username?: string;
  name: string;
  description: string;
  verified: boolean;
  followers_count?: number;
  following_count?: number;
  location?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
  };
}

interface VerificationResult {
  walletAddress: string;
  twitterHandle: string;
  verificationMethod: string;
  verified: boolean;
  verifiedAt: string;
  tweetId?: string;
  tweetData?: any; // This could be typed more specifically in a real app
  userProfile?: TwitterUserData;
  flareAttestation?: {
    attestationId: string;
    txHash: string;
    merkleProof: string;
    consensusReached: boolean;
    validators: number;
  };
}

const VERIFICATION_METHODS: VerificationMethod[] = [
  {
    id: 'tweet',
    title: 'Tweet Verification',
    icon: '🐦',
    description: 'Post a tweet with your wallet address and verify ownership of your account.',
    recommended: true
  },
  {
    id: 'bio',
    title: 'Bio Verification',
    icon: '🔐',
    description: 'Add a verification code to your Twitter bio. This method is quick and secure.'
  },
  {
    id: 'oauth',
    title: 'OAuth Verification',
    icon: '🔑',
    description: 'Connect your Twitter account directly through OAuth for a seamless experience.'
  }
];

export default function VerifyPage() {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mockModeEnabled, setMockModeEnabled] = useState(MOCK_API_ENABLED);
  const [verificationState, setVerificationState] = useState<VerificationState>({
    walletAddress: '',
    twitterHandle: '',
    tweetId: ''
  });
  const [selectedMethod, setSelectedMethod] = useState<string>('tweet');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Extract wallet address from URL if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verification = urlParams.get('verification');
    const wallet = urlParams.get('wallet');
    const message = urlParams.get('message');

    if (verification === 'success' && wallet) {
      checkVerificationStatus(wallet);
    } else if (verification === 'error' && message) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: decodeURIComponent(message)
      });
    }
  }, []);

  // Check if wallet is already verified
  const checkVerificationStatus = async (walletAddress: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/verification/status/${walletAddress}?mock=${mockModeEnabled}`);
      const data = await response.json();
      
      if (data.verified) {
        setVerificationResult(data);
        setIsVerified(true);
        setActiveStep(3);
        toast({
          title: "Verification Found",
          description: `Wallet ${walletAddress} is already verified with Twitter handle @${data.twitterHandle}`,
        });
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVerificationState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const startVerification = async () => {
    const { walletAddress, twitterHandle, tweetId } = verificationState;
    
    // Validate inputs
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Missing Wallet Address",
        description: "Please enter your wallet address."
      });
      return;
    }
    
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        variant: "destructive",
        title: "Invalid Wallet Address",
        description: "Please enter a valid Ethereum wallet address."
      });
      return;
    }
    
    if (!twitterHandle) {
      toast({
        variant: "destructive",
        title: "Missing Twitter Handle",
        description: "Please enter your Twitter/X handle."
      });
      return;
    }
    
    if (selectedMethod === 'tweet' && !tweetId) {
      toast({
        variant: "destructive",
        title: "Missing Tweet ID",
        description: "Please enter your tweet ID or URL."
      });
      return;
    }
    
    setLoading(true);
    
    try {
      if (selectedMethod === 'tweet') {
        // Tweet verification method
        const response = await fetch(`/api/verify-twitter?mock=${mockModeEnabled}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress,
            twitterHandle,
            tweetId
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify with tweet');
        }
        
        setVerificationResult(data.verification);
        setIsVerified(true);
        setActiveStep(3);
        
        toast({
          title: "Verification Complete",
          description: "Your Twitter account has been successfully verified!"
        });
      } 
      else if (selectedMethod === 'bio') {
        // Bio verification method - Step 1: Get verification code
        const response = await fetch(`/api/verify-twitter/bio/initiate?mock=${mockModeEnabled}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress,
            twitterHandle
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to initiate bio verification');
        }
        
        // Update state with verification code
        setVerificationState(prev => ({
          ...prev,
          verificationCode: data.verificationCode,
          expiresIn: data.expiresIn,
          verificationMethod: 'bio'
        }));
        
        setActiveStep(2);
      } 
      else if (selectedMethod === 'oauth') {
        // OAuth verification method
        const response = await fetch(`/api/verify-twitter/oauth/initiate?mock=${mockModeEnabled}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress,
            twitterHandle
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to initiate OAuth verification');
        }
        
        // Redirect to Twitter for OAuth authentication
        window.location.href = data.authorizationUrl;
        return;
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  const completeBioVerification = async () => {
    const { walletAddress, twitterHandle } = verificationState;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/verify-twitter/bio/complete?mock=${mockModeEnabled}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          twitterHandle
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Bio verification failed');
      }
      
      setVerificationResult(data.verification);
      setIsVerified(true);
      setActiveStep(3);
      
      toast({
        title: "Verification Complete",
        description: "Your Twitter account has been successfully verified!"
      });
    } catch (error) {
      console.error('Bio verification error:', error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setActiveStep(1);
    setVerificationState({
      walletAddress: '',
      twitterHandle: '',
      tweetId: ''
    });
    setSelectedMethod('tweet');
    setVerificationResult(null);
    setIsVerified(false);
  };

  // Render different steps based on activeStep
  const renderStep = () => {
    if (activeStep === 1) {
      return (
        <div className="space-y-6">
          <div className="grid gap-6">
            <Tabs defaultValue={selectedMethod} onValueChange={handleVerificationMethodSelect}>
              <TabsList className="grid grid-cols-3">
                {VERIFICATION_METHODS.map(method => (
                  <TabsTrigger key={method.id} value={method.id}>
                    {method.icon} {method.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {VERIFICATION_METHODS.map(method => (
                <TabsContent key={method.id} value={method.id} className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    {method.recommended && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                  
                  {method.id === 'tweet' && (
                    <div className="p-3 text-xs border rounded-md bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800">
                      <p>Your tweet must contain:</p>
                      <ul className="list-disc list-inside mt-1">
                        <li>Your wallet address</li>
                        <li>The hashtags #FlareVerified and #AIETF</li>
                      </ul>
                      <p className="mt-1">Example: "Verifying my wallet {verificationState.walletAddress || '0x...'} for AI ETF platform #FlareVerified #AIETF"</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <Input 
                  id="walletAddress" 
                  name="walletAddress"
                  placeholder="0x..." 
                  value={verificationState.walletAddress}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="twitterHandle">Twitter Handle</Label>
                <Input 
                  id="twitterHandle" 
                  name="twitterHandle"
                  placeholder="@username" 
                  value={verificationState.twitterHandle}
                  onChange={handleInputChange}
                />
              </div>
              
              {selectedMethod === 'tweet' && (
                <div className="grid gap-2">
                  <Label htmlFor="tweetId">Tweet URL or ID</Label>
                  <Input 
                    id="tweetId" 
                    name="tweetId"
                    placeholder="https://twitter.com/username/status/123456789 or 123456789" 
                    value={verificationState.tweetId}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={startVerification} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Start Verification'
            )}
          </Button>
        </div>
      );
    } 
    else if (activeStep === 2 && verificationState.verificationCode) {
      // Bio verification step 2 - Add code to bio
      return (
        <div className="space-y-6">
          <div className="rounded-md p-4 bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-50">
            <h3 className="font-semibold mb-2">Add this code to your Twitter bio:</h3>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-md font-mono text-center text-lg">
              {verificationState.verificationCode}
            </div>
            <p className="text-sm mt-2">
              Code expires in {Math.floor((verificationState.expiresIn || 600) / 60)} minutes
            </p>
          </div>
          
          <div className="text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to your Twitter profile</li>
              <li>Click on "Edit profile"</li>
              <li>Add the verification code to your bio</li>
              <li>Save your profile</li>
              <li>Come back here and click "Complete Verification"</li>
            </ol>
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => setActiveStep(1)}
              disabled={loading}
            >
              Back
            </Button>
            
            <Button 
              className="flex-1" 
              onClick={completeBioVerification}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Bio...
                </>
              ) : (
                'Complete Verification'
              )}
            </Button>
          </div>
        </div>
      );
    } 
    else if (activeStep === 3 && verificationResult) {
      // Verification complete
      return (
        <div className="space-y-6">
          <div className="rounded-md p-4 bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-50">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span> 
              Verification Complete
            </h3>
            <p className="mt-1">
              Your Twitter account has been successfully verified and recorded on the Flare blockchain.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-muted-foreground">Wallet Address:</div>
              <div className="font-mono break-all">{verificationResult.walletAddress}</div>
              
              <div className="text-muted-foreground">Twitter Handle:</div>
              <div>@{verificationResult.twitterHandle}</div>
              
              <div className="text-muted-foreground">Verification Method:</div>
              <div>{verificationResult.verificationMethod}</div>
              
              <div className="text-muted-foreground">Verified At:</div>
              <div>{new Date(verificationResult.verifiedAt).toLocaleString()}</div>
            </div>
            
            {verificationResult.flareAttestation && (
              <div className="rounded-md p-4 bg-purple-50 text-purple-900 dark:bg-purple-900 dark:text-purple-50">
                <h4 className="font-semibold mb-2">Blockchain Attestation</h4>
                <div className="grid grid-cols-1 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground mr-2">Attestation ID:</span>
                    <span className="font-mono">{verificationResult.flareAttestation.attestationId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-2">Transaction Hash:</span>
                    <span className="font-mono break-all">{verificationResult.flareAttestation.txHash}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-2">Validators:</span>
                    <span>{verificationResult.flareAttestation.validators}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button onClick={resetVerification}>
            Verify Another Account
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">AI ETF Verification</h1>
        <p className="text-muted-foreground mt-2">
          Connect your Twitter account to verify your identity on the blockchain
        </p>

        {/* Developer Mode Toggle */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className={mockModeEnabled ? "text-amber-600" : "text-muted-foreground"}>Mock API Mode</span>
          <Switch 
            checked={mockModeEnabled} 
            onCheckedChange={setMockModeEnabled} 
            id="mock-mode" 
            aria-label="Toggle mock API mode"
          />
          {mockModeEnabled && (
            <span className="text-xs text-amber-600 font-medium">(Using mock data)</span>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Social Media Verification</CardTitle>
          <CardDescription>
            Verify your Twitter account to authenticate your identity on-chain
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Stepper */}
          <div className="mb-8 relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted">
              <div 
                className="absolute h-full bg-primary transition-all duration-300"
                style={{ width: `${((activeStep - 1) / 2) * 100}%` }}
              />
            </div>
            
            <div className="relative z-10 flex justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <div className="mt-2 text-xs font-medium">Choose Method</div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <div className="mt-2 text-xs font-medium">Verify</div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
                <div className="mt-2 text-xs font-medium">Complete</div>
              </div>
            </div>
          </div>
          
          {/* Step Content */}
          {renderStep()}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          <div className="w-full text-sm bg-muted/50 p-3 rounded-md">
            <h4 className="font-semibold mb-1">Blockchain Verification</h4>
            <p className="text-muted-foreground">
              Your verification will be recorded on the Flare blockchain, providing a secure and immutable proof of your Twitter identity.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 