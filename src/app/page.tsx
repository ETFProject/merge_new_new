'use client';

import Link from "next/link";
import Image from "next/image"; // ImageProps can be useful for custom components
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCard } from "@/components/ui/client-card";
import { TransitionWrapper } from "@/components/ui/transition-wrapper"; // Ensure this component is robust

// Define a type for your step items for better type safety
interface HowItWorksStep {
  id: number;
  title: string;
  description: string;
  imageSrc: string; // Or StaticImageData if using local import
  alt: string;
}

const howItWorksSteps: HowItWorksStep[] = [
  {
    id: 1,
    title: "Deposit Assets",
    description: "Users deposit assets into the ETF vault, receiving ETF shares proportional to their contribution value.",
    imageSrc: "/how-it-works-deposit.png", // IMPORTANT: Ensure this image exists and is optimized
    alt: "Illustration of depositing assets",
  },
  {
    id: 2,
    title: "AI Portfolio Management",
    description: "Our AI agent analyzes market conditions and rebalances your portfolio to maintain optimal allocations.",
    imageSrc: "/baevii-logo.png", // IMPORTANT: Ensure this image exists and is optimized
    alt: "Illustration of AI portfolio management",
  },
  {
    id: 3,
    title: "Cross-Chain Swaps",
    description: "Assets are swapped across chains using 1inch Fusion+ for optimal pricing and efficient rebalancing.",
    imageSrc: "/how-it-works-crosschain.png", // IMPORTANT: Ensure this image exists and is optimized
    alt: "Illustration of cross-chain swaps",
  },
  {
    id: 4,
    title: "Withdraw or Bridge",
    description: "Redeem your ETF shares for underlying assets or bridge them to other chains for the optimal liquidity.",
    imageSrc: "/how-it-works-withdraw.png", // IMPORTANT: Ensure this image exists and is optimized
    alt: "Illustration of withdrawing or bridging assets",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/1byone1.jpg" // Ensure this image is optimized (e.g., WebP, proper compression)
            alt="Abstract financial visualization"
            fill
            priority // Good for LCP
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
              <Link href="/dashboard">
                <Button size="lg" className="px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20" withHoverEffect>
                  View Dashboard
                </Button>
              </Link>
            </div>
          </TransitionWrapper>
        </div>

        {/* Decorative floating elements - ensure images are small and optimized */}
        <div className="absolute bottom-10 left-[10%] w-20 h-20 opacity-60 animate-floating animate-delay-1">
          <Image src="/1byone12.jpg" alt="Decorative element" width={80} height={80} />
        </div>
        <div className="absolute top-20 right-[15%] w-16 h-16 opacity-70 animate-floating animate-delay-3">
          <Image src="/1byone13.jpg" alt="Decorative element" width={64} height={64} />
        </div>
        <div className="absolute bottom-32 right-[20%] w-24 h-24 opacity-50 animate-floating animate-delay-2">
          <Image src="/1byone14.jpg" alt="Decorative element" width={96} height={96} />
        </div>
        <div className="absolute top-32 left-[20%] w-24 h-24 opacity-50 animate-floating animate-delay-2">
          <Image src="/1byone11.jpg" alt="Decorative element" width={96} height={96} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <TransitionWrapper>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Multi-Chain ETF Experience</h2>
          </TransitionWrapper>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <TransitionWrapper transitionType="card-appear" duration={400}>
              <ClientCard className="h-full" hover>
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Image src="/jellyfish.png" alt="Cross-chain icon" width={40} height={40} />
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

            {/* Feature Card 2 */}
            <TransitionWrapper transitionType="card-appear" duration={400} className="delay-100"> {/* Ensure 'delay-100' class correctly applies animation/transition delay */}
              <ClientCard className="h-full" hover>
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Image src="/chatgpt.png" alt="AI icon" width={40} height={40} />
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

            {/* Feature Card 3 */}
            <TransitionWrapper transitionType="card-appear" duration={400} className="delay-200"> {/* Ensure 'delay-200' class correctly applies animation/transition delay */}
              <ClientCard className="h-full" hover>
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Image src="/tornado.png" alt="Rebalancing icon" width={40} height={40} />
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

      {/* Updated How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <TransitionWrapper>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-16">
              The BAEVII leverages cutting-edge blockchain technology to provide a seamless multi-chain experience
            </p>
          </TransitionWrapper>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-12 md:space-y-16">
              {howItWorksSteps.map((step, index) => (
                <TransitionWrapper
                  key={step.id}
                  transitionType="slide-up"
                  duration={300}
                  delay={index * 150}
                >
                  <div className="flex items-stretch">
                    {/* Timeline Column (Number and Line) */}
                    <div className="flex flex-col items-center w-16 md:w-20 mr-4 md:mr-6 flex-shrink-0">
                      <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg md:text-xl font-bold z-10 shadow-lg`}>
                        {step.id}
                      </div>
                      {index < howItWorksSteps.length - 1 && (
                        <div className="mt-2 w-1 flex-grow bg-primary/30 rounded-full"></div>
                      )}
                    </div>

                    {/* Content Card Column */}
                    <div className="flex-grow">
                      <div className="bg-card rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out flex flex-col lg:flex-row items-center lg:items-start">
                        <div className="lg:flex-1 text-left mb-6 lg:mb-0 lg:pr-8">
                          <h3 className="text-2xl font-semibold mb-3 text-foreground">{step.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                        </div>
                        <div className="w-full lg:w-auto lg:max-w-[200px] flex justify-center lg:justify-end">
                          <Image
                            src={step.imageSrc}
                            alt={step.alt}
                            width={200}
                            height={180}
                            className="rounded-lg object-contain shadow-md aspect-[4/3]"
                            // Consider adding `loading="lazy"` explicitly if not default and below the fold,
                            // though next/image does this by default for non-priority images.
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TransitionWrapper>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/1byone1.jpg" // Ensure this image is also optimized
            alt="Abstract background"
            fill
            className="object-cover opacity-30 mix-blend-overlay"
            sizes="100vw"
            loading="lazy" // This image is likely below the fold, lazy loading can help
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