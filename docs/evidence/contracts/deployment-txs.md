# CC3 deployment transactions

## Active deployment (v3)

- TestRWA: [0xfd43...5ffd](https://creditcoin-testnet.blockscout.com/tx/0xfd436fa3e965b8e66d22f72887349c45136a77e519b6f419899c209da8175ffd)
- SettleRWA: [0x8082...3f89](https://creditcoin-testnet.blockscout.com/tx/0x80822e27d00dbf9f9ec57a6daff6447b05f70ae58726965d5de58be48cd13f89)
- EvmV1Decoder: [0xe28d...22d5](https://creditcoin-testnet.blockscout.com/tx/0xe28dd3bb01bb7f04efcd81588beda724ae4c5d8460a73112822d7cd1797f22d5)
- PaymentVerifierUSC: [0x91cb...8e55](https://creditcoin-testnet.blockscout.com/tx/0x91cb37733e53f1981e93c7df4638ef2b3d772dc0045ee12bc1a58721fce98e55)
- Verifier binding: [0x8fd5...61cc](https://creditcoin-testnet.blockscout.com/tx/0x8fd5e3f4d0c00bbc1f46ed92beea3976ddf6da3be46341f1e6f2278d1ee861cc)
- Asset allowlist: [0xbe22...c536](https://creditcoin-testnet.blockscout.com/tx/0xbe22a3ffeaec34446110ac2905112c2a25295955ff8a6c1094f59773a321c536)
- Sepolia/USDC source configuration: [0x9b5c...01fa](https://creditcoin-testnet.blockscout.com/tx/0x9b5cb4cb6ec88049f19c68e6d47067a1b1fc849cbe8b94c46c4724b783bd01fa)
- Demo RWA mint: [0x269f...8efd](https://creditcoin-testnet.blockscout.com/tx/0x269fde43b104cb8f0e5a1c2e6ddee9ae8679a35cc3c6aa70e47f59e939618efd)

This deployment includes the corrected reclaim deadline, verifier reentrancy protection, and checks-effects-interactions ordering.

## Active v3 end-to-end evidence

- Sale creation: [0xa04c...17c8](https://creditcoin-testnet.blockscout.com/tx/0xa04c400db1df80e263563aeb9498734019facf06393c39b9997b434d601217c8)
- Buyer Sepolia USDC payment: [0xfd25...3010](https://sepolia.etherscan.io/tx/0xfd25089e189c53a5a39fc81eb0054e1069f66e3a761ddedeb64cd64df2383010)
- CC3 settlement: [0xcf9d...ff96](https://creditcoin-testnet.blockscout.com/tx/0xcf9dd953498e5378d4f815b997a6a1a44e8c03ee6a3ebf23f1c4b3c2956eff96)

Seller and Buyer are distinct wallets. The verified final state is Buyer balance `1`, escrow balance `0`, sale status `SETTLED`, and replay marker `true`.

## Historical v1 evidence

- Sepolia USDC payment: [0x197c...8b00](https://sepolia.etherscan.io/tx/0x197c0d7317262c193dbdfbf7b3e2c625d1a0f128050057935ea5c60a0e5c8b00)
- CC3 settlement: [0xd7ab...9d0](https://creditcoin-testnet.blockscout.com/tx/0xd7abb061ac90b7c0764323787f143060262448a8b06d62e95082502de3d969d0)
