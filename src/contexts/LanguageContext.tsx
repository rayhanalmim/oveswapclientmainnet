'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'ja'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation objects
const translations = {
  en: {
    // Navigation
    'nav.platform': 'Platform',
    'nav.connectWallet': 'Connect Wallet',
    'nav.connected': 'Connected',
    'nav.defi': 'Decentralized Finance',

    // Hero Section
    'hero.badge': '🚀 Next-Gen DeFi Platform',
    'hero.welcome': 'Welcome to',
    'hero.platform': 'OVE Platform',
    'hero.description': 'Your gateway to the OVE ecosystem. Connect your wallet, manage your tokens, and explore decentralized finance opportunities with our cutting-edge swap platform. Experience the future of trading today.',
    'hero.getStarted': 'Get Started Now',

    // Trust Indicators
    'trust.secure': 'Secure & Audited',
    'trust.fastSpeed': 'Lightning Fast',
    'trust.lowFees': 'Low Fees',
    'trust.decentralized': 'Decentralized',
    'trust.crossChain': 'Cross-Chain',
    'trust.trading247': '24/7 Trading',
    'trust.nonCustodial': 'Non-Custodial',
    'trust.openSource': 'Open Source',
    'trust.realTime': 'Real-time Rates',
    'trust.globalAccess': 'Global Access',

    // Swap Interface
    'swap.title': 'Token Swap',
    'swap.liveRates': 'Live Rates',
    'swap.from': 'From',
    'swap.to': 'To (Estimated)',
    'swap.balance': 'Balance',
    'swap.calculating': 'Calculating...',
    'swap.swapping': 'Swapping...',
    'swap.bnbToOve': 'Swap BNB for OVE',
    'swap.oveToBnb': 'Swap OVE for BNB',
    'swap.transactionSummary': 'Transaction Summary',
    'swap.youPay': 'You pay:',
    'swap.tradingFee': 'Trading fee',
    'swap.youReceive': 'You receive:',
    'swap.tradingInfo': 'Trading Info',
    'swap.network': 'Network:',
    'swap.slippage': 'Slippage:',
    'swap.minReceived': 'Min. received:',

    // Features Section
    'features.title': 'Platform Features',
    'features.description': 'Discover the powerful features that make OVE Platform the ultimate destination for decentralized finance',
    'features.secureWallet.title': 'Secure Wallet',
    'features.secureWallet.description': 'Connect your wallet securely with support for multiple wallet providers, social logins, and enterprise-grade security.',
    'features.tokenSwaps.title': 'Token Swaps',
    'features.tokenSwaps.description': 'Swap OVE tokens with other supported cryptocurrencies using our advanced AMM with real-time price feeds.',
    'features.fastReliable.title': 'Fast & Reliable',
    'features.fastReliable.description': 'Experience lightning-fast transactions with minimal fees on BSC testnet, powered by cutting-edge blockchain technology.',

    // Stats Section
    'stats.title': 'Platform Statistics',
    'stats.description': 'Track our platform\'s growth and performance in real-time',
    'stats.totalVolume': 'Total Volume',
    'stats.transactions': 'Transactions',
    'stats.uptime': 'Uptime',
    'stats.support': 'Support',
    'stats.fees': 'Fees',
    'stats.avgSpeed': 'Avg Speed',
    'stats.secure': 'Secure',

    // Error Messages
    'error.invalidAmount': 'Please enter a valid amount',
    'error.connectWallet': 'Please connect your wallet',
    'error.swapFailed': 'Swap failed. Please try again.',

    // Success Messages
    'success.oveSold': 'OVE sold for BNB successfully!',
    'success.ovePurchased': 'OVE purchased with BNB successfully!',

    // Footer
    'footer.tagline': 'Building the future of decentralized finance, one swap at a time.',
    'footer.platform': 'Platform',
    'footer.tokenSwap': 'Token Swap',
    'footer.wallet': 'Wallet',
    'footer.analytics': 'Analytics',
    'footer.documentation': 'Documentation',
    'footer.community': 'Community',
    'footer.discord': 'Discord',
    'footer.twitter': 'Twitter',
    'footer.telegram': 'Telegram',
    'footer.medium': 'Medium',
    'footer.resources': 'Resources',
    'footer.helpCenter': 'Help Center',
    'footer.contactUs': 'Contact Us',
    'footer.bugReport': 'Bug Report',
    'footer.apiDocs': 'API Docs',
    'footer.company': 'Company',
    'footer.aboutUs': 'About Us',
    'footer.careers': 'Careers',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsOfService': 'Terms of Service',
    'footer.stayUpdated': 'Stay updated',
    'footer.newsletterDescription': 'Get the latest updates on DeFi innovations and platform features.',
    'footer.emailPlaceholder': 'Enter your email',
    'footer.subscribe': 'Subscribe',
    'footer.copyright': '© 2026 OVE Platform. All rights reserved.',

    // Wallet Modal
    'wallet.title': 'OVE Wallet',
    'wallet.currentBalance': 'Current Balance',
    'wallet.activity': 'Activity',
    'wallet.disconnect': 'Disconnect'
  },
  ja: {
    // Navigation
    'nav.platform': 'プラットフォーム',
    'nav.connectWallet': 'ウォレット接続',
    'nav.connected': '接続済み',
    'nav.defi': '分散型金融',

    // Hero Section
    'hero.badge': '🚀 次世代DeFiプラットフォーム',
    'hero.welcome': 'ようこそ',
    'hero.platform': 'OVEプラットフォーム',
    'hero.description': 'OVEエコシステムへのゲートウェイです。ウォレットを接続し、トークンを管理し、最先端のスワッププラットフォームで分散型金融の機会を探索してください。今日から未来の取引を体験しましょう。',
    'hero.getStarted': '今すぐ始める',

    // Trust Indicators
    'trust.secure': 'セキュア＆監査済み',
    'trust.fastSpeed': '超高速',
    'trust.lowFees': '低手数料',
    'trust.decentralized': '分散型',
    'trust.crossChain': 'クロスチェーン',
    'trust.trading247': '24時間取引',
    'trust.nonCustodial': '非カストディアル',
    'trust.openSource': 'オープンソース',
    'trust.realTime': 'リアルタイムレート',
    'trust.globalAccess': 'グローバルアクセス',

    // Swap Interface
    'swap.title': 'トークンスワップ',
    'swap.liveRates': 'ライブレート',
    'swap.from': 'から',
    'swap.to': 'へ（予想）',
    'swap.balance': '残高',
    'swap.calculating': '計算中...',
    'swap.swapping': 'スワップ中...',
    'swap.bnbToOve': 'BNBをOVEにスワップ',
    'swap.oveToBnb': 'OVEをBNBにスワップ',
    'swap.transactionSummary': '取引概要',
    'swap.youPay': '支払い額:',
    'swap.tradingFee': '取引手数料',
    'swap.youReceive': '受取額:',
    'swap.tradingInfo': '取引情報',
    'swap.network': 'ネットワーク:',
    'swap.slippage': 'スリッページ:',
    'swap.minReceived': '最小受取額:',

    // Features Section
    'features.title': 'プラットフォーム機能',
    'features.description': 'OVEプラットフォームを分散型金融の究極の目的地にする強力な機能を発見してください',
    'features.secureWallet.title': 'セキュアウォレット',
    'features.secureWallet.description': '複数のウォレットプロバイダー、ソーシャルログイン、エンタープライズグレードのセキュリティをサポートして、ウォレットを安全に接続します。',
    'features.tokenSwaps.title': 'トークンスワップ',
    'features.tokenSwaps.description': 'リアルタイム価格フィードを備えた高度なAMMを使用して、OVEトークンを他のサポートされている暗号通貨とスワップします。',
    'features.fastReliable.title': '高速＆信頼性',
    'features.fastReliable.description': '最先端のブロックチェーン技術により、BSCテストネットで最小限の手数料で超高速取引を体験してください。',

    // Stats Section
    'stats.title': 'プラットフォーム統計',
    'stats.description': 'プラットフォームの成長とパフォーマンスをリアルタイムで追跡',
    'stats.totalVolume': '総取引量',
    'stats.transactions': '取引数',
    'stats.uptime': '稼働時間',
    'stats.support': 'サポート',
    'stats.fees': '手数料',
    'stats.avgSpeed': '平均速度',
    'stats.secure': 'セキュア',

    // Error Messages
    'error.invalidAmount': '有効な金額を入力してください',
    'error.connectWallet': 'ウォレットを接続してください',
    'error.swapFailed': 'スワップに失敗しました。もう一度お試しください。',

    // Success Messages
    'success.oveSold': 'OVEがBNBで正常に売却されました！',
    'success.ovePurchased': 'OVEがBNBで正常に購入されました！',

    // Footer
    'footer.tagline': '一度に一つのスワップで、分散型金融の未来を構築しています。',
    'footer.platform': 'プラットフォーム',
    'footer.tokenSwap': 'トークンスワップ',
    'footer.wallet': 'ウォレット',
    'footer.analytics': 'アナリティクス',
    'footer.documentation': 'ドキュメント',
    'footer.community': 'コミュニティ',
    'footer.discord': 'Discord',
    'footer.twitter': 'Twitter',
    'footer.telegram': 'Telegram',
    'footer.medium': 'Medium',
    'footer.resources': 'リソース',
    'footer.helpCenter': 'ヘルプセンター',
    'footer.contactUs': 'お問い合わせ',
    'footer.bugReport': 'バグレポート',
    'footer.apiDocs': 'API ドキュメント',
    'footer.company': '会社',
    'footer.aboutUs': '私たちについて',
    'footer.careers': 'キャリア',
    'footer.privacyPolicy': 'プライバシーポリシー',
    'footer.termsOfService': '利用規約',
    'footer.stayUpdated': '最新情報を受け取る',
    'footer.newsletterDescription': 'DeFiの革新とプラットフォーム機能の最新アップデートを入手してください。',
    'footer.emailPlaceholder': 'メールアドレスを入力',
    'footer.subscribe': '購読',
    'footer.copyright': '© 2026 OVE Platform. 全著作権所有。',

    // Wallet Modal
    'wallet.title': 'OVEウォレット',
    'wallet.currentBalance': '現在の残高',
    'wallet.activity': 'アクティビティ',
    'wallet.disconnect': '切断'
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ja')

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ja')) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language preference
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('preferredLanguage', lang)
  }

  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
