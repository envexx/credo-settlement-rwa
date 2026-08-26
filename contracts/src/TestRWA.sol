// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Testnet-only ERC-1155 used to demonstrate RWA ownership transfer.
contract TestRWA is ERC1155, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    mapping(uint256 tokenId => bytes32 metadataHash) public metadataHashes;
    event DemoAssetMinted(address indexed to, uint256 indexed tokenId, uint256 amount, bytes32 metadataHash);

    constructor(address admin, string memory metadataUri) ERC1155(metadataUri) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
    }

    function mint(address to, uint256 tokenId, uint256 amount, bytes32 metadataHash) external onlyRole(ISSUER_ROLE) {
        require(to != address(0) && amount != 0 && metadataHash != bytes32(0), "INVALID_MINT");
        bytes32 existing = metadataHashes[tokenId];
        require(existing == bytes32(0) || existing == metadataHash, "METADATA_IMMUTABLE");
        metadataHashes[tokenId] = metadataHash;
        _mint(to, tokenId, amount, "");
        emit DemoAssetMinted(to, tokenId, amount, metadataHash);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
