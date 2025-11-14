'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import WalletModal from '@/components/WalletModal'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useWalletClient } from 'wagmi'
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers'
import { CONTRACT_ADDRESSES } from '@/lib/config'
import TokenSwapABI from '@/ABI/oveTokenSwapAbi/TokenSwapWithNativeBNB.json'
import Footer from '@/shared/Footer'
import { useLanguage } from '@/contexts/LanguageContext'
import toast, { Toaster } from 'react-hot-toast'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [feeAmount, setFeeAmount] = useState('')
  const [feeAmountUSDT, setFeeAmountUSDT] = useState('0')
  const [buyFee, setBuyFee] = useState('0')
  const [sellFee, setSellFee] = useState('0')
  const [bnbPriceUSD, setBnbPriceUSD] = useState('0') // Default BNB price
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false) // false: BNB→OVE, true: OVE→BNB
  const [isScrolled, setIsScrolled] = useState(false)
  const { isConnected, address } = useAccount()
  const { open } = useAppKit()
  const { data: walletClient } = useWalletClient()
  const { balances, isLoading: balancesLoading, refetch: refetchBalances } = useWalletBalance()
  const { t } = useLanguage()

  // Get balance for specific tokens
  const getBNBBalance = () => {
    const balance = balances.find(b => b.symbol === 'BNB')?.formattedBalance || '0.000 BNB'
    console.log('getBNBBalance called, returning:', balance)
    return balance
  }
  const getOVEBalance = () => balances.find(b => b.symbol === 'OVE')?.formattedBalance || '0 OVE'

  const handleWalletClick = () => {
    if (isConnected) {
      setIsModalOpen(true)
    } else {
      open()
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Get BNB price in USD from contract
  const fetchBNBPrice = useCallback(async () => {
    if (!walletClient) {
      console.log('No wallet client, keeping default BNB price: 600')
      return
    }

    try {
      const ethersProvider = new BrowserProvider(walletClient.transport)
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
  }, [walletClient])

  // Flip swap direction
  const handleFlipTokens = () => {
    setIsFlipped(!isFlipped)
    setFromAmount('')
    setToAmount('')
    setFeeAmount('')
    setFeeAmountUSDT('0')
  }

  // Fetch current fees
  const fetchFees = useCallback(async () => {
    if (!walletClient) return

    try {
      const ethersProvider = new BrowserProvider(walletClient.transport)
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
  }, [walletClient])

  // Calculate output amount with fees
  const calculateOutputAmount = useCallback(async (inputAmount: string) => {
    if (!inputAmount || !walletClient || parseFloat(inputAmount) <= 0) {
      setToAmount('')
      setFeeAmount('')
      return
    }

    setIsCalculating(true)
    try {
      const ethersProvider = new BrowserProvider(walletClient.transport)
      const swapContract = new Contract(CONTRACT_ADDRESSES.TOKEN_SWAP, TokenSwapABI.abi, ethersProvider)

      const amountIn = parseEther(inputAmount)
      let outputAmount, feeAmountWei

      if (isFlipped) {
        // OVE → BNB: selling OVE for BNB
        const result = await swapContract.calculateSellOVEWithFees(CONTRACT_ADDRESSES.NATIVE_BNB, amountIn)
        outputAmount = result[0] // tokenAmount
        feeAmountWei = result[1] // feeAmount
      } else {
        // BNB → OVE: buying OVE with BNB  
        const result = await swapContract.calculateBuyOVEWithFees(CONTRACT_ADDRESSES.NATIVE_BNB, amountIn)
        outputAmount = result[0] // oveAmount
        feeAmountWei = result[1] // feeAmount
      }

      const formattedOutput = formatEther(outputAmount)
      const formattedFee = formatEther(feeAmountWei)
      
      setToAmount(isFlipped ? parseFloat(formattedOutput).toFixed(4) : parseFloat(formattedOutput).toFixed(0))
      setFeeAmount(isFlipped ? parseFloat(formattedFee).toFixed(4) : parseFloat(formattedFee).toFixed(4))

      // Calculate fee in USDT
      let feeUSDT = '0'
      console.log('Fee calculation debug:', {
        formattedFee,
        bnbPriceUSD,
        isFlipped,
        feeAmountWei: feeAmountWei.toString()
      })
      
      if (parseFloat(formattedFee) > 0 && parseFloat(bnbPriceUSD) > 0) {
        // Fee is always in BNB for both directions, convert to USDT
        feeUSDT = (parseFloat(formattedFee) * parseFloat(bnbPriceUSD)).toFixed(4)
        console.log('Fee USDT calculated:', feeUSDT)
      } else {
        console.log('Fee USDT calculation skipped - conditions not met')
      }
      setFeeAmountUSDT(feeUSDT)

      console.log('Swap calculation with fees:', {
        direction: isFlipped ? 'OVE→BNB' : 'BNB→OVE',
        input: inputAmount,
        output: formattedOutput,
        fee: formattedFee,
        feeUSDT: feeUSDT,
        displayOutput: isFlipped ? parseFloat(formattedOutput).toFixed(4) : parseFloat(formattedOutput).toFixed(0)
      })
    } catch (error) {
      console.error('Error calculating output amount:', error)
      setToAmount('0')
      setFeeAmount('0')
      setFeeAmountUSDT('0')
    } finally {
      setIsCalculating(false)
    }
  }, [walletClient, isFlipped, bnbPriceUSD])

  // Handle input change
  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFromAmount(value)
    calculateOutputAmount(value)
  }

  // Fetch fees and BNB price when wallet client is available
  useEffect(() => {
    if (walletClient) {
      fetchFees()
      fetchBNBPrice()
    }
  }, [fetchFees, fetchBNBPrice, walletClient])

  // Debug effect to log state changes
  useEffect(() => {
    console.log('State update:', { bnbPriceUSD, feeAmountUSDT, feeAmount })
  }, [bnbPriceUSD, feeAmountUSDT, feeAmount])

  // Calculate when wallet client is available or swap direction changes
  useEffect(() => {
    if (fromAmount && walletClient) {
      calculateOutputAmount(fromAmount)
    }
  }, [calculateOutputAmount, fromAmount, walletClient])

  // Handle scroll effect for navigation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle swap transaction
  const handleSwap = async () => {
    if (!walletClient || !fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('❌ Please enter a valid amount', {
        duration: 3000,
        position: 'top-right',
      })
      return
    }

    if (!isConnected) {
      toast.error('❌ Please connect your wallet', {
        duration: 3000,
        position: 'top-right',
      })
      return
    }

    setIsSwapping(true)

    try {
      const ethersProvider = new BrowserProvider(walletClient.transport)
      const signer = await ethersProvider.getSigner()
      const swapContract = new Contract(CONTRACT_ADDRESSES.TOKEN_SWAP, TokenSwapABI.abi, signer)

      const amountIn = parseEther(fromAmount)

      console.log('Initiating swap:', {
        contract: CONTRACT_ADDRESSES.TOKEN_SWAP,
        direction: isFlipped ? 'OVE→BNB' : 'BNB→OVE',
        amount: fromAmount,
        amountInWei: amountIn.toString()
      })

      if (isFlipped) {
        // OVE → BNB: Selling OVE for BNB
        const IERC20ABI = (await import('@/ABI/oveTokenSwapAbi/IERC20.json')).default

        // First approve OVE tokens
        const oveContract = new Contract(CONTRACT_ADDRESSES.OVE_TOKEN, IERC20ABI.abi, signer)
        const approveTx = await oveContract.approve(CONTRACT_ADDRESSES.TOKEN_SWAP, amountIn)
        await approveTx.wait()

        // Then sell OVE for BNB
        const tx = await swapContract.sellOVE(CONTRACT_ADDRESSES.NATIVE_BNB, amountIn)
        console.log('Transaction sent:', tx.hash)

        const receipt = await tx.wait()
        console.log('Transaction confirmed:', receipt)

        // Show success toast
        toast.success(`🎉 Successfully sold ${fromAmount} OVE for ${toAmount} BNB!`, {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: 'bold',
          },
        })
      } else {
        // BNB → OVE: Buying OVE with BNB
        const tx = await swapContract.buyOVEWithBNB({
          value: amountIn
        })

        console.log('Transaction sent:', tx.hash)

        const receipt = await tx.wait()
        console.log('Transaction confirmed:', receipt)

        // Show success toast
        toast.success(`🎉 Successfully bought ${toAmount} OVE with ${fromAmount} BNB!`, {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: 'bold',
          },
        })
      }

      // Reset form after successful swap
      setFromAmount('')
      setToAmount('')
      setFeeAmount('')
      setFeeAmountUSDT('0')

      // Refresh balances instantly after successful transaction
      setTimeout(() => {
        refetchBalances()
      }, 1000) // Small delay to ensure transaction is fully processed on blockchain

    } catch (error: unknown) {
      console.error('Swap error:', error)
      
      // Parse error message to show user-friendly messages
      let errorMessage = t('error.swapFailed')
      
      if (error instanceof Error) {
        const errMsg = error.message.toLowerCase()
        
        // User rejected transaction
        if (errMsg.includes('user rejected') || errMsg.includes('user denied') || errMsg.includes('action_rejected')) {
          errorMessage = 'Transaction cancelled by user'
        }
        // Insufficient balance
        else if (errMsg.includes('insufficient funds') || errMsg.includes('insufficient balance')) {
          errorMessage = 'Insufficient balance for this transaction'
        }
        // Gas estimation failed
        else if (errMsg.includes('gas') && errMsg.includes('estimation')) {
          errorMessage = 'Transaction may fail. Please check your balance and try again'
        }
        // Network error
        else if (errMsg.includes('network') || errMsg.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection'
        }
        // Contract error
        else if (errMsg.includes('execution reverted')) {
          errorMessage = 'Transaction failed. Please check token allowance and liquidity'
        }
        // Generic error - show first 100 chars only
        else {
          errorMessage = error.message.length > 100 
            ? error.message.substring(0, 100) + '...' 
            : error.message
        }
      }
      
      // Show error toast
      toast.error(`❌ ${errorMessage}`, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: 'bold',
        },
      })
    } finally {
      setIsSwapping(false)
    }
  }

  

  return (
    <div className="min-h-screen">
      {/* React Hot Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontSize: '14px',
            maxWidth: '400px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Premium Fixed Header */}
      <header className={`fixed-nav ${isScrolled ? 'nav-scrolled' : 'glass'} border-0 ${isScrolled ? 'border-b border-white/10' : ''}`}>
        <div className="mx-4 md:mx-6 lg:mx-7 xl:mx-12 sm:px-6 lg:px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center group cursor-pointer">
              <div className="relative mr-3 lg:mr-4">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

                {/* Logo container */}
                <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-[1px] transform group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-xl bg-black/50 backdrop-blur-xl flex items-center justify-center">
                    <span className="text-white font-black text-lg lg:text-xl">O</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <h1 className="text-xl lg:text-2xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                    OVE
                  </span>
                  <span className="text-white/40 font-light ml-2 hidden sm:inline">
                    {t('nav.platform')}
                  </span>
                </h1>
                <span className="text-[10px] lg:text-xs text-white/40 font-medium tracking-wider uppercase hidden lg:block">
                  {t('nav.defi')}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">

              </nav>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Wallet Connect Button */}
              <button
                onClick={handleWalletClick}
                className={`relative group overflow-hidden transition-all duration-300 ${isConnected
                  ? 'px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg lg:rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/30'
                  : 'px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg lg:rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 hover:border-white/20'
                  }`}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isConnected
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20'
                  : 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20'
                  }`} />

                {/* Button content */}
                <div className="relative flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 font-semibold text-sm lg:text-base">
                        {address ? formatAddress(address) : t('nav.connected')}
                      </span>
                      {/* Dropdown arrow */}
                      <svg className="w-3 h-3 text-green-400/60 transform group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold text-sm lg:text-base">
                        {t('nav.connectWallet')}
                      </span>
                      {/* Wallet icon */}
                      <svg className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </>
                  )}
                </div>

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 transform -skew-x-12 -translate-x-full" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Wallet Modal */}
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Premium Hero Section */}
      <div className="content-with-nav mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center animate-fade-in-up">
            {/* Floating Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10">
              <div className="mb-8">
                <span className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-full text-white/90 font-semibold text-sm uppercase tracking-wide border border-white/20">
                  {t('hero.badge')}
                </span>
              </div>

              <h1 className="text-hero text-glow mb-8 tracking-tight">
                {t('hero.welcome')}{' '}
                <span className="text-premium">
                  {t('hero.platform')}
                </span>
              </h1>

              <p className="text-subtitle text-white/90 mb-12 max-w-4xl mx-auto">
                {t('hero.description')}
              </p>

              {!isConnected && (
                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20 items-center">
                  <button
                    onClick={handleWalletClick}
                    className="btn-premium text-xl px-12 py-4 hover-lift float-animation"
                  >
                    {t('hero.getStarted')}
                  </button>

                </div>
              )}

              {/* Moving Trust Indicators Marquee */}
              <div className="relative overflow-hidden py-20">
                <div className="marquee-container">
                  <div className="marquee-content">
                    <div className="flex items-center space-x-16 text-white/80 text-lg font-semibold">
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.secure')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.fastSpeed')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.lowFees')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.decentralized')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.crossChain')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.trading247')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.nonCustodial')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.openSource')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.realTime')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.globalAccess')}</span>
                      </div>
                    </div>
                    {/* Duplicate for seamless loop */}
                    <div className="flex items-center space-x-16 text-white/80 text-lg font-semibold">
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.secure')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.fastSpeed')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.lowFees')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.decentralized')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.crossChain')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.trading247')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.nonCustodial')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.openSource')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.realTime')}</span>
                      </div>
                      <div className="flex items-center space-x-3 whitespace-nowrap">
                        <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        <span>{t('trust.globalAccess')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Gradient Swap Interface - Show when wallet is connected */}
      {isConnected && (
        <div className="max-w-7xl mx-auto px-4 mb-32">
          <div className={`transition-all duration-700 ease-in-out ${
            fromAmount && toAmount && feeAmount 
              ? 'grid lg:grid-cols-3 gap-8 items-start' 
              : 'flex justify-center'
          }`}>
            {/* Main Swap Interface */}
            <div className={`transition-all duration-700 ease-in-out ${
              fromAmount && toAmount && feeAmount 
                ? 'lg:col-span-2' 
                : 'w-full max-w-2xl'
            }`}>
              <div className="swap-modal-live p-8 animate-slide-in-right perspective-card">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white text-glow">{t('swap.title')}</h2>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-400/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-soft"></div>
                      <span className="text-green-300 font-semibold text-sm">{t('swap.liveRates')}</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/20 rounded-full border border-blue-400/30">
                      <span className="text-blue-300 font-semibold text-sm">
                        Fee: {isFlipped ? sellFee : buyFee}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* From Token */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-base font-bold text-white/90 uppercase tracking-wide">{t('swap.from')}</label>
                    <span className="text-white/70 text-sm">
                      {t('swap.balance')}: {balancesLoading ? (
                        <div className="inline-block w-16 h-4 bg-white/20 rounded animate-pulse"></div>
                      ) : (
                        <span className="font-semibold text-white">{isFlipped ? getOVEBalance() : getBNBBalance()}</span>
                      )}
                    </span>
                  </div>
                  <div className="relative group">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={fromAmount}
                      onChange={handleFromAmountChange}
                      className="input-premium w-full pr-32 text-xl font-bold card-3d"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {isFlipped ? 'OVE' : 'BNB'}
                        </div>
                      </div>
                      <div className={`token-icon w-8 h-8 ${isFlipped ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                        }`}>
                        <span className={`text-xs font-bold ${isFlipped ? 'text-white' : 'text-gray-800'}`}>
                          {isFlipped ? 'O' : 'B'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Swap Arrow */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={handleFlipTokens}
                    className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>

                {/* To Token */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-base font-bold text-white/90 uppercase tracking-wide">{t('swap.to')}</label>
                    <span className="text-white/70 text-sm">
                      {t('swap.balance')}: {balancesLoading ? (
                        <div className="inline-block w-14 h-3 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <span className="font-semibold text-white">{isFlipped ? getBNBBalance() : getOVEBalance()}</span>
                      )}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={isCalculating ? t('swap.calculating') : toAmount}
                      readOnly
                      className="input-primary w-full pr-32 text-xl font-semibold bg-gray-50/50 cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {isFlipped ? 'BNB' : 'OVE'}
                        </div>
                      </div>
                      <div className={`token-icon w-8 h-8 ${isFlipped ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-orange-400 to-red-500'
                        }`}>
                        <span className={`text-xs font-bold ${isFlipped ? 'text-gray-800' : 'text-white'}`}>
                          {isFlipped ? 'B' : 'O'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Swap Button */}
                <button
                  onClick={handleSwap}
                  disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0 || !isConnected}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  {isSwapping ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-3"></div>
                      {t('swap.swapping')}
                    </div>
                  ) : (
                    t(isFlipped ? 'swap.oveToBnb' : 'swap.bnbToOve')
                  )}
                </button>
              </div>
            </div>

            {/* Sidebar - Transaction Summary & Info - Only show when there's transaction data */}
            {fromAmount && toAmount && feeAmount && (
              <div className="space-y-6 animate-slide-in-left">
                {/* Transaction Summary */}
                <div className="card p-6 transform transition-all duration-500 hover:scale-105">
                  <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Transaction Summary
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg transform transition-all duration-300 hover:bg-gray-100">
                      <span className="text-gray-600 font-medium">You pay:</span>
                      <span className="font-bold text-gray-800">{fromAmount} {isFlipped ? 'OVE' : 'BNB'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200 transform transition-all duration-300 hover:bg-orange-100">
                      <span className="text-gray-600 font-medium">Trading fee ({isFlipped ? sellFee : buyFee}%):</span>
                      <div className="text-right">
                        <span className="font-bold text-orange-600">
                          {parseFloat(feeAmountUSDT) > 0 ? `$${feeAmountUSDT} USDT` : `${feeAmount} ${isFlipped ? 'BNB' : 'OVE'}`}
                        </span>
                        {parseFloat(feeAmountUSDT) > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {feeAmount} {isFlipped ? 'BNB' : 'OVE'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200 transform transition-all duration-300 hover:bg-green-100">
                      <span className="text-gray-600 font-medium">You receive:</span>
                      <span className="font-bold text-green-600 text-lg">{toAmount} {isFlipped ? 'BNB' : 'OVE'}</span>
                    </div>
                  </div>
                </div>

                {/* Trading Info */}
                <div className="card p-6 transform transition-all duration-500 hover:scale-105">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Trading Info
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white">Network:</span>
                      <span className="font-semibold text-white">BSC Testnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Slippage:</span>
                      <span className="font-semibold text-white">0.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Min. received:</span>
                      <span className="font-semibold text-white">{toAmount ? (parseFloat(toAmount) * 0.995).toFixed(4) : '0'} {isFlipped ? 'BNB' : 'OVE'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-5">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-glow mb-6">{t('features.title')}</h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            {t('features.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          <div className="card p-10 text-center group animate-fade-in-up hover-lift" style={{ animationDelay: '0.1s' }}>
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 neon-glow">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-6 text-glow">{t('features.secureWallet.title')}</h3>
            <p className="text-white/80 leading-relaxed text-lg">
              {t('features.secureWallet.description')}
            </p>
          </div>

          <div className="card p-10 text-center group animate-fade-in-up hover-lift" style={{ animationDelay: '0.2s' }}>
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 neon-glow">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-6 text-glow">{t('features.tokenSwaps.title')}</h3>
            <p className="text-white/80 leading-relaxed text-lg">
              {t('features.tokenSwaps.description')}
            </p>
          </div>

          <div className="card p-10 text-center group animate-fade-in-up hover-lift" style={{ animationDelay: '0.3s' }}>
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-violet-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 neon-glow">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-6 text-glow">{t('features.fastReliable.title')}</h3>
            <p className="text-white/80 leading-relaxed text-lg">
              {t('features.fastReliable.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Premium Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-20">
        <div className="card p-16 text-center hover-glow">
          <div className="mb-12">
            <h3 className="text-5xl font-bold text-white mb-6 text-glow">{t('stats.title')}</h3>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              {t('stats.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            <div className="text-center group hover-lift">
              <div className="mb-6">
                <div className="text-6xl font-black text-premium mb-4 group-hover:scale-110 transition-transform duration-300">$2.5M+</div>
                <div className="text-2xl text-white/90 font-semibold uppercase tracking-wider">{t('stats.totalVolume')}</div>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4"></div>
              </div>
            </div>

            <div className="text-center group hover-lift">
              <div className="mb-6">
                <div className="text-6xl font-black text-premium mb-4 group-hover:scale-110 transition-transform duration-300">15,000+</div>
                <div className="text-2xl text-white/90 font-semibold uppercase tracking-wider">{t('stats.transactions')}</div>
                <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mt-4"></div>
              </div>
            </div>

            <div className="text-center group hover-lift">
              <div className="mb-6">
                <div className="text-6xl font-black text-premium mb-4 group-hover:scale-110 transition-transform duration-300">99.9%</div>
                <div className="text-2xl text-white/90 font-semibold uppercase tracking-wider">{t('stats.uptime')}</div>
                <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mt-4"></div>
              </div>
            </div>
          </div>

          {/* Additional metrics */}
          <div className="mt-16 pt-12 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-white/70 text-sm uppercase tracking-wide">{t('stats.support')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">0.1%</div>
                <div className="text-white/70 text-sm uppercase tracking-wide">{t('stats.fees')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">5s</div>
                <div className="text-white/70 text-sm uppercase tracking-wide">{t('stats.avgSpeed')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">100%</div>
                <div className="text-white/70 text-sm uppercase tracking-wide">{t('stats.secure')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

    </div >

  )
}
