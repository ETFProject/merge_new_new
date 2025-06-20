# ETF Manager Frontend

## Deployment Status
- Latest commit: c6a9924
- Vercel deployment trigger: 2024-06-19

A modern UI for managing multi-chain crypto ETFs with AI-powered insights and cross-chain liquidity.

## Features

- Create and manage multi-chain ETFs
- AI-powered rebalancing and portfolio optimization with Google Gemini
- Cross-chain swaps using 1inch Fusion+
- Autonomous blockchain agent for automated operations
- Flow Network EVM integration

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   bun install
   ```
3. Create a `.env.local` file with the required environment variables:
   ```
   # Backend API URL
   BACKEND_URL=http://localhost:8080
   
   # 1inch API key - Get yours at https://portal.1inch.dev
   ONEINCH_API_KEY=your_api_key_here
   
   # Contract addresses
   NEXT_PUBLIC_USDC_ADDRESS=0xF881dE8e7D55dbaE312b464c1b1316AF96C71aFa
   NEXT_PUBLIC_WETH_ADDRESS=0x26256c749f3D24F1Ff0344522819fC7cD608846c

   # Privy AppId
   NEXT_PUBLIC_PRIVY_APP_ID=cmbaupqw600bgl10mf40l0cm6
   
   # Auto-Agent Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   PRIVY_APP_ID=your_privy_app_id_here
   PRIVY_APP_SECRET=your_privy_app_secret_here
   PRIVY_AUTH_KEY=your_privy_auth_key_here
   
   # Chain configuration
   FLOW_EVM_RPC_URL=https://evm-dev.flow.com/
   BASE_RPC_URL=https://mainnet.base.org
   ```
4. Start the development server:
   ```
   bun run dev
   ```

## 1inch Fusion+ Integration

The application includes a cross-chain swap feature powered by 1inch Fusion+. To use this feature:

1. Get an API key from [1inch Developer Portal](https://portal.1inch.dev)
2. Add your API key to the `.env.local` file
3. Access the swap interface at `/dashboard/swap`

The integration supports cross-chain swaps between:
- Base
- Arbitrum
- Ethereum
- Optimism

## AI-Powered Auto-Agent

The application includes an autonomous blockchain agent powered by Google Gemini AI:

1. Get a Gemini API key from [Google AI Studio](https://ai.google.dev/)
2. Add your API key to the `.env.local` file as `GEMINI_API_KEY`
3. Access the agent interface at `/dashboard/auto-agent`

The auto-agent can:
- Bridge assets between chains
- Deposit and withdraw from ETF vaults
- Rebalance portfolios
- Analyze market conditions and provide recommendations

## Development

This project uses:
- Next.js 15.3.3 with App Router
- Tailwind CSS
- Bun as the package manager and runtime
- Ethers.js for blockchain interactions
- Google Gemini for AI capabilities
- Privy for secure wallet management

## Testing

Run tests with:
```
bun test
```

## Building for Production

Build the application for production:
```
bun run build
```

Start the production server:
```
bun run start
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
