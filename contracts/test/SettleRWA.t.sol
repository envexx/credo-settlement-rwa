// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {TestRWA} from "../src/TestRWA.sol";
import {SettleRWA} from "../src/SettleRWA.sol";

contract SettleRWATest is Test {
    TestRWA rwa;
    SettleRWA settlement;
    address seller = address(0xA11CE);
    address buyer = address(0xB0B);
    address usdc = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    function setUp() public {
        rwa = new TestRWA(address(this), "ipfs://demo/{id}.json");
        settlement = new SettleRWA(address(this));
        settlement.setVerifier(address(this));
        settlement.configureAsset(address(rwa), true);
        settlement.configurePaymentSource(1, 11155111, usdc, true);
        rwa.mint(seller, 1001, 1, keccak256("demo"));
        vm.prank(seller);
        rwa.setApprovalForAll(address(settlement), true);
    }

    function create() internal returns (bytes32) {
        vm.prank(seller);
        return settlement.createSale(buyer, address(rwa), 1001, 1, 1, 11155111, usdc, seller, 5_000_000_000, 100, 200);
    }

    function test_CreateEscrowsAsset() public {
        bytes32 id = create();
        assertEq(rwa.balanceOf(address(settlement), 1001), 1);
        assertEq(uint8(settlement.getSale(id).status), uint8(SettleRWA.SaleStatus.OPEN));
    }

    function test_ValidSettlementReleasesOnlyToBuyer() public {
        bytes32 id = create();
        settlement.settleFromVerifiedPayment(id, keccak256("query"), 150);
        assertEq(rwa.balanceOf(buyer, 1001), 1);
        assertEq(rwa.balanceOf(seller, 1001), 0);
    }

    function test_DuplicateTupleRejected() public {
        create();
        rwa.mint(seller, 1002, 1, keccak256("demo2"));
        vm.prank(seller);
        vm.expectRevert(SettleRWA.DuplicatePaymentTuple.selector);
        settlement.createSale(buyer, address(rwa), 1002, 1, 1, 11155111, usdc, seller, 5_000_000_000, 201, 300);
    }

    function test_NonVerifierRejected() public {
        bytes32 id = create();
        vm.prank(address(9));
        vm.expectRevert(SettleRWA.UnauthorizedVerifier.selector);
        settlement.settleFromVerifiedPayment(id, keccak256("query"), 150);
    }

    function test_ReplayAndSecondSettlementRejected() public {
        bytes32 id = create();
        settlement.settleFromVerifiedPayment(id, keccak256("query"), 150);
        vm.expectRevert(SettleRWA.SaleNotOpen.selector);
        settlement.settleFromVerifiedPayment(id, keccak256("query2"), 150);
    }

    function test_ReclaimDelay() public {
        bytes32 id = create();
        vm.prank(seller);
        vm.expectRevert(SettleRWA.ReclaimNotAvailable.selector);
        settlement.reclaim(id);
        vm.warp(block.timestamp + 24 hours);
        vm.prank(seller);
        vm.expectRevert(SettleRWA.ReclaimNotAvailable.selector);
        settlement.reclaim(id);
        vm.warp(block.timestamp + 100 * 12 seconds);
        vm.prank(seller);
        settlement.reclaim(id);
        assertEq(rwa.balanceOf(seller, 1001), 1);
    }

    function testFuzz_WrongSourceBlockRejected(uint64 blockNumber) public {
        vm.assume(blockNumber < 100 || blockNumber > 200);
        bytes32 id = create();
        vm.expectRevert(SettleRWA.PaymentOutsideWindow.selector);
        settlement.settleFromVerifiedPayment(id, keccak256("query"), blockNumber);
    }
}
