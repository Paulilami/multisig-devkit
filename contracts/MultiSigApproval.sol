// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiSigApproval {
    struct Proposal {
        uint256 id;
        uint256 approvals;
        uint256 requiredApprovals;
        bool executed;
        mapping(address => bool) approved;
    }

    mapping(uint256 => Proposal) private proposals;
    mapping(address => bool) public isApprover;
    uint256 public proposalCounter;

    event ProposalCreated(uint256 indexed proposalId, uint256 requiredApprovals);
    event ProposalApproved(uint256 indexed proposalId, address indexed approver);
    event ProposalRevoked(uint256 indexed proposalId, address indexed approver);

    constructor(address[] memory _approvers) {
        for (uint256 i = 0; i < _approvers.length; i++) {
            isApprover[_approvers[i]] = true;
        }
    }

    modifier onlyApprover() {
        require(isApprover[msg.sender], "Not an approver");
        _;
    }

    function createProposal(uint256 _requiredApprovals) external returns (uint256) {
        require(_requiredApprovals > 0, "Approvals required must be greater than 0");

        proposalCounter++;
        Proposal storage proposal = proposals[proposalCounter];
        proposal.id = proposalCounter;
        proposal.requiredApprovals = _requiredApprovals;

        emit ProposalCreated(proposalCounter, _requiredApprovals);
        return proposalCounter;
    }

    function approveProposal(uint256 _proposalId) external onlyApprover {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.approved[msg.sender], "Already approved");

        proposal.approved[msg.sender] = true;
        proposal.approvals++;

        emit ProposalApproved(_proposalId, msg.sender);
    }

    function revokeApproval(uint256 _proposalId) external onlyApprover {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(proposal.approved[msg.sender], "Not approved");

        proposal.approved[msg.sender] = false;
        proposal.approvals--;

        emit ProposalRevoked(_proposalId, msg.sender);
    }

    function checkProposal(uint256 _proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[_proposalId];
        return proposal.approvals >= proposal.requiredApprovals;
    }

    function executeProposal(uint256 _proposalId) external onlyApprover returns (bool) {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(proposal.approvals >= proposal.requiredApprovals, "Not enough approvals");

        proposal.executed = true;
        return true;
    }
}
