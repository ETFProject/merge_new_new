/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import { ethers } from 'ethers';

/**
 * Generate a random bytes32 string
 */
export function getRandomBytes32(): string {
  // Generate random bytes using crypto API when available
  if (typeof window !== 'undefined' && window.crypto) {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return ethers.hexlify(bytes);
  }
  
  // Fallback to ethers random bytes
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * HashLock utilities for 1inch Fusion+ integration
 */
export const HashLock = {
  /**
   * Hash a secret using keccak256
   */
  hashSecret(secret: string): string {
    return ethers.keccak256(secret);
  },
  
  /**
   * Create a HashLock for a single fill
   */
  forSingleFill(secret: string): string {
    // For a single fill, the secret is used directly
    return secret;
  },
  
  /**
   * Create a HashLock for multiple fills using Merkle tree
   */
  forMultipleFills(leaves: string[]): string {
    // This is a simplified implementation
    // In a real app, you would build a proper Merkle tree
    return ethers.keccak256(ethers.concat(leaves));
  }
};

/**
 * Creates a keccak256 hash of solidityPacked data
 */
export function solidityPackedKeccak256(types: string[], values: unknown[]): string {
  const encoded = ethers.solidityPacked(types, values);
  return ethers.keccak256(encoded);
} 