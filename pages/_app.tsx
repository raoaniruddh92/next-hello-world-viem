import type { AppProps } from 'next/app'
import { Web3OnboardProvider, init } from '@web3-onboard/react'
import metamaskSDK from '@web3-onboard/metamask'

const metamaskSDKWallet = metamaskSDK({
  options: {
    extensionOnly: true, // Set to true if you ONLY want the browser extension
    dappMetadata: {
      name: 'Web3-Onboard Demo',
    }
  }
})

const ethereumSepolia = {
  id: '0xaa36a7', 
  token: 'ETH',
  label: 'Sepolia',
  rpcUrl: 'https://rpc.sepolia.org/'
}

const web3Onboard = init({
  // 2. Update the wallets array
  wallets: [metamaskSDKWallet],
  chains: [ethereumSepolia],
  appMetadata: {
    name: 'Web3-Onboard Demo',
    icon: '<svg>...</svg>',
    description: 'A demo of Web3-Onboard.'
  },
  connect: {
    autoConnectLastWallet: true 
  },
  notify: {
    enabled: true
  },
  accountCenter: {
    desktop: {
      enabled: true,
      position: 'topRight'
    },
    mobile: {
      enabled: true,
      position: 'topRight'
    }

  }
})


export default function App({ Component, pageProps }: AppProps) {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <Component {...pageProps} />
    </Web3OnboardProvider>
  )
}