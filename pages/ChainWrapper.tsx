import { useEffect } from 'react'
import { useConnectWallet, useSetChain } from '@web3-onboard/react'

const REQUIRED_CHAIN_ID = '0xAA36A7' // Sepolia

export default function ChainWrapper({ children }: { children: React.ReactNode }) {
  const [{ wallet }] = useConnectWallet()
  const [{ connectedChain }, setChain] = useSetChain()

  useEffect(() => {
    // If wallet is connected but on the wrong chain
    if (wallet && connectedChain && connectedChain.id !== REQUIRED_CHAIN_ID) {
      const switchChain = async () => {
        try {
          await setChain({ chainId: REQUIRED_CHAIN_ID })
        } catch (error) {
          console.error("Failed to switch network:", error)
        }
      }
      switchChain()
    }
  }, [wallet, connectedChain, setChain])

  return <>{children}</>
}