'use client'

import { useEffect, useRef, useState } from 'react'
import { createPublicClient, custom, createWalletClient } from 'viem'
import { sepolia } from 'viem/chains'
import { useConnectWallet, useNotifications } from '@web3-onboard/react'
import { abi, bytecode } from '@/blockchain_modules/data'

export default function DeployContract({ onDeployed }: { onDeployed: (addr: string) => void }) {
  const [{ wallet }] = useConnectWallet()
  const [, customNotification] = useNotifications()
  
  // Initialize processing based on localStorage to prevent "flash" of enabled button
  const [processing, setProcessing] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('pending_deploy_hash')
    }
    return false
  })

  const notifyController = useRef<{ update: Function; dismiss: Function } | null>(null)

  useEffect(() => {
    const pendingHash = localStorage.getItem('pending_deploy_hash')
    if (pendingHash && wallet?.provider) {
      resumeTracking(pendingHash as `0x${string}`)
    }
  }, [wallet])

  async function resumeTracking(hash: `0x${string}`) {
    setProcessing(true) // Ensure state is synced
    
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: custom(wallet!.provider),
    })

    notifyController.current = customNotification({
      eventCode: 'dbUpdate', // Web3-Onboard often uses eventCodes for tracking
      type: 'pending',
      message: 'Transaction in progress...',
      autoDismiss: 0 
    })

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      handleFinish(receipt, hash)
    } catch (error) {
      handleFinish(null, hash)
    } finally {
      setProcessing(false) // Re-enable the button
    }
  }

  function handleFinish(receipt: any, hash: string) {
    if (receipt?.contractAddress) {
      notifyController.current?.update({
        type: 'success',
        message: 'Deployment successful!',
        autoDismiss: 5000
      })
      onDeployed(receipt.contractAddress)
    } else {
      notifyController.current?.update({
        type: 'error',
        message: 'Deployment failed.',
        autoDismiss: 5000
      })
    }
    localStorage.removeItem('pending_deploy_hash')
  }

  async function deploy() {
    if (!wallet?.provider || processing) return
    
    setProcessing(true)

    try {
      const walletClient = createWalletClient({ chain: sepolia, transport: custom(wallet.provider) })
      const [account] = await walletClient.getAddresses()

      const hash = await walletClient.deployContract({
        abi,
        account,
        bytecode: bytecode as `0x${string}`,
      })

      localStorage.setItem('pending_deploy_hash', hash)
      resumeTracking(hash)
    } catch (error) {
      console.error("User rejected or failed:", error)
      setProcessing(false) // Re-enable if user rejects the signature request
    }
  }

  return (
    <button 
      onClick={deploy} 
      disabled={processing}
      style={{ cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.6 : 1 }}
    >
      {processing ? 'Deploying...' : 'Deploy contract'}
    </button>
  )
}