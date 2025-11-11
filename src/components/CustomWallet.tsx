'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import "@reown/appkit-wallet-button/react"

export function CustomWallet() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()

  if (isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 w-full mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ove Wallet</h2>
          <p className="text-sm text-gray-600 break-all">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => open({ view: 'Account' })}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">💰</span>
              <span className="text-gray-700">View Balance</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={() => open({ view: 'Networks' })}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">🌐</span>
              <span className="text-gray-700">Switch Network</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={() => open({ view: 'Account' })}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">📋</span>
              <span className="text-gray-700">Activity</span>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={() => disconnect()}
            className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔌</span>
              <span>Disconnect</span>
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Choose your preferred wallet to get started</p>
      </div>

      <div className="space-y-4">
        {/* Popular Wallets */}
        <div className="grid grid-cols-2 gap-3">
          <appkit-wallet-button wallet="metamask" />
          <appkit-wallet-button wallet="trust" />
          <appkit-wallet-button wallet="coinbase" />
          <appkit-wallet-button wallet="rainbow" />
        </div>

        {/* WalletConnect QR */}
        <div className="border-t pt-4">
          <appkit-wallet-button wallet="walletConnect" />
        </div>

        {/* Social Logins */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-3 text-center">Or connect with social</p>
          <div className="grid grid-cols-2 gap-3">
            <appkit-wallet-button wallet="google" />
            <appkit-wallet-button wallet="github" />
          </div>
        </div>

        {/* More Wallets Button */}
        <button
          onClick={() => open()}
          className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        >
          View All Wallets
        </button>
      </div>
    </div>
  )
}