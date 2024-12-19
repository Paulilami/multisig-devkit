// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MultiSigApproval.sol";

contract MultiSigApprovalFactory {
    event MultiSigCreated(address indexed contractAddress, address indexed creator);

    function createMultiSig(address[] memory approvers) external returns (address) {
        MultiSigApproval multiSig = new MultiSigApproval(approvers);
        emit MultiSigCreated(address(multiSig), msg.sender);
        return address(multiSig);
    }
}
