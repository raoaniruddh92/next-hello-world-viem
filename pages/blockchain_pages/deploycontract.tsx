'use client'

import { createWalletClient, custom, createPublicClient } from 'viem'
import { sepolia } from 'viem/chains'
import { useConnectWallet, useNotifications } from '@web3-onboard/react'
import { abi, bytecode } from '@/blockchain_modules/data'

export default function DeployContract({ onDeployed }: { onDeployed: (addr: string) => void }) {
  const [{ wallet }] = useConnectWallet()
  const [, customNotification] = useNotifications()

  async function deploy() {
    if (!wallet?.provider) throw new Error('Wallet not connected')

    // 1. Capture the notification controller
    const { update, dismiss } = customNotification({
        eventCode: 'deploy_started',
        type: 'pending',
        message: 'Deploying contract...',
        autoDismiss: 0 
    })

    try {
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(wallet.provider),
      })

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(wallet.provider),
      })

      const [account] = await walletClient.getAddresses()
      const hash = await walletClient.deployContract({
        abi,
        account,
        bytecode: bytecode as `0x${string}`,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.contractAddress) {
        // 2. Update the EXISTING notification instead of creating a new one
        update({
          eventCode: 'deploy_success',
          type: 'success',
          message: 'Deployment completed!',
          autoDismiss: 5000 // Now it will disappear after 5 seconds
        })

        localStorage.setItem('address', receipt.contractAddress)
        onDeployed(receipt.contractAddress)
      }
    } catch (error) {
      // 3. Optional: Update to an error state if it fails
      update({
        eventCode: 'deploy_error',
        type: 'error',
        message: 'Deployment failed',
        autoDismiss: 5000
      })
      console.error(error)
    }
  }

  return <button disabled={!wallet} onClick={deploy}>Deploy contract here</button>
}