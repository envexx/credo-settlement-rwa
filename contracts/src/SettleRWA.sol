// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SettleRWA is ERC1155Holder, AccessControl, ReentrancyGuard {
    bytes32 public constant CONFIG_ROLE = keccak256("CONFIG_ROLE");
    uint64 public constant MAX_WINDOW = 50_000;
    uint64 public constant MIN_RECLAIM_DELAY = 24 hours;
    uint64 public constant ESTIMATED_SOURCE_BLOCK_TIME = 12 seconds;
    enum SaleStatus {
        NONE,
        OPEN,
        SETTLED,
        RECLAIMED
    }

    struct Sale {
        address seller;
        address buyer;
        address assetContract;
        uint256 tokenId;
        uint256 assetAmount;
        uint64 paymentChainKey;
        uint64 paymentChainId;
        address paymentToken;
        address paymentRecipient;
        uint256 paymentAmount;
        uint64 sourceStartBlock;
        uint64 sourceEndBlock;
        uint64 reclaimAfter;
        SaleStatus status;
    }

    mapping(bytes32 => Sale) private _sales;
    mapping(address => uint256) public sellerNonces;
    mapping(bytes32 => bytes32) public activeSaleForPaymentTuple;
    mapping(address => bool) public approvedAssets;
    mapping(uint64 => uint64) public supportedPaymentChains;
    mapping(uint64 => mapping(address => bool)) public supportedPaymentTokens;
    address public verifier;
    bool public saleCreationPaused;

    error InvalidBuyer();
    error InvalidAsset();
    error InvalidPaymentAmount();
    error InvalidPaymentWindow();
    error UnsupportedPaymentChain();
    error UnsupportedPaymentToken();
    error DuplicatePaymentTuple();
    error SaleNotOpen();
    error PaymentOutsideWindow();
    error UnauthorizedVerifier();
    error ReclaimNotAvailable();
    error CreationPaused();
    error VerifierAlreadySet();

    event SaleCreated(bytes32 indexed saleId, address indexed seller, address indexed buyer, bytes32 paymentTuple);
    event AssetEscrowed(bytes32 indexed saleId, address indexed asset, uint256 tokenId, uint256 amount);
    event SaleSettled(
        bytes32 indexed saleId, address indexed buyer, address indexed seller, bytes32 queryId, uint64 sourceBlock
    );
    event AssetReclaimed(
        bytes32 indexed saleId, address indexed seller, address indexed asset, uint256 tokenId, uint256 amount
    );
    event VerifierConfigured(address indexed verifier);
    event SaleCreationPaused(bool paused);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CONFIG_ROLE, admin);
    }

    function setVerifier(address paymentVerifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (verifier != address(0)) revert VerifierAlreadySet();
        if (paymentVerifier == address(0)) revert UnauthorizedVerifier();
        verifier = paymentVerifier;
        emit VerifierConfigured(paymentVerifier);
    }

    function configureAsset(address asset, bool allowed) external onlyRole(CONFIG_ROLE) {
        approvedAssets[asset] = allowed;
    }

    function configurePaymentSource(uint64 chainKey, uint64 chainId, address token, bool allowed)
        external
        onlyRole(CONFIG_ROLE)
    {
        supportedPaymentChains[chainKey] = chainId;
        supportedPaymentTokens[chainKey][token] = allowed;
    }

    function pauseSaleCreation(bool paused) external onlyRole(CONFIG_ROLE) {
        saleCreationPaused = paused;
        emit SaleCreationPaused(paused);
    }

    function createSale(
        address buyer,
        address assetContract,
        uint256 tokenId,
        uint256 assetAmount,
        uint64 paymentChainKey,
        uint64 paymentChainId,
        address paymentToken,
        address paymentRecipient,
        uint256 paymentAmount,
        uint64 sourceStartBlock,
        uint64 sourceEndBlock
    ) external nonReentrant returns (bytes32 saleId) {
        if (saleCreationPaused) revert CreationPaused();
        if (buyer == address(0)) revert InvalidBuyer();
        if (!approvedAssets[assetContract] || assetAmount == 0) revert InvalidAsset();
        if (supportedPaymentChains[paymentChainKey] != paymentChainId) revert UnsupportedPaymentChain();
        if (!supportedPaymentTokens[paymentChainKey][paymentToken]) revert UnsupportedPaymentToken();
        if (paymentRecipient == address(0) || paymentAmount == 0) revert InvalidPaymentAmount();
        if (
            sourceStartBlock == 0 || sourceEndBlock <= sourceStartBlock
                || sourceEndBlock - sourceStartBlock > MAX_WINDOW
        ) revert InvalidPaymentWindow();
        bytes32 tuple = paymentTuple(paymentChainKey, paymentToken, buyer, paymentRecipient, paymentAmount);
        if (activeSaleForPaymentTuple[tuple] != bytes32(0)) revert DuplicatePaymentTuple();
        uint256 nonce = sellerNonces[msg.sender]++;
        saleId = keccak256(abi.encode(block.chainid, address(this), msg.sender, nonce));
        _sales[saleId] = Sale(
            msg.sender,
            buyer,
            assetContract,
            tokenId,
            assetAmount,
            paymentChainKey,
            paymentChainId,
            paymentToken,
            paymentRecipient,
            paymentAmount,
            sourceStartBlock,
            sourceEndBlock,
            uint64(block.timestamp) + MIN_RECLAIM_DELAY + (sourceEndBlock - sourceStartBlock)
                * ESTIMATED_SOURCE_BLOCK_TIME,
            SaleStatus.OPEN
        );
        activeSaleForPaymentTuple[tuple] = saleId;
        IERC1155(assetContract).safeTransferFrom(msg.sender, address(this), tokenId, assetAmount, "");
        emit SaleCreated(saleId, msg.sender, buyer, tuple);
        emit AssetEscrowed(saleId, assetContract, tokenId, assetAmount);
    }

    function settleFromVerifiedPayment(bytes32 saleId, bytes32 queryId, uint64 sourceBlock) external nonReentrant {
        if (msg.sender != verifier) revert UnauthorizedVerifier();
        Sale storage sale = _sales[saleId];
        if (sale.status != SaleStatus.OPEN) revert SaleNotOpen();
        if (sourceBlock < sale.sourceStartBlock || sourceBlock > sale.sourceEndBlock || queryId == bytes32(0)) {
            revert PaymentOutsideWindow();
        }
        sale.status = SaleStatus.SETTLED;
        delete activeSaleForPaymentTuple[_paymentTuple(sale)];
        IERC1155(sale.assetContract).safeTransferFrom(address(this), sale.buyer, sale.tokenId, sale.assetAmount, "");
        emit SaleSettled(saleId, sale.buyer, sale.seller, queryId, sourceBlock);
    }

    function reclaim(bytes32 saleId) external nonReentrant {
        Sale storage sale = _sales[saleId];
        if (sale.status != SaleStatus.OPEN) revert SaleNotOpen();
        if (msg.sender != sale.seller || block.timestamp < sale.reclaimAfter) revert ReclaimNotAvailable();
        sale.status = SaleStatus.RECLAIMED;
        delete activeSaleForPaymentTuple[_paymentTuple(sale)];
        IERC1155(sale.assetContract).safeTransferFrom(address(this), sale.seller, sale.tokenId, sale.assetAmount, "");
        emit AssetReclaimed(saleId, sale.seller, sale.assetContract, sale.tokenId, sale.assetAmount);
    }

    function getSale(bytes32 saleId) external view returns (Sale memory) {
        return _sales[saleId];
    }

    function paymentTuple(uint64 chainKey, address token, address buyer, address recipient, uint256 amount)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(chainKey, token, buyer, recipient, amount));
    }

    function _paymentTuple(Sale storage sale) private view returns (bytes32) {
        return
            paymentTuple(sale.paymentChainKey, sale.paymentToken, sale.buyer, sale.paymentRecipient, sale.paymentAmount);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Holder, AccessControl) returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
    }
}
