// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/decoding/EvmV1Decoder.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SettleRWA} from "./SettleRWA.sol";
import {INativeQueryVerifier} from "./VerifierInterface.sol";

contract PaymentVerifierUSC is ReentrancyGuard {
    INativeQueryVerifier public constant VERIFIER = INativeQueryVerifier(0x0000000000000000000000000000000000000FD2);
    bytes32 public constant TRANSFER_SIGNATURE = keccak256("Transfer(address,address,uint256)");
    SettleRWA public immutable settlement;
    mapping(bytes32 => bool) public processedQueries;
    error QueryAlreadyProcessed();
    error VerificationFailed();
    error SourceTransactionFailed();
    error UnsupportedPaymentChain();
    error PaymentTransferNotFound();
    error AmbiguousPaymentTransfer();
    event PaymentProofAccepted(bytes32 indexed saleId, bytes32 indexed queryId, uint64 chainKey, uint64 sourceBlock);

    constructor(SettleRWA target) {
        settlement = target;
    }

    function executePaymentProof(
        bytes32 saleId,
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest,
        bytes32[] calldata continuityRoots
    ) external nonReentrant returns (bool) {
        bytes32 queryId = _queryId(chainKey, blockHeight, merkleRoot, siblings);
        if (processedQueries[queryId]) revert QueryAlreadyProcessed();
        processedQueries[queryId] = true;
        _verifyProof(
            chainKey, blockHeight, encodedTransaction, merkleRoot, siblings, lowerEndpointDigest, continuityRoots
        );
        SettleRWA.Sale memory sale = settlement.getSale(saleId);
        if (sale.status != SettleRWA.SaleStatus.OPEN || chainKey != sale.paymentChainKey) {
            revert UnsupportedPaymentChain();
        }
        _validatePayment(encodedTransaction, sale);
        settlement.settleFromVerifiedPayment(saleId, queryId, blockHeight);
        emit PaymentProofAccepted(saleId, queryId, chainKey, blockHeight);
        return true;
    }

    function _validatePayment(bytes calldata encodedTransaction, SettleRWA.Sale memory sale) private pure {
        uint8 txType = EvmV1Decoder.getTransactionType(encodedTransaction);
        if (!EvmV1Decoder.isValidTransactionType(txType)) revert VerificationFailed();
        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        if (receipt.receiptStatus != 1) revert SourceTransactionFailed();
        EvmV1Decoder.LogEntry[] memory logs = EvmV1Decoder.getLogsByEventSignature(receipt, TRANSFER_SIGNATURE);
        uint256 matches = 0;
        for (uint256 i; i < logs.length; ++i) {
            EvmV1Decoder.LogEntry memory entry = logs[i];
            if (entry.address_ != sale.paymentToken || entry.topics.length != 3 || entry.data.length != 32) continue;
            address payer = address(uint160(uint256(entry.topics[1])));
            address recipient = address(uint160(uint256(entry.topics[2])));
            uint256 amount = abi.decode(entry.data, (uint256));
            if (payer == sale.buyer && recipient == sale.paymentRecipient && amount == sale.paymentAmount) ++matches;
        }
        if (matches == 0) revert PaymentTransferNotFound();
        if (matches != 1) revert AmbiguousPaymentTransfer();
    }

    function _verifyProof(
        uint64 chainKey,
        uint64 blockHeight,
        bytes calldata encodedTransaction,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings,
        bytes32 lowerEndpointDigest,
        bytes32[] calldata continuityRoots
    ) private {
        INativeQueryVerifier.MerkleProof memory merkleProof = INativeQueryVerifier.MerkleProof(merkleRoot, siblings);
        INativeQueryVerifier.ContinuityProof memory continuityProof =
            INativeQueryVerifier.ContinuityProof(lowerEndpointDigest, continuityRoots);
        if (!VERIFIER.verifyAndEmit(chainKey, blockHeight, encodedTransaction, merkleProof, continuityProof)) {
            revert VerificationFailed();
        }
    }

    function _queryId(
        uint64 chainKey,
        uint64 blockHeight,
        bytes32 merkleRoot,
        INativeQueryVerifier.MerkleProofEntry[] calldata siblings
    ) private view returns (bytes32) {
        INativeQueryVerifier.MerkleProof memory merkleProof = INativeQueryVerifier.MerkleProof(merkleRoot, siblings);
        return keccak256(abi.encodePacked(chainKey, blockHeight, VERIFIER.calculateTxIndex(merkleProof)));
    }
}
