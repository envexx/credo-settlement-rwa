import { Wallet } from "ethers";
import { ApiError } from "./http";

export const DEMO_PRICE_RAW = 1_000_000n;
export const DEMO_WINDOW_BLOCKS = 300n;
export const MAX_OPEN_DEMO_SALES = 5;
export const DEMO_TOKEN_ID = 1001n;

export const testRwaAbi = [
  "function balanceOf(address,uint256) view returns(uint256)",
];

export const settlementAbi = [
  "function createSale(address,address,uint256,uint256,uint64,uint64,address,address,uint256,uint64,uint64) returns(bytes32)",
  "function reclaim(bytes32)",
  "function getSale(bytes32) view returns(tuple(address seller,address buyer,address assetContract,uint256 tokenId,uint256 assetAmount,uint64 paymentChainKey,uint64 paymentChainId,address paymentToken,address paymentRecipient,uint256 paymentAmount,uint64 sourceStartBlock,uint64 sourceEndBlock,uint64 reclaimAfter,uint8 status))",
];

export function buildDemoSaleTerms(input: {
  buyer: string;
  seller: string;
  assetContract: string;
  paymentToken: string;
  latestSourceBlock: bigint;
}) {
  const sourceStartBlock = input.latestSourceBlock + 1n;
  return {
    buyer: input.buyer,
    assetContract: input.assetContract,
    tokenId: DEMO_TOKEN_ID,
    assetAmount: 1n,
    paymentToken: input.paymentToken,
    paymentRecipient: input.seller,
    paymentAmount: DEMO_PRICE_RAW,
    sourceStartBlock,
    sourceEndBlock: sourceStartBlock + DEMO_WINDOW_BLOCKS,
  };
}

export function assertReservationAllowed(input: {
  buyerHasOpenSale: boolean;
  openCount: number;
  inventory: bigint;
}) {
  if (input.buyerHasOpenSale)
    throw new ApiError(
      409,
      "OPEN_DEMO_SALE_EXISTS",
      "Resume your existing live settlement",
    );
  if (input.openCount >= MAX_OPEN_DEMO_SALES)
    throw new ApiError(
      503,
      "DEMO_CAP_REACHED",
      "Live demo inventory is temporarily reserved",
    );
  if (input.inventory < 1n)
    throw new ApiError(
      503,
      "DEMO_INVENTORY_EMPTY",
      "Live demo inventory is currently unavailable",
    );
}

export function isReclaimable(reclaimAfter: bigint, nowSeconds: bigint) {
  return nowSeconds >= reclaimAfter;
}

export function demoSellerAddress(privateKey: string) {
  return new Wallet(privateKey).address.toLowerCase();
}
