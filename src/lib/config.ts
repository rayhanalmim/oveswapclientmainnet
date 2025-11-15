import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bsc, type AppKitNetwork } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// 0. Setup queryClient
export const queryClient = new QueryClient()

// 1. Get projectId from https://dashboard.reown.com
export const projectId = '419ac5d4d69e32a2f43d237b37b00791'

// 2. Create a metadata object - optional
const metadata = {
  name: 'OVE Swap',
  description: 'Token swap platform for OVE tokens',
  url: 'https://ovenswap.online', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 3. Set the networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc]

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

// Contract addresses from deployment (MAINNET)
export const CONTRACT_ADDRESSES = {
  OVE_TOKEN: '0x0d5556E58862A21db65B4Aa180da231cfE6140fE', // Mainnet OVE Token
  TOKEN_SWAP: '0x068571Ec22C648Fa740F4A9857FA222d7901A4aD', // Mainnet OveSwap Contract
  NATIVE_BNB: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // Native BNB address
}