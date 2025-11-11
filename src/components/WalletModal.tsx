'use client'

import React, { useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { useWalletBalance } from '@/hooks/useWalletBalance'
import { useLanguage } from '@/contexts/LanguageContext'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const { balances, isLoading: balancesLoading } = useWalletBalance()
  const { t } = useLanguage()

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '15px' // Compensate for scrollbar
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleActivity = () => {
    open({ view: 'Account' })
    onClose()
  }

  const handleDisconnect = () => {
    disconnect()
    onClose()
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Get BNB balance for display
  const getBNBBalance = () => {
    const bnbBalance = balances.find(b => b.symbol === 'BNB')
    if (!bnbBalance) return '0.000'
    return bnbBalance.formattedBalance
  }

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-[9998] animate-fade-in-up"
        onClick={onClose}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh',
          overflow: 'hidden'
        }}
      />

      {/* Modal Container - Fixed positioning with scroll prevention */}
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh',
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
      >
        <div 
          className="w-[480px] max-w-[90vw] max-h-[90vh] glass-dark rounded-3xl shadow-2xl text-white overflow-hidden animate-slide-in-right"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Header */}
          <div className="relative p-6 text-center">
            {/* Close button - Enhanced */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/10 hover:scale-110 group z-10"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Wallet Status - Enhanced */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200">
                <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white font-bold text-lg">O</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-3 gradient-text">{t('wallet.title')}</h2>
              {isConnected && address && (
                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors">
                  <p className="text-white/80 text-sm font-mono">{formatAddress(address)}</p>
                </div>
              )}
            </div>

            {/* Balance Display - Enhanced */}
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/8 transition-colors">
              <div className="text-4xl font-bold mb-2 text-white">
                {balancesLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  getBNBBalance()
                )}
              </div>
              <div className="text-white/60 text-sm uppercase tracking-wide font-semibold">{t('wallet.currentBalance')}</div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-6 pb-6 space-y-4">
            <button
              onClick={handleActivity}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-200 transform hover:scale-[1.02] backdrop-blur-sm group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-semibold text-white">{t('wallet.activity')}</span>
              </div>
              <svg className="w-5 h-5 text-white/60 group-hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center space-x-4 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/20 hover:from-red-500/30 hover:to-red-600/30 transition-all duration-200 transform hover:scale-[1.02] backdrop-blur-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="font-semibold text-white">{t('wallet.disconnect')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}