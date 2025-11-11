import { CustomWallet } from '@/components/CustomWallet'
import Link from 'next/link'

export default function WalletPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      {/* Header */}
      <header className="glass border-0 border-b border-white/20 sticky top-0 z-50 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <Link href="/" className="text-2xl font-bold gradient-text hover:opacity-80 transition-opacity">
                OVE Platform
              </Link>
            </div>
            <nav className="flex space-x-6">
              <Link href="/wallet" className="text-white font-semibold">
                Wallet
              </Link>
              <Link href="/swap" className="text-white/80 hover:text-white transition-colors font-medium">
                Token Swap
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            OVE{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Wallet
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Secure wallet connection for the OVE ecosystem. Connect your wallet to access your tokens, 
            manage your account, and explore decentralized opportunities.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Wallet Connection */}
          <div className="animate-slide-in-right">
            <CustomWallet />
          </div>

          {/* Features */}
          <div className="space-y-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="card p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Wallet Features</h3>
              <div className="space-y-6">
                <div className="flex items-start group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Secure Connection</h4>
                    <p className="text-gray-600 leading-relaxed">Your wallet connection is encrypted with enterprise-grade security protocols</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Real-time Balance</h4>
                    <p className="text-gray-600 leading-relaxed">Track your OVE tokens and other crypto assets with live price updates</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Multi-Network Support</h4>
                    <p className="text-gray-600 leading-relaxed">Seamlessly connect across multiple blockchain networks and protocols</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Mobile Optimized</h4>
                    <p className="text-gray-600 leading-relaxed">Responsive design that works perfectly on all devices and screen sizes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Supported Wallets</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50 rounded-2xl group hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="text-3xl mb-2">🦊</div>
                  <div className="text-sm font-semibold text-gray-800">MetaMask</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 rounded-2xl group hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="text-3xl mb-2">🛡️</div>
                  <div className="text-sm font-semibold text-gray-800">Trust Wallet</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/50 rounded-2xl group hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="text-3xl mb-2">🔵</div>
                  <div className="text-sm font-semibold text-gray-800">Coinbase</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200/50 rounded-2xl group hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="text-3xl mb-2">🌈</div>
                  <div className="text-sm font-semibold text-gray-800">Rainbow</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200/50 rounded-2xl group hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="text-3xl mb-2">📱</div>
                  <div className="text-sm font-semibold text-gray-800">WalletConnect</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50 rounded-2xl group hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="text-3xl mb-2">➕</div>
                  <div className="text-sm font-semibold text-gray-800">And More...</div>
                </div>
              </div>
              <div className="text-center mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="text-sm font-medium text-gray-600">
                  🚀 New wallet integrations added regularly
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}