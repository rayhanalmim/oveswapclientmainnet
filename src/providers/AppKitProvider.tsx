'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { wagmiAdapter, queryClient, projectId, networks, metadata } from '@/lib/config'

// Initialize AppKit modal at module level (this file is client-only)
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96' // MetaMask
  ],
  features: {
    analytics: true,
    swaps: false,
    onramp: false,
    email: false,
    socials: []
  }
})

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}