'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCard } from "@/components/ui/client-card";
import { TransitionWrapper } from "@/components/ui/transition-wrapper";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/1byone1.jpg" 
            alt="Abstract financial visualization" 
            fill 
            priority
            className="object-cover opacity-75"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-primary/20 mix-blend-multiply" />
        </div>
        
        <div className="container mx-auto relative z-10 px-4 text-center text-white">
          <TransitionWrapper transitionType="slide-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">BAEVII</h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10">
              Create and manage multi-chain crypto ETFs with AI-powered insights and cross-chain liquidity
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/create">
                <Button size="lg" className="px-8" withHoverEffect withRipple>
                  Create Your ETF
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20" withHoverEffect>
                  View Dashboard
                </Button>
              </Link>
            </div>
          </TransitionWrapper>
        </div>

        {/* Decorative floating elements */}
        <div className="absolute bottom-10 left-[10%] w-20 h-20 opacity-60 animate-floating animate-delay-1">
          <Image src="/placeholder.png" alt="Decorative element" width={80} height={80} />
        </div>
        <div className="absolute top-20 right-[15%] w-16 h-16 opacity-70 animate-floating animate-delay-3">
          <Image src="/placeholder.png" alt="Decorative element" width={64} height={64} />
        </div>
        <div className="absolute bottom-32 right-[20%] w-24 h-24 opacity-50 animate-floating animate-delay-2">
          <Image src="/placeholder.png" alt="Decorative element" width={96} height={96} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <TransitionWrapper>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Multi-Chain ETF Experience</h2>
          </TransitionWrapper>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TransitionWrapper transitionType="card-appear" duration={400}>
              <ClientCard className="h-full" hover>
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Image src="/placeholder.png" alt="Cross-chain icon" width={40} height={40} />
                  </div>
                  <CardTitle className="text-center">Cross-Chain Portfolio</CardTitle>
                  <CardDescription className="text-center">
                    Seamlessly manage assets across multiple blockchains
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center">Create a diversified portfolio with assets from Ethereum, Base, Solana, and more—all managed from a single interface.</p>
                </CardContent>
              </ClientCard>
            </TransitionWrapper>
            
            <TransitionWrapper transitionType="card-appear" duration={400} className="delay-100">
              <ClientCard className="h-full" hover>
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Image src="/placeholder.png" alt="AI icon" width={40} height={40} />
                  </div>
                  <CardTitle className="text-center">AI-Powered Insights</CardTitle>
                  <CardDescription className="text-center">
                    Get intelligent recommendations for your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center">Our Gemini AI agent analyzes market conditions and provides personalized rebalancing strategies to optimize your returns.</p>
                </CardContent>
              </ClientCard>
            </TransitionWrapper>
            
            <TransitionWrapper transitionType="card-appear" duration={400} className="delay-200">
              <ClientCard className="h-full" hover>
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Image src="/placeholder.png" alt="Rebalancing icon" width={40} height={40} />
                  </div>
                  <CardTitle className="text-center">Automated Rebalancing</CardTitle>
                  <CardDescription className="text-center">
                    Keep your portfolio optimized with smart rebalancing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center">Maintain your target allocations with automated rebalancing powered by 1inch Fusion+ and Flare FTSO price feeds.</p>
                </CardContent>
              </ClientCard>
            </TransitionWrapper>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <TransitionWrapper>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-16">The BAEVII leverages cutting-edge blockchain technology to provide a seamless multi-chain experience</p>
          </TransitionWrapper>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Flow diagram with icons */}
            <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-1 bg-primary/30 -translate-x-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="md:text-right md:pr-12">
                <TransitionWrapper transitionType="slide-up">
                  <div className="bg-card rounded-lg p-6 shadow-md relative">
                    <div className="absolute right-0 md:left-full top-1/2 -translate-y-1/2 md:translate-x-[-50%] w-10 h-10 rounded-full bg-primary md:flex items-center justify-center text-primary-foreground font-bold hidden">1</div>
                    <h3 className="text-xl font-semibold mb-2">Deposit Assets</h3>
                    <p>Users deposit assets into the ETF vault, receiving ETF shares proportional to their contribution value.</p>
                    <div className="mt-4 flex justify-end">
                      <Image src="/1byone5.jpg" alt="Deposit illustration" width={100} height={100} className="rounded-md" />
                    </div>
                  </div>
                </TransitionWrapper>
              </div>
              
              <div className="md:pl-12"></div>
              
              <div className="md:text-right md:pr-12"></div>
              
              <div className="md:pl-12">
                <TransitionWrapper transitionType="slide-up" className="delay-100">
                  <div className="bg-card rounded-lg p-6 shadow-md relative">
                    <div className="absolute left-0 md:right-full top-1/2 -translate-y-1/2 md:translate-x-[50%] w-10 h-10 rounded-full bg-primary md:flex items-center justify-center text-primary-foreground font-bold hidden">2</div>
                    <h3 className="text-xl font-semibold mb-2">AI Portfolio Management</h3>
                    <p>Our AI agent analyzes market conditions and rebalances your portfolio to maintain optimal allocations.</p>
                    <div className="mt-4 flex justify-start">
                      <Image src="/1byone13.jpg" alt="AI management illustration" width={100} height={100} className="rounded-md" />
                    </div>
                  </div>
                </TransitionWrapper>
              </div>
              
              <div className="md:text-right md:pr-12">
                <TransitionWrapper transitionType="slide-up" className="delay-200">
                  <div className="bg-card rounded-lg p-6 shadow-md relative">
                    <div className="absolute right-0 md:left-full top-1/2 -translate-y-1/2 md:translate-x-[-50%] w-10 h-10 rounded-full bg-primary md:flex items-center justify-center text-primary-foreground font-bold hidden">3</div>
                    <h3 className="text-xl font-semibold mb-2">Cross-Chain Swaps</h3>
                    <p>Assets are swapped across chains using 1inch Fusion+ for optimal pricing and efficient rebalancing.</p>
                    <div className="mt-4 flex justify-end">
                      <Image src="/1byone19.jpg" alt="Cross-chain illustration" width={100} height={100} className="rounded-md" />
                    </div>
                  </div>
                </TransitionWrapper>
              </div>
              
              <div className="md:pl-12"></div>
              
              <div className="md:text-right md:pr-12"></div>
              
              <div className="md:pl-12">
                <TransitionWrapper transitionType="slide-up" className="delay-300">
                  <div className="bg-card rounded-lg p-6 shadow-md relative">
                    <div className="absolute left-0 md:right-full top-1/2 -translate-y-1/2 md:translate-x-[50%] w-10 h-10 rounded-full bg-primary md:flex items-center justify-center text-primary-foreground font-bold hidden">4</div>
                    <h3 className="text-xl font-semibold mb-2">Withdraw or Bridge</h3>
                    <p>Redeem your ETF shares for underlying assets or bridge them to other chains for enhanced liquidity.</p>
                    <div className="mt-4 flex justify-start">
                      <Image src="/1byone24.jpg" alt="Withdraw illustration" width={100} height={100} className="rounded-md" />
                    </div>
                  </div>
                </TransitionWrapper>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/1byone8.jpg" 
            alt="Abstract background" 
            fill 
            className="object-cover opacity-30 mix-blend-overlay"
            sizes="100vw"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <TransitionWrapper>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Build Your ETF?</h2>
              <p className="text-xl opacity-90 mb-10">Start creating your diversified cross-chain portfolio today with BAEVII</p>
              <Link href="/dashboard/create">
                <Button size="lg" variant="outline" className="px-8 bg-white text-primary hover:bg-white/90 border-white" withHoverEffect withRipple>
                  Get Started Now
                </Button>
              </Link>
            </TransitionWrapper>
          </div>
        </div>
      </section>
    </main>
  );
}
