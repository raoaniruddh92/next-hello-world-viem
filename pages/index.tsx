'use client'

import { useEffect, useState } from 'react'
import { useConnectWallet } from '@web3-onboard/react'
import DeployContract from './blockchain_pages/deploycontract'
import ReadHello from './blockchain_pages/readcontract'
export default function Home() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [address, setAddress] = useState<string | null>(null)

  // Load on first render
  useEffect(() => {
    const stored = localStorage.getItem('address')
    if (stored) setAddress(stored)
  }, [])

  return (
    <div>
      <button
        disabled={connecting}
        onClick={() => (wallet ? disconnect(wallet) : connect())}
      >
        {connecting ? 'Connecting' : wallet ? 'Disconnect' : 'Connect'}
      </button>
      { wallet && <div>
      {address && <p>Contract address: {address}</p>}

      {<DeployContract onDeployed={setAddress} />}

      <br></br>
      { <ReadHello />}
            </div>

      }
    </div>
  )
}
