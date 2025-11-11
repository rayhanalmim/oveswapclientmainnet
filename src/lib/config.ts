import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bscTestnet, type AppKitNetwork } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// 0. Setup queryClient
export const queryClient = new QueryClient()

// 1. Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || ''

// 2. Create a metadata object - optional
const metadata = {
  name: 'OVE Swap',
  description: 'Token swap platform for OVE tokens',
  url: 'https://oveswap.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 3. Set the networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bscTestnet]

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    swaps: false, // Disable swap feature
    onramp: false, // Disable on-ramp feature
    email: true, // Keep email login
    socials: ['google', 'github', 'apple', 'facebook'] // Enable social logins
  }
})

// Contract addresses from deployment
export const CONTRACT_ADDRESSES = {
  OVE_TOKEN: '0x0eF7F6228dA35800B714C6E55c01f3d368B51942',
  TOKEN_SWAP: '0x786CB860D6245c22206f5bA67956301a95c1de4b', // Updated to new contract with fees
  NATIVE_BNB: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // Native BNB address used in deployment
}