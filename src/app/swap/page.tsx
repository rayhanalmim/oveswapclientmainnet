import SwapInterface from '@/components/SwapInterface'
import Link from 'next/link'

export default function SwapPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-0 border-b border-white/20 sticky top-0 z-50">
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
              <Link href="/wallet" className="text-white/80 hover:text-white transition-colors font-medium">
                Wallet
              </Link>
              <Link href="/swap" className="text-white font-semibold">
                Token Swap
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-16 px-4">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            OVE Token{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Swap
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Swap your OVE tokens with other cryptocurrencies quickly and securely on the BSC testnet.
            Experience the future of decentralized finance.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Swap Interface */}
          <div className="animate-slide-in-right">
            <SwapInterface />
          </div>

          {/* Features */}
          <div className="space-y-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="card p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Why Choose OVE Swap?</h3>
              <div className="space-y-6">
                <div className="flex items-start group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Lightning Fast</h4>
                    <p className="text-gray-600 leading-relaxed">Experience instantaneous token swaps with our optimized smart contracts and real-time price feeds.</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Bank-Grade Security</h4>
                    <p className="text-gray-600 leading-relaxed">Your funds are protected by audited smart contracts and multi-layer security protocols.</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 mt-1 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">Minimal Fees</h4>
                    <p className="text-gray-600 leading-relaxed">Enjoy competitive swap rates with transparent fee structure and no hidden costs.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Supported Assets</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200/50 group hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">O</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">OVE</span>
                      <div className="text-sm text-gray-600">OVE Token</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Native Token</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200/50 group hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mr-3">
                      <span className="text-gray-800 font-bold text-sm">B</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">BNB</span>
                      <div className="text-sm text-gray-600">Binance Coin</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Base Currency</div>
                </div>
                
                <div className="text-center text-gray-500 mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="text-sm font-medium">🚀 More tokens coming soon...</div>
                  <div className="text-xs mt-1">Stay tuned for expanded trading pairs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}