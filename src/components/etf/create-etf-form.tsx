'use client';
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";

type RiskProfile = 'low' | 'medium' | 'high';

interface CreateETFFormProps {
  onSuccess?: () => void;
}

export function CreateETFForm({ onSuccess }: CreateETFFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("medium");
  const [initialAmount, setInitialAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Upload image to IPFS via Pinata
  const uploadToPinata = async (file: File) => {
    try {
      setUploadStatus('uploading');
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pinataMetadata', JSON.stringify({
        name: `ETF-${name}-image`,
      }));
      
      // Mock IPFS upload since we don't have Pinata integration yet
      // In a real implementation, you'd make an API call to your backend which handles Pinata
      // const response = await fetch('/api/upload-to-pinata', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await response.json();
      
      // Mock response for demo
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload time
      const mockHash = `ipfs-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      setIpfsHash(mockHash);
      
      // Save to local JSON for backup
      saveToLocalJson({
        name,
        description,
        riskProfile,
        initialAmount: parseFloat(initialAmount),
        imageHash: mockHash,
        timestamp: new Date().toISOString()
      });
      
      setUploadStatus('success');
      toast({
        title: "Image uploaded successfully",
        description: `IPFS Hash: ${mockHash.substring(0, 15)}...`,
      });
      
      return mockHash;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      setUploadStatus('error');
      toast({
        title: "Failed to upload image",
        description: "Please try again later",
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Save ETF data to local JSON for backup
  const saveToLocalJson = (data: any) => {
    try {
      // In a browser environment, we can use localStorage
      const existingData = localStorage.getItem('baeve-etfs') || '[]';
      const etfs = JSON.parse(existingData);
      etfs.push(data);
      localStorage.setItem('baeve-etfs', JSON.stringify(etfs));
      
      // In a real implementation, you might want to sync this with a backend
      console.log("ETF data saved locally:", data);
    } catch (error) {
      console.error("Error saving ETF data locally:", error);
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name || !riskProfile || !initialAmount) {
      toast({
        title: "Missing required fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Upload image to IPFS if available
      let imageIpfsHash = null;
      if (imageFile) {
        imageIpfsHash = await uploadToPinata(imageFile);
      }
      
      // This would connect to your backend API
      const response = await fetch('/api/etf/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          riskProfile,
          initialAmount,
          imageIpfsHash,
          userAddress: process.env.NEXT_PUBLIC_ETF_VAULT_ADDRESS || "0xb067fB16AFcABf8A8974a35CbCee243B8FDF0EA1", // Use deployer address for demo
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "ETF created successfully!",
          description: "Your new ETF has been created",
        });
        
        // Reset form or redirect
        setName("");
        setDescription("");
        setRiskProfile("medium");
        setInitialAmount("");
        setImageFile(null);
        setImagePreview(null);
        setIpfsHash(null);
        setUploadStatus('idle');
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error creating ETF",
          description: data.error || "Could not create ETF",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating ETF:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating the ETF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <Card className="w-[600px] mx-auto card-hover appear" effect3d>
      <CardHeader>
        <CardTitle className="animate-entry">Create New ETF</CardTitle>
        <CardDescription className="animate-entry animate-delay-1">
          Set up a new ETF portfolio based on your risk tolerance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 animate-stagger">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              ETF Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              placeholder="My Growth ETF"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              placeholder="A brief description of your ETF"
              rows={3}
            />
          </div>
          
          {/* Image Upload Section */}
          <div className="space-y-2">
            <label htmlFor="etf-image-input" className="text-sm font-medium">
              ETF Image
            </label>
            <div className="flex items-center space-x-4">
              <div 
                onClick={triggerFileInput}
                className="w-24 h-24 border-2 border-dashed border-input rounded-md flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                role="button"
                aria-label="Select ETF image"
                tabIndex={0}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <Image 
                      src={imagePreview}
                      alt="ETF Preview"
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-center text-muted-foreground">
                    Click to<br />upload
                  </span>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  id="etf-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  aria-label="Upload ETF image"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={triggerFileInput}
                >
                  Select Image
                </Button>
                
                {imageFile && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
                  </p>
                )}
                
                {uploadStatus === 'success' && ipfsHash && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Uploaded to IPFS: {ipfsHash.substring(0, 12)}...
                  </p>
                )}
                
                {uploadStatus === 'uploading' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Uploading to IPFS...
                  </p>
                )}
                
                {uploadStatus === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    Failed to upload. Please try again.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="riskProfile" className="text-sm font-medium">
              Risk Profile *
            </label>
            <select
              id="riskProfile"
              value={riskProfile}
              onChange={(e) => setRiskProfile(e.target.value as RiskProfile)}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
            <p className="text-xs text-muted-foreground">
              {riskProfile === "low" && "Conservative approach with stable returns"}
              {riskProfile === "medium" && "Balanced approach with moderate growth potential"}
              {riskProfile === "high" && "Aggressive approach with higher growth potential and volatility"}
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="initialAmount" className="text-sm font-medium">
              Initial Investment Amount (USD) *
            </label>
            <input
              id="initialAmount"
              type="text"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              placeholder="1000"
            />
          </div>
          
          <CardFooter className="flex justify-end p-0 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || uploadStatus === 'uploading'}
              className={isLoading ? "loading-indicator" : ""}
            >
              {isLoading ? "Creating..." : "Create ETF"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
} 