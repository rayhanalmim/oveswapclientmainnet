'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, Contract, formatEther, Eip1193Provider } from 'ethers'
import { CONTRACT_ADDRESSES } from '@/lib/config'
import TokenSwapABI from '@/ABI/oveTokenSwapAbi/TokenSwapWithNativeBNB.json'

interface TokenPrice {
  symbol: string
  price: string
  priceUSD: number
}

export function useTokenPrices() {
  const { walletProvider } = useAppKitProvider('eip155')
  const [prices, setPrices] = useState<TokenPrice[]>([
    { symbol: 'BNB', price: '$0.00', priceUSD: 0 },
    { symbol: 'OVE', price: '$0.00', priceUSD: 0 }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    if (!walletProvider) {
      console.log('No wallet provider available')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const ethersProvider = new BrowserProvider(walletProvider as Eip1193Provider)
      const swapContract = new Contract(CONTRACT_ADDRESSES.TOKEN_SWAP, TokenSwapABI.abi, ethersProvider)

      // Get BNB price info
      const bnbPriceInfo = await swapContract.getPriceInfo(CONTRACT_ADDRESSES.NATIVE_BNB)
      const bnbPriceUSD = parseFloat(formatEther(bnbPriceInfo.tokenPriceUSD)) / 1e10 // Chainlink price feeds use 8 decimals

      // Get OVE price info
      const ovePriceUSD = parseFloat(formatEther(await swapContract.ovepriceInUSD())) / 1e10 // Chainlink price feeds use 8 decimals

      setPrices([
        { 
          symbol: 'BNB', 
          price: `$${bnbPriceUSD.toFixed(2)}`, 
          priceUSD: bnbPriceUSD 
        },
        { 
          symbol: 'OVE', 
          price: `$${ovePriceUSD.toFixed(4)}`, 
          priceUSD: ovePriceUSD 
        }
      ])

    } catch (error) {
      console.error('Error fetching token prices:', error)
      setError('Failed to fetch token prices')
      // Keep default prices on error
      setPrices([
        { symbol: 'BNB', price: '$320.45', priceUSD: 320.45 },
        { symbol: 'OVE', price: '$0.0045', priceUSD: 0.0045 }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [walletProvider])

  useEffect(() => {
    fetchPrices()
    
    // Refresh prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000)
    
    return () => clearInterval(interval)
  }, [fetchPrices])

  return { prices, isLoading, error, refetch: fetchPrices }
}