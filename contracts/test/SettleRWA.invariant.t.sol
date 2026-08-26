// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {TestRWA} from "../src/TestRWA.sol";
import {SettleRWA} from "../src/SettleRWA.sol";

contract SettlementHandler is Test {
    SettleRWA internal immutable settlement;
    bytes32 internal immutable saleId;
    address internal immutable seller;

    constructor(SettleRWA settlement_, bytes32 saleId_, address seller_) {
        settlement = settlement_;
        saleId = saleId_;
        seller = seller_;
    }

    function settle(bytes32 queryId, uint64 sourceBlock) external {
        sourceBlock = uint64(bound(sourceBlock, 100, 200));
        try settlement.settleFromVerifiedPayment(saleId, queryId, sourceBlock) {} catch {}
    }

    function reclaim() external {
        vm.warp(block.timestamp + 25 hours);
        vm.prank(seller);
        try settlement.reclaim(saleId) {} catch {}
    }
}

contract SettleRWAInvariantTest is StdInvariant, Test {
    TestRWA internal rwa;
    SettleRWA internal settlement;
    SettlementHandler internal handler;
    address internal seller = address(0xA11CE);
    address internal buyer = address(0xB0B);
    bytes32 internal saleId;

    function setUp() public {
        rwa = new TestRWA(address(this), "ipfs://demo/{id}.json");
        settlement = new SettleRWA(address(this));
        settlement.configureAsset(address(rwa), true);
        settlement.configurePaymentSource(1, 11155111, address(0xCAFE), true);
        rwa.mint(seller, 1001, 1, keccak256("demo"));
        vm.startPrank(seller);
        rwa.setApprovalForAll(address(settlement), true);
        saleId = settlement.createSale(
            buyer, address(rwa), 1001, 1, 1, 11155111, address(0xCAFE), seller, 5_000_000, 100, 200
        );
        vm.stopPrank();
        handler = new SettlementHandler(settlement, saleId, seller);
        settlement.setVerifier(address(handler));
        targetContract(address(handler));
    }

    function invariant_AssetIsNeverDuplicatedOrLost() public view {
        uint256 total =
            rwa.balanceOf(seller, 1001) + rwa.balanceOf(buyer, 1001) + rwa.balanceOf(address(settlement), 1001);
        assertEq(total, 1);
    }

    function invariant_StatusMatchesAssetCustody() public view {
        SettleRWA.SaleStatus status = settlement.getSale(saleId).status;
        if (status == SettleRWA.SaleStatus.OPEN) assertEq(rwa.balanceOf(address(settlement), 1001), 1);
        if (status == SettleRWA.SaleStatus.SETTLED) assertEq(rwa.balanceOf(buyer, 1001), 1);
        if (status == SettleRWA.SaleStatus.RECLAIMED) assertEq(rwa.balanceOf(seller, 1001), 1);
    }
}
