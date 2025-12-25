'use client'

import { useEffect, useRef, useState } from 'react'
import { useConnectWallet, useNotifications } from '@web3-onboard/react'
import { abi, bytecode } from '@/blockchain_modules/data'
import { getLibWalletClient,publicClient } from '../../blockchain_modules/utils/client'

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
  // 1. Ensure wallet and provider exist
  if (!wallet?.provider || processing) return
  
  setProcessing(true)

  try {
    // 2. Initialize the wallet client with the CURRENT provider
    const client = getLibWalletClient(wallet.provider)

    // 3. Get the specific account address from the wallet
    const [account] = await client.getAddresses()

    if (!account) throw new Error("No account found")

    // 4. Deploy using the local client instance
    const hash = await client.deployContract({
      abi,
      account, // This is now explicitly passed
      bytecode: bytecode as `0x${string}`,
    })

    localStorage.setItem('pending_deploy_hash', hash)
    resumeTracking(hash)
  } catch (error) {
    console.error("Deployment Error:", error)
    notifyController.current?.update({
        type: 'error',
        message: error,
        autoDismiss: 5000
    })
    setProcessing(false) 
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