'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWalletClient } from 'wagmi'
import { BrowserProvider, Contract, formatEther } from 'ethers'
import { CONTRACT_ADDRESSES } from '@/lib/config'
import IERC20ABI from '@/ABI/oveTokenSwapAbi/IERC20.json'

interface TokenBalance {
  symbol: string
  balance: string
  formattedBalance: string
}

export function useWalletBalance() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [balances, setBalances] = useState<TokenBalance[]>([
    { symbol: 'BNB', balance: '0', formattedBalance: '0.000 BNB' },
    { symbol: 'OVE', balance: '0', formattedBalance: '0 OVE' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalances = async () => {
    if (!isConnected || !address || !walletClient) {
      console.log('Balance fetch skipped - not connected or missing data:', { isConnected, address: !!address, walletClient: !!walletClient })
      setBalances([
        { symbol: 'BNB', balance: '0', formattedBalance: '0.000 BNB' },
        { symbol: 'OVE', balance: '0', formattedBalance: '0 OVE' }
      ])
      return
    }

    console.log('Fetching balances for address:', address)
    setIsLoading(true)
    setError(null)

    try {
      const ethersProvider = new BrowserProvider(walletClient.transport)

      // Get BNB balance
      console.log('Fetching BNB balance...')
      const bnbBalance = await ethersProvider.getBalance(address)
      const bnbFormatted = formatEther(bnbBalance)
      const bnbDisplay = parseFloat(bnbFormatted).toFixed(3)
      console.log('BNB Balance:', { raw: bnbBalance.toString(), formatted: bnbFormatted, display: bnbDisplay })

      // Get OVE balance
      console.log('Fetching OVE balance...')
      const oveContract = new Contract(CONTRACT_ADDRESSES.OVE_TOKEN, IERC20ABI.abi, ethersProvider)
      const oveBalance = await oveContract.balanceOf(address)
      const oveFormatted = formatEther(oveBalance)
      const oveDisplay = parseFloat(oveFormatted).toFixed(0)
      console.log('OVE Balance:', { raw: oveBalance.toString(), formatted: oveFormatted, display: oveDisplay })

      const newBalances = [
        { 
          symbol: 'BNB', 
          balance: bnbFormatted, 
          formattedBalance: `${bnbDisplay} BNB` 
        },
        { 
          symbol: 'OVE', 
          balance: oveFormatted, 
          formattedBalance: `${oveDisplay} OVE` 
        }
      ]
      
      console.log('Setting new balances:', newBalances)
      setBalances(newBalances)

    } catch (error) {
      console.error('Error fetching wallet balances:', error)
      setError('Failed to fetch wallet balances')
      // Keep zero balances on error
      setBalances([
        { symbol: 'BNB', balance: '0', formattedBalance: '0.000 BNB' },
        { symbol: 'OVE', balance: '0', formattedBalance: '0 OVE' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('useWalletBalance useEffect triggered:', { isConnected, address, walletClient: !!walletClient })
    fetchBalances()
  }, [isConnected, address, walletClient])

  return { balances, isLoading, error, refetch: fetchBalances }
}