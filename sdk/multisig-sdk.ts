import { ethers, Contract } from "ethers";
import MultiSigABI from "../abi/MultiSigApproval.json";
import MultiSigFactoryABI from "../abi/MultiSigApprovalFactory.json";
import { waitForTransaction } from "./utils";

type MultiSigFactoryInterface = {
    createMultiSig(approvers: string[]): Promise<ethers.TransactionResponse>;
};

type MultiSigInterface = {
    createProposal(requiredApprovals: number): Promise<ethers.TransactionResponse>;
    approveProposal(proposalId: number): Promise<ethers.TransactionResponse>;
    revokeApproval(proposalId: number): Promise<ethers.TransactionResponse>;
    checkProposal(proposalId: number): Promise<boolean>;
    executeProposal(proposalId: number): Promise<ethers.TransactionResponse>;
    getApprovals(proposalId: number): Promise<number>;
    getRequiredApprovals(proposalId: number): Promise<number>;
};

export class MultiSigSDK {
    private multiSigContract: Contract & MultiSigInterface | null = null;
    private factoryContract: Contract & MultiSigFactoryInterface;

    constructor(
        provider: ethers.JsonRpcProvider,
        factoryAddress: string,
        contractAddress?: string
    ) {
        this.factoryContract = new ethers.Contract(
            factoryAddress,
            MultiSigFactoryABI.abi,
            provider
        ) as Contract & MultiSigFactoryInterface;

        if (contractAddress) {
            this.multiSigContract = new ethers.Contract(
                contractAddress,
                MultiSigABI.abi,
                provider
            ) as Contract & MultiSigInterface;
        }
    }

    connectToMultiSig(contractAddress: string, provider: ethers.JsonRpcProvider) {
        this.multiSigContract = new ethers.Contract(
            contractAddress,
            MultiSigABI.abi,
            provider
        ) as Contract & MultiSigInterface;
    }

    async createMultiSig(approvers: string[], signer: ethers.Signer): Promise<string> {
        const tx = await this.factoryContract.connect(signer).createMultiSig(approvers);
        const receipt = await waitForTransaction(tx);
        const event = receipt.logs.find(
            (log) => log.topics[0] === ethers.id("MultiSigCreated(address,address)")
        );
        if (!event) throw new Error("MultiSigCreated event not found");

        const decoded = ethers.AbiCoder.defaultAbiCoder.decode(
            ["address", "address"],
            event.data
        );
        return decoded[0];
    }

    async createProposal(requiredApprovals: number, signer: ethers.Signer): Promise<number> {
        if (!this.multiSigContract) throw new Error("MultiSig contract not connected.");
        const tx = await this.multiSigContract.connect(signer).createProposal(requiredApprovals);
        const receipt = await waitForTransaction(tx);
        const event = receipt.logs.find(
            (log) => log.topics[0] === ethers.id("ProposalCreated(uint256,uint256)")
        );
        if (!event) throw new Error("ProposalCreated event not found");

        const decoded = ethers.AbiCoder.defaultAbiCoder.decode(["uint256", "uint256"], event.data);
        return decoded[0].toNumber();
    }

    async approveProposal(proposalId: number, signer: ethers.Signer): Promise<void> {
        if (!this.multiSigContract) throw new Error("MultiSig contract not connected.");
        const tx = await this.multiSigContract.connect(signer).approveProposal(proposalId);
        await waitForTransaction(tx);
    }

    async revokeApproval(proposalId: number, signer: ethers.Signer): Promise<void> {
        if (!this.multiSigContract) throw new Error("MultiSig contract not connected.");
        const tx = await this.multiSigContract.connect(signer).revokeApproval(proposalId);
        await waitForTransaction(tx);
    }

    async checkProposal(proposalId: number): Promise<boolean> {
        if (!this.multiSigContract) throw new Error("MultiSig contract not connected.");
        return await this.multiSigContract.checkProposal(proposalId);
    }

    async executeProposal(proposalId: number, signer: ethers.Signer): Promise<void> {
        if (!this.multiSigContract) throw new Error("MultiSig contract not connected.");
        const tx = await this.multiSigContract.connect(signer).executeProposal(proposalId);
        await waitForTransaction(tx);
    }

    async getProposalDetails(proposalId: number): Promise<any> {
        if (!this.multiSigContract) throw new Error("MultiSig contract not connected.");
        const [approvals, required] = await Promise.all([
            this.multiSigContract.getApprovals(proposalId),
            this.multiSigContract.getRequiredApprovals(proposalId),
        ]);
        return { proposalId, approvals, required, status: approvals >= required };
    }

    async batchApprove(proposalIds: number[], signer: ethers.Signer): Promise<void> {
        if (!this.multiSigContract) throw new Error("MultiSig contract not connected.");
        for (const id of proposalIds) {
            const tx = await this.multiSigContract.connect(signer).approveProposal(id);
            await waitForTransaction(tx);
        }
    }
}
