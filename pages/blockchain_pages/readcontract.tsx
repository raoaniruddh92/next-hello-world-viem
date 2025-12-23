'use client'

import { useEffect, useState } from 'react'
import { useConnectWallet } from '@web3-onboard/react'
import { createPublicClient, custom, isAddress } from 'viem'
import { sepolia } from 'viem/chains'
import { abi } from '@/blockchain_modules/data'

export default function ReadHello() {
  const [{ wallet }] = useConnectWallet()
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setprocessing] = useState<boolean | null>(null)

  // ✅ AUTO-FILL FROM LOCALSTORAGE
  useEffect(() => {
    const stored = localStorage.getItem('address')
    if (stored && isAddress(stored)) {
      setAddress(stored)
    }
  }, [])

  async function read_hello() {
    try {
      setError(null)

      if (!wallet?.provider) throw new Error('Wallet not connected')
      if (!isAddress(address)) throw new Error('Invalid address')

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: custom(wallet.provider),
      })

      const data = await publicClient.readContract({
        address: address as `0x${string}`,
        abi,
        functionName: 'hello_world',
      })

      setResult(String(data))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Enter contract address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <button onClick={read_hello} disabled={!wallet}>
        Read hello
      </button>

      {result && <p>Result: {result}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
