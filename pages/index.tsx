'use client'

import { useEffect, useState } from 'react'
import { useConnectWallet } from '@web3-onboard/react'
import DeployContract from './blockchain_pages/deploycontract'
import ReadHello from './blockchain_pages/readcontract'

export default function Home() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [address, setAddress] = useState<string | null>(null)

  // 1. Load from localStorage on initial mount
  useEffect(() => {
    const stored = localStorage.getItem('address')
    if (stored) setAddress(stored)
  }, [])

  // 2. Persist to localStorage whenever address changes
  // This ensures that when onDeployed(addr) is called, it stays saved
  useEffect(() => {
    if (address) {
      localStorage.setItem('address', address)
    }
  }, [address])

  return (
    <div style={{ padding: '20px' }}>
      <button disabled={connecting} onClick={() => (wallet ? disconnect(wallet) : connect())}>
        {connecting ? 'Connecting' : wallet ? 'Disconnect' : 'Connect'}
      </button>

      {wallet && (
        <div style={{ marginTop: '20px' }}>
          {/* 3. Conditional rendering: Show address if it exists */}
          {address ? (
            <div style={{ marginBottom: '10px', color: 'green' }}>
              <strong>Contract Address:</strong> {address}
            </div>
          ) : (
            <p>No contract deployed yet.</p>
          )}

          <DeployContract onDeployed={setAddress} />

          <br />
          {/* Pass the address to ReadHello so it knows which contract to talk to */}
          {address && <ReadHello/>}
        </div>

      )}
    </div>
  )
}