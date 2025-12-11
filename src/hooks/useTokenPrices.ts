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
      console.log('BNB Price Info from contract:', bnbPriceInfo)
      console.log('BNB tokenPriceUSD value:', bnbPriceInfo.tokenPriceUSD.toString())

      // Check if the value is already in USD format or needs decimal conversion
      let bnbPriceUSD = Number(bnbPriceInfo.tokenPriceUSD)
      if (bnbPriceUSD > 10000) {
        // If it's a large number, it's likely in wei format with 8 decimals
        bnbPriceUSD = bnbPriceUSD / 100000000 // 8 decimals
      }
      console.log('Calculated BNB Price USD:', bnbPriceUSD)

      // Get OVE price info - try multiple approaches
      let ovePriceUSD = 0
      let ovePriceSource = 'unknown'

      try {
        // Method 1: Try getPriceInfo for OVE
        const ovePriceInfo = await swapContract.getPriceInfo(CONTRACT_ADDRESSES.OVE_TOKEN)
        console.log('OVE Price Info from getPriceInfo:', ovePriceInfo)
        console.log('OVE tokenPriceUSD value:', ovePriceInfo.tokenPriceUSD.toString())

        ovePriceUSD = Number(ovePriceInfo.tokenPriceUSD)
        if (ovePriceUSD > 10000) {
          // If it's a large number, it's likely in wei format with 8 decimals
          ovePriceUSD = ovePriceUSD / 100000000 // 8 decimals
        }
        ovePriceSource = 'getPriceInfo'
        console.log('OVE Price from getPriceInfo:', ovePriceUSD)
      } catch (error) {
        console.log('getPriceInfo for OVE failed:', error)
      }

      // If OVE price is still 0, try alternative methods
      if (ovePriceUSD === 0) {
        try {
          // Method 2: Try ovepriceInUSD function
          const ovePriceWei = await swapContract.ovepriceInUSD()
          console.log('OVE Price Wei from ovepriceInUSD:', ovePriceWei.toString())

          ovePriceUSD = Number(ovePriceWei)
          if (ovePriceUSD > 10000) {
            // If it's a large number, it's likely in wei format with 8 decimals
            ovePriceUSD = ovePriceUSD / 100000000 // 8 decimals
          } else if (ovePriceUSD > 100) {
            // If it's a medium number, it might be using 18 decimals
            ovePriceUSD = ovePriceUSD / 1e18 // 18 decimals
          }
          ovePriceSource = 'ovepriceInUSD'
        } catch (error) {
          console.log('ovepriceInUSD failed:', error)
        }
      }

      // If OVE price is still 0, calculate using exchange rate
      if (ovePriceUSD === 0) {
        try {
          // Method 3: Calculate OVE price from BNB exchange rate
          const exchangeRate = await swapContract.exchangeRates(CONTRACT_ADDRESSES.NATIVE_BNB)
          console.log('BNB-OVE Exchange Rate:', exchangeRate.toString())

          // Exchange rate represents how many OVE tokens equal 1 BNB
          const rate = Number(exchangeRate)
          if (rate > 0 && bnbPriceUSD > 0) {
            // OVE price = BNB price / exchange rate
            ovePriceUSD = bnbPriceUSD / rate
            ovePriceSource = 'exchange rate calculation'
          }
        } catch (error) {
          console.log('Exchange rate calculation failed:', error)
        }
      }

      // If still 0, use the direct manual rate from getPriceInfo if available
      if (ovePriceUSD === 0) {
        try {
          const ovePriceInfo = await swapContract.getTokenInfo(CONTRACT_ADDRESSES.OVE_TOKEN)
          console.log('OVE Token Info:', ovePriceInfo)
          const manualRate = Number(ovePriceInfo.manualExchangeRate)

          if (manualRate > 0 && bnbPriceUSD > 0) {
            // Manual rate represents how many OVE tokens equal 1 BNB
            ovePriceUSD = bnbPriceUSD / manualRate
            ovePriceSource = 'manual exchange rate'
          }
        } catch (error) {
          console.log('Manual rate calculation failed:', error)
        }
      }

      console.log('Final OVE Price USD:', ovePriceUSD, 'from:', ovePriceSource)

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