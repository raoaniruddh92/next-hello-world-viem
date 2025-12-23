'use client'

import { useEffect, useRef } from 'react'
import { createPublicClient, custom, createWalletClient } from 'viem'
import { sepolia } from 'viem/chains'
import { useConnectWallet, useNotifications } from '@web3-onboard/react'
import { abi, bytecode } from '@/blockchain_modules/data'

export default function DeployContract({ onDeployed }: { onDeployed: (addr: string) => void }) {
  const [{ wallet }] = useConnectWallet()
  const [, customNotification] = useNotifications()
  
  // Ref to hold the notification update/dismiss functions
  const notifyController = useRef<{ update: Function; dismiss: Function } | null>(null)

  useEffect(() => {
    const pendingHash = localStorage.getItem('pending_deploy_hash')
    // Only resume if we have a hash AND a connected wallet
    if (pendingHash && wallet?.provider) {
      resumeTracking(pendingHash as `0x${string}`)
    }
  }, [wallet])

  async function resumeTracking(hash: `0x${string}`) {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: custom(wallet!.provider),
    })

    // Using the HASH as the ID prevents duplicates on reload
    notifyController.current = customNotification({
      type: 'pending',
      message: 'Transaction in progress...',
      autoDismiss: 0 // Keep it visible until we update it
    })

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      handleFinish(receipt, hash)
    } catch (error) {
      handleFinish(null, hash)
    }
  }

  function handleFinish(receipt: any, hash: string) {
    if (receipt?.contractAddress) {
      notifyController.current?.update({
        id: hash,
        type: 'success',
        message: 'Deployment successful!',
        autoDismiss: 5000
      })
      onDeployed(receipt.contractAddress)
    } else {
      notifyController.current?.update({
        id: hash,
        type: 'error',
        message: 'Deployment failed.',
        autoDismiss: 5000
      })
    }
    localStorage.removeItem('pending_deploy_hash')
  }

  async function deploy() {
    if (!wallet?.provider) return

    try {
      const walletClient = createWalletClient({ chain: sepolia, transport: custom(wallet.provider) })
      const [account] = await walletClient.getAddresses()

      const hash = await walletClient.deployContract({
        abi,
        account,
        bytecode: bytecode as `0x${string}`,
      })

      localStorage.setItem('pending_deploy_hash', hash)
      resumeTracking(hash) // Start tracking immediately
      
    } catch (error) {
      console.error("User rejected or failed:", error)
    }
  }

  return <button onClick={deploy}>Deploy contract</button>
}