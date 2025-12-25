'use client'


import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { sepolia } from 'viem/chains'

// Keep this global - it doesn't need a user wallet to work
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://eth-sepolia-testnet.api.pocket.network")
})

// Create a helper function instead of a constant
export const getLibWalletClient = (provider: any) => {
  return createWalletClient({
    chain: sepolia,
    transport: custom(provider)
  })
}
