/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, Contract, formatEther, parseEther, Eip1193Provider } from 'ethers'
import { CONTRACT_ADDRESSES } from '@/lib/config'
import TokenSwapABI from '@/ABI/oveTokenSwapAbi/TokenSwapWithNativeBNB.json'
import IERC20ABI from '@/ABI/oveTokenSwapAbi/IERC20.json'

// BSC Testnet Chain ID
const BSC_TESTNET_CHAIN_ID = 97
const BSC_TESTNET_CONFIG = {
  chainId: '0x61', // 97 in hex
  chainName: 'BSC Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com/'],
}

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  isNative?: boolean
}

const SUPPORTED_TOKENS: Token[] = [
  {
    address: CONTRACT_ADDRESSES.NATIVE_BNB,
    symbol: 'BNB',
    name: 'Binance Coin',
    decimals: 18,
    isNative: true
  },
  {
    address: CONTRACT_ADDRESSES.OVE_TOKEN,
    symbol: 'OVE',
    name: 'OVE Token',
    decimals: 18
  }
]

export default function SwapInterface() {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  
  const [fromToken, setFromToken] = useState<Token>(SUPPORTED_TOKENS[0])
  const [toToken, setToToken] = useState<Token>(SUPPORTED_TOKENS[1])
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [feeAmount, setFeeAmount] = useState('')
  const [feeAmountUSDT, setFeeAmountUSDT] = useState('0')
  const [buyFee, setBuyFee] = useState('0')
  const [sellFee, setSellFee] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState('0')
  const [exchangeRate, setExchangeRate] = useState('0')
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)
  const [bnbPriceUSD, setBnbPriceUSD] = useState('600') // Default BNB price

  // Check current network
  const checkNetwork = useCallback(async () => {
    if (!walletProvider) return

    try {
      const ethersProvider = new BrowserProvider(walletProvider as Eip1193Provider)
      const network = await ethersProvider.getNetwork()
      setCurrentChainId(Number(network.chainId))
    } catch (error) {
      console.error('Error checking network:', error)
      setCurrentChainId(null)
    }
  }, [walletProvider])

  // Switch to BSC Testnet
  const switchToBSCTestnet = async () => {
    if (!walletProvider) return

    try {
      // Try to switch to BSC Testnet
      await (walletProvider as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_TESTNET_CONFIG.chainId }],
      })
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await (walletProvider as any).request({
            method: 'wallet_addEthereumChain',
            params: [BSC_TESTNET_CONFIG],
          })
        } catch (addError) {
          console.error('Error adding BSC Testnet:', addError)
        }
      } else {
        console.error('Error switching to BSC Testnet:', switchError)
      }
    }
  }

  // Get BNB price in USD from contract
  const fetchBNBPrice = useCallback(async () => {
    if (!walletProvider) {
      console.log('No wallet provider, keeping default BNB price: 600')
      return
    }

    try {
      const ethersProvider = new BrowserProvider(walletProvider as Eip1193Provider)
      const swapContract = new Contract(CONTRACT_ADDRESSES.TOKEN_SWAP, TokenSwapABI.abi, ethersProvider)
      
      // Get BNB price from contract's price feed
      const bnbPriceWei = await swapContract.getTokenPriceInUSD(CONTRACT_ADDRESSES.NATIVE_BNB)
      // Price is returned in 8 decimals (like Chainlink), convert to USD
      const bnbPrice = Number(bnbPriceWei) / 100000000 // 8 decimals
      
      if (bnbPrice > 0) {
        console.log('BNB Price fetched from contract:', bnbPrice)
        setBnbPriceUSD(bnbPrice.toString())
      } else {
        console.log('Invalid BNB price from contract, keeping default: 600')
      }
    } catch (error) {
      console.error('Error fetching BNB price from contract:', error)
      // Keep the default price (600) - don't override it
      console.log('Keeping default BNB price: 600')
    }
  }, [walletProvider])

  // Get user balance
  const fetchBalance = useCallback(async () => {
    if (!isConnected || !address || !walletProvider) return

    try {
      const ethersProvider = new BrowserProvider(walletProvider as Eip1193Provider)
      
      if (fromToken.isNative) {
        const balance = await ethersProvider.getBalance(address)
        setBalance(formatEther(balance))
      } else {
        const tokenContract = new Contract(fromToken.address, IERC20ABI.abi, ethersProvider)
        const balance = await tokenContract.balanceOf(address)
        setBalance(formatEther(balance))
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance('0')
    }
  }, [isConnected, address, walletProvider, fromToken.isNative, fromToken.address])

  // Fetch current fees
  const fetchFees = useCallback(async () => {
    if (!walletProvider) return

    try {
      const ethersProvider = new BrowserProvider(walletProvider as Eip1193Provider)
      const swapContract = new Contract(CONTRACT_ADDRESSES.TOKEN_SWAP, TokenSwapABI.abi, ethersProvider)

      const [buyFeeBPS, sellFeeBPS] = await Promise.all([
        swapContract.swapFeeBuyBPS(),
        swapContract.swapFeeSellBPS()
      ])

      setBuyFee((Number(buyFeeBPS) / 100).toString()) // Convert BPS to percentage
      setSellFee((Number(sellFeeBPS) / 100).toString())
    } catch (error) {
      console.error('Error fetching fees:', error)
    }
  }, [walletProvider])

  // Get exchange rate and calculate output amount with fees
  const calculateOutputAmount = useCallback(async () => {
    if (!fromAmount || !walletProvider || parseFloat(fromAmount) <= 0) {
      setToAmount('')
      setFeeAmount('')
      return
    }

    try {
      const ethersProvider = new BrowserProvider(walletProvider as Eip1193Provider)
      const swapContract = new Contract(CONTRACT_ADDRESSES.TOKEN_SWAP, TokenSwapABI.abi, ethersProvider)
      
      const amountIn = parseEther(fromAmount)
      let outputAmount, feeAmountWei

      if (fromToken.symbol === 'OVE') {
        // Selling OVE for other token
        const result = await swapContract.calculateSellOVEWithFees(toToken.address, amountIn)
        outputAmount = result[0] // tokenAmount
        feeAmountWei = result[1] // feeAmount
      } else {
        // Buying OVE with other token
        const result = await swapContract.calculateBuyOVEWithFees(fromToken.address, amountIn)
        outputAmount = result[0] // oveAmount
        feeAmountWei = result[1] // feeAmount
      }

      const formattedOutput = formatEther(outputAmount)
      const formattedFee = formatEther(feeAmountWei)
      
      setToAmount(formattedOutput)
      setFeeAmount(formattedFee)
      
      // Calculate fee in USDT
      let feeUSDT = '0'
      console.log('Fee calculation debug:', {
        formattedFee,
        bnbPriceUSD,
        fromTokenSymbol: fromToken.symbol,
        feeAmountWei: feeAmountWei.toString()
      })
      
      if (parseFloat(formattedFee) > 0 && parseFloat(bnbPriceUSD) > 0) {
        if (fromToken.symbol === 'OVE') {
          // For OVE->BNB swaps, fee is in BNB, convert to USDT
          feeUSDT = (parseFloat(formattedFee) * parseFloat(bnbPriceUSD)).toFixed(4)
        } else {
          // For BNB->OVE swaps, fee is in BNB, convert to USDT
          feeUSDT = (parseFloat(formattedFee) * parseFloat(bnbPriceUSD)).toFixed(4)
        }
        console.log('Fee USDT calculated:', feeUSDT)
      } else {
        console.log('Fee USDT calculation skipped - conditions not met')
      }
      setFeeAmountUSDT(feeUSDT)
      
      // Calculate exchange rate
      const rate = parseFloat(formattedOutput) / parseFloat(fromAmount)
      setExchangeRate(rate.toFixed(6))
    } catch (error) {
      console.error('Error calculating output amount:', error)
      setToAmount('0')
      setFeeAmount('0')
      setFeeAmountUSDT('0')
      setExchangeRate('0')
    }
  }, [fromAmount, walletProvider, fromToken.symbol, fromToken.address, toToken.address, bnbPriceUSD])

  // Handle swap
  const handleSwap = async () => {
    if (!isConnected || !address || !walletProvider || !fromAmount) {
      alert('Please connect wallet and enter amount')
      return
    }

    setIsLoading(true)
    try {
      const ethersProvider = new BrowserProvider(walletProvider as Eip1193Provider)
      const signer = await ethersProvider.getSigner()
      const swapContract = new Contract(CONTRACT_ADDRESSES.TOKEN_SWAP, TokenSwapABI.abi, signer)
      
      const amountIn = parseEther(fromAmount)

      if (fromToken.symbol === 'OVE') {
        // Selling OVE for other token
        // First approve OVE tokens
        const oveContract = new Contract(CONTRACT_ADDRESSES.OVE_TOKEN, IERC20ABI.abi, signer)
        const approveTx = await oveContract.approve(CONTRACT_ADDRESSES.TOKEN_SWAP, amountIn)
        await approveTx.wait()
        
        // Then sell OVE
        const sellTx = await swapContract.sellOVE(toToken.address, amountIn)
        await sellTx.wait()
        
        alert('OVE sold successfully!')
      } else {
        // Buying OVE with other token
        if (fromToken.isNative) {
          // Buying with native BNB
          const buyTx = await swapContract.buyOVEWithBNB({ value: amountIn })
          await buyTx.wait()
        } else {
          // Buying with ERC20 token
          const tokenContract = new Contract(fromToken.address, IERC20ABI.abi, signer)
          const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.TOKEN_SWAP, amountIn)
          await approveTx.wait()
          
          const buyTx = await swapContract.buyOVE(fromToken.address, amountIn)
          await buyTx.wait()
        }
        
        alert('OVE purchased successfully!')
      }

      // Reset form
      setFromAmount('')
      setToAmount('')
      setFeeAmount('')
      setFeeAmountUSDT('0')
      fetchBalance()
    } catch (error: unknown) {
      console.error('Swap error:', error)
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Switch tokens
  const switchTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
    setFeeAmount('')
    setFeeAmountUSDT('0')
  }

  useEffect(() => {
    checkNetwork()
    fetchBalance()
    fetchFees()
    fetchBNBPrice()
  }, [checkNetwork, fetchBalance, fetchFees, fetchBNBPrice])

  // Debug effect to log state changes
  useEffect(() => {
    console.log('State update:', { bnbPriceUSD, feeAmountUSDT, feeAmount })
  }, [bnbPriceUSD, feeAmountUSDT, feeAmount])

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateOutputAmount()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [calculateOutputAmount])

  if (!isConnected) {
    return (
      <div className="card p-8 text-center animate-fade-in-up">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Connect your wallet to start swapping tokens and accessing the full OVE ecosystem
        </p>
        <appkit-button />
      </div>
    )
  }

  const isWrongNetwork = currentChainId !== null && currentChainId !== BSC_TESTNET_CHAIN_ID

  return (
    <div className="card p-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Swap Tokens</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-soft"></div>
            <span>Live Rates</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <span>Fee: {fromToken.symbol === 'OVE' ? sellFee : buyFee}%</span>
          </div>
        </div>
      </div>

      {/* Network Warning */}
      {isWrongNetwork && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800">Wrong Network</h4>
                <p className="text-sm text-yellow-700">Please switch to BSC Testnet to use the swap</p>
              </div>
            </div>
            <button
              onClick={switchToBSCTestnet}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              Switch Network
            </button>
          </div>
        </div>
      )}

      {/* From Token */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">From</label>
          <span className="text-sm text-gray-500">
            Balance: <span className="font-medium">{parseFloat(balance).toFixed(4)} {fromToken.symbol}</span>
          </span>
        </div>
        <div className="relative group">
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            className="input-primary w-full pr-32 text-lg font-semibold"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-3">
            <select
              value={fromToken.address}
              onChange={(e) => {
                const token = SUPPORTED_TOKENS.find(t => t.address === e.target.value)
                if (token) setFromToken(token)
              }}
              className="bg-white/80 border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold outline-none hover:border-gray-400 transition-colors"
            >
              {SUPPORTED_TOKENS.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <div className={`token-icon w-10 h-10 ${
              fromToken.symbol === 'BNB' 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                : 'bg-gradient-to-r from-orange-400 to-red-500'
            }`}>
              <span className={`text-sm font-bold ${
                fromToken.symbol === 'BNB' ? 'text-gray-800' : 'text-white'
              }`}>
                {fromToken.symbol === 'BNB' ? 'B' : 'O'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setFromAmount(balance)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Use Max Balance
        </button>
      </div>

      {/* Switch Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={switchTokens}
          className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To Token */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">To (Estimated)</label>
          {exchangeRate !== '0' && (
            <span className="text-sm text-gray-500 font-medium">
              Rate: 1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="number"
            value={toAmount}
            readOnly
            placeholder="0.0"
            className="input-primary w-full pr-32 text-lg font-semibold bg-gray-50/50 cursor-not-allowed"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-3">
            <select
              value={toToken.address}
              onChange={(e) => {
                const token = SUPPORTED_TOKENS.find(t => t.address === e.target.value)
                if (token) setToToken(token)
              }}
              className="bg-white/80 border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold outline-none hover:border-gray-400 transition-colors"
            >
              {SUPPORTED_TOKENS.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <div className={`token-icon w-10 h-10 ${
              toToken.symbol === 'BNB' 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                : 'bg-gradient-to-r from-orange-400 to-red-500'
            }`}>
              <span className={`text-sm font-bold ${
                toToken.symbol === 'BNB' ? 'text-gray-800' : 'text-white'
              }`}>
                {toToken.symbol === 'BNB' ? 'B' : 'O'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={isLoading || !fromAmount || parseFloat(fromAmount) <= 0 || isWrongNetwork}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
      >
        {isWrongNetwork ? (
          'Switch to BSC Testnet'
        ) : isLoading ? (
          <div className="flex items-center justify-center">
            <div className="loading-spinner mr-3"></div>
            Swapping...
          </div>
        ) : (
          'Swap Tokens'
        )}
      </button>

      {/* Transaction Info */}
      {toAmount && (
        <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200/50">
          <h4 className="font-semibold text-gray-800 mb-4">Transaction Summary</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">You pay:</span>
              <span className="font-semibold text-gray-800">{fromAmount} {fromToken.symbol}</span>
            </div>
            {feeAmount && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trading fee ({fromToken.symbol === 'OVE' ? sellFee : buyFee}%):</span>
                <div className="text-right">
                  <span className="font-semibold text-orange-600">
                    {parseFloat(feeAmountUSDT) > 0 ? `$${feeAmountUSDT} USDT` : `${parseFloat(feeAmount).toFixed(6)} ${fromToken.symbol === 'OVE' ? toToken.symbol : fromToken.symbol}`}
                  </span>
                  <div className="text-xs text-gray-500">
                    {parseFloat(feeAmountUSDT) > 0 && `${parseFloat(feeAmount).toFixed(6)} ${fromToken.symbol === 'OVE' ? toToken.symbol : fromToken.symbol}`}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">You receive:</span>
              <span className="font-semibold text-green-600">{parseFloat(toAmount).toFixed(6)} {toToken.symbol}</span>
            </div>
            {exchangeRate !== '0' && (
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-gray-600">Exchange rate:</span>
                <span className="font-semibold text-gray-800">1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}