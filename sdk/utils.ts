import { ethers } from "ethers";

const { getAddress } = ethers;

export async function waitForTransaction(tx: ethers.TransactionResponse): Promise<ethers.TransactionReceipt> {
    const receipt = await tx.wait();
    if (!receipt) {
        throw new Error("Transaction receipt is null");
    }
    return receipt;
}

export function validateAddress(address: string): boolean {
    try {
        getAddress(address);
        return true;
    } catch {
        return false;
    }
}

export function toChecksumAddress(address: string): string {
    return getAddress(address);
}
