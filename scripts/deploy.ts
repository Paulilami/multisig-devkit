import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const Factory = await ethers.getContractFactory("MultiSigApprovalFactory", deployer);
    const factory = await Factory.deploy();

    console.log("MultiSigApprovalFactory deployment transaction sent. Waiting for confirmation...");
    const txReceipt = await factory.deploymentTransaction()?.wait();
    if (!txReceipt) {
        throw new Error("Failed to get deployment transaction receipt for MultiSigApprovalFactory.");
    }

    console.log("MultiSigApprovalFactory deployed at:", factory.target);

    const approvers = [
        "0x1234567890abcdef1234567890abcdef12345678",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "0x9876543210fedcba9876543210fedcba98765432",
    ];

    console.log("Creating MultiSigApproval through factory...");
    const tx = await factory.createMultiSig(approvers);
    const receipt = await tx.wait();

    const event = receipt.logs.find((log: { fragment: { name: string; }; }) =>
        log.fragment?.name === "MultiSigCreated"
    );
    if (!event) {
        throw new Error("MultiSigCreated event not found in transaction logs.");
    }

    const multiSigAddress = event.args?.contractAddress;
    console.log("MultiSigApproval deployed at:", multiSigAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying contracts:", error);
        process.exit(1);
    });
