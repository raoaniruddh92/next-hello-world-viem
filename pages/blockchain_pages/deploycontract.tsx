'use client'

import { createWalletClient, custom, createPublicClient } from 'viem'
import { sepolia } from 'viem/chains'
import { useConnectWallet } from '@web3-onboard/react'
import { abi, bytecode } from '@/blockchain_modules/data'

export default function DeployContract({ onDeployed }: { onDeployed: (addr: string) => void }) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()

  async function deploy() {
    if (!wallet?.provider) throw new Error('Wallet not connected')

    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom(wallet.provider),
    })

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: custom(wallet.provider),
    })

    const [account] = await walletClient.getAddresses()
    if (!account) throw new Error('No account')

    const hash = await walletClient.deployContract({
      abi,
      account,
      bytecode: bytecode as `0x${string}`,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (!receipt.contractAddress) return

    localStorage.setItem('address', receipt.contractAddress)
    onDeployed(receipt.contractAddress)
  }

  return <button disabled={!wallet} onClick={deploy}>Deploy contract here</button>
}
