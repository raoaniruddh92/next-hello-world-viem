'use client'

import { useEffect, useRef, useState } from 'react'
import { useConnectWallet, useNotifications } from '@web3-onboard/react'
import { abi, bytecode } from '@/blockchain_modules/data'
import { getLibWalletClient,publicClient } from '../../blockchain_modules/utils/client'
import { parseEther } from 'viem'
import type { TransactionReceipt } from "viem";

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

async function handleFinish(
  receipt: TransactionReceipt | null,
  hash: `0x${string}`
) {
  try {
    // --- 1. No receipt or no contract address → fail early ---
    if (!receipt?.contractAddress) {
      notifyController.current?.update({
        type: "error",
        message: "Deployment failed.",
        autoDismiss: 5000,
      });
      return;
    }

    const contractAddress = receipt.contractAddress;

    // --- 2. Deployment success ---
    notifyController.current?.update({
      type: "success",
      message: "Deployment successful!",
      autoDismiss: 5000,
    });

    onDeployed(contractAddress);

    // --- 3. Wait for chain + Sourcify indexing ---
    await new Promise((resolve) => setTimeout(resolve, 5_000));

    // --- 4. Call verification API ---
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: contractAddress }),
    });

    if (!res.ok) {
      throw new Error(`Verification request failed (${res.status})`);
    }

    const data = await res.json();

    if (!data.success) {
      console.warn("Contract verification failed:", data);
      notifyController.current?.update({
        type: "warning",
        message: "Contract deployed, but verification failed.",
        autoDismiss: 6000,
      });
    }
  } catch (err) {
    console.error("handleFinish error:", err);
    notifyController.current?.update({
      type: "warning",
      message: "Deployment succeeded, but verification failed.",
      autoDismiss: 6000,
    });
  } finally {
    // --- 5. Always clean up ---
    localStorage.removeItem("pending_deploy_hash");
    setProcessing(false);
  }
}

async function deploy() {
  if (!wallet?.provider || processing) return
  
  setProcessing(true)

  try {
    const client = getLibWalletClient(wallet.provider)
    const [account] = await client.getAddresses()

    if (!account) throw new Error("No account found")

    const hash = await client.deployContract({
      abi,
      account,
      bytecode: bytecode as `0x${string}`,
    })

    localStorage.setItem('pending_deploy_hash', hash)
    resumeTracking(hash)
    
  } catch (error: any) {
    console.error("Deployment Error:", error)
    
    // Check if the user rejected the request
    // Common error codes: 4001 (EIP-1193) or "User rejected the request" string
    const isUserRejected = 
      error.code === 4001 || 
      error.message?.toLowerCase().includes('user rejected') ||
      error.shortMessage?.toLowerCase().includes('user rejected')

    const errorMessage = isUserRejected 
      ? 'Transaction rejected by user.' 
      : 'Deployment failed. Please try again.'

    // Create or Update notification
    if (notifyController.current) {
      notifyController.current.update({
        type: 'error',
        message: errorMessage,
        autoDismiss: 5000
      })
    } else {
      customNotification({
        type: 'error',
        message: errorMessage,
        autoDismiss: 5000
      })
    }

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