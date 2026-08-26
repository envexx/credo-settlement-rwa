# SettleRWA — Infra Workplan: Packaging Settlement Layer

**Dokumen:** Rencana kerja detail repositioning ke "Settlement layer untuk RWA di Creditcoin"
**Konteks:** BUIDL CTC 2026 Fall — RWA Track · Creditcoin CC3 Testnet
**Prinsip induk:** TIDAK ADA perubahan pada kontrak inti yang sudah live (`SettleRWA`, `PaymentVerifierUSC`, `TestRWA`). Seluruh item di dokumen ini adalah pekerjaan **packaging, dokumentasi, dan demonstrasi** — bukan fitur baru di protocol layer.
**Status:** ⬜ Belum dieksekusi · disusun 26 Agustus 2026

---

## 1. Tujuan

Positioning yang dipilih:

> **"SettleRWA adalah settlement layer untuk RWA di Creditcoin: aset tidak pernah meninggalkan chain, pembayaran tidak pernah di-bridge — hanya bukti kriptografis yang menyeberang. Aplikasi apa pun — marketplace, OTC desk, platform issuance — dapat memakai escrow proof-triggered yang sama."**

Agar klaim "layer" tidak kosong, builder luar harus bisa mengonsumsi protokol **tanpa membaca kode sumber**. Itu membutuhkan 6 paket kerja berikut.

---

## 2. Ringkasan Skala Kerja

| # | Artefak | Kondisi | Sisa kerja | Estimasi | Prioritas |
|---|---|---|---|---|---|
| 1 | ABI (kurasi + publish) | ✅ tergenerate Foundry | Kurasi + publish folder + label stabilitas | ~jam | P1 |
| 2 | Deployment manifest (lengkap) | ✅ ada | Lengkapi tx hash/link/status verify | menit–jam | P1 |
| 3 | Param spec `createSale` | ⬜ belum ada | Menulis dokumen + contoh | ~½ hari | P1 |
| 4 | Integration guide (alur 3 langkah) | ⬜ belum ada | Menulis | ~½ hari | P2 |
| 5 | Bukti komposability (aset ke-2, kontrak sama) | ⬜ belum ada | Script + eksekusi testnet | ~½–1 hari | P2 |
| 6 | TS SDK / npm package / subgraph | ❌ tidak untuk hackathon | Ditunda agar arsitektur matang dan tepat | pasca-hackathon | P3 |

**Total estimasi item 1–5:** ± 2 hari kerja efektif (tidak termasuk waktu tunggu attestation testnet 8–10 menit per run demo).

**Dependensi:**

```text
(1) ABI ────────────┐
(2) Manifest ───────┼──→ (4) Integration guide ──→ submission assets
(3) Param spec ─────┘         │
                              ↓
                    (5) Bukti komposability
```

Item 3 tidak bergantung apa pun dan bisa dimulai kapan saja. Item 5 secara teknis independen, tapi sebaiknya dieksekusi setelah guide selesai karena eksekusinya sekaligus memvalidasi isi guide.

---

## 3. Detail per Item

### Item 1 — ABI: Kurasi + Publish Folder + Label Stabilitas (~jam)

**Tujuan.** Builder mendapat ABI tanpa install Foundry, dan tahu persis fungsi mana yang menjadi permukaan publik yang stabil.

**Deliverable:**

```text
docs/integration/
├── abis/
│   ├── SettleRWA.json            ← dari contracts/out/SettleRWA.sol/SettleRWA.json
│   ├── TestRWA.json              ← untuk issuer yang mau mint sendiri
│   └── PaymentVerifierUSC.json   ← read-only bagi integrator (events + processedQueries)
└── ABI-STABILITY.md              ← label stabilitas
```

**Langkah:**

- [ ] `forge build`, salin 3 artifact ABI ke `docs/integration/abis/`.
- [ ] Tulis `ABI-STABILITY.md`: daftar fungsi **permukaan integrator (stabil)** vs **admin only**:

```text
Permukaan integrator (stabil):          Admin only (bukan bagian kontrak publik):
├── createSale(...) → saleId            ├── setVerifier / configureAsset
├── getSale(saleId)                     ├── configurePaymentSource
├── reclaim(saleId)                     ├── pauseSaleCreation
├── paymentTuple(...)                   └── (CONFIG_ROLE / DEFAULT_ADMIN_ROLE)
├── sellerNonces(seller)
└── activeSaleForPaymentTuple(tuple)
```

- [ ] Cantumkan daftar event yang wajib di-index integrator: `SaleCreated`, `AssetEscrowed`, `SaleSettled`, `AssetReclaimed` (SettleRWA) dan `PaymentProofAccepted` (Verifier).
- [ ] Nyatakan aturan versi: perubahan ABI di masa depan = versi baru manifest; ABI lama tetap tersedia.

**Acceptance criteria (terbukti dengan perintah):**

- [ ] `ls docs/integration/abis/*.json` berisi 3 file; ukuran > 0.
- [ ] Isi ABI identik dengan hasil `forge build` terakhir (`cmp` terhadap `contracts/out/...`).
- [ ] CI tetap hijau (dokumen tidak menyentuh jalur lint kode).

**Risiko/catatan:** Jangan pernah mengedit ABI manual — selalu hasil generate. Jika build ulang menghasilkan diff, itu sinyal source berubah → hentikan dan selidiki.

---

### Item 2 — Deployment Manifest: Lengkapi Tx Hash / Link / Status Verify (menit–jam)

**Tujuan.** Manifest menjadi *single source of truth* alamat yang bisa diverifikasi builder sendiri.

**Kondisi saat ini** (`contracts/deployments/cc3-testnet.json`):

```jsonc
{
  "network": "creditcoin-cc3-testnet",
  "chainId": 102031,
  "contracts": {
    "EvmV1Decoder":       "0xc8835bD23bd9594E1126c0714D1B3B7c38F20091",
    "TestRWA":            "0x7EE76EdBD09348826cc754453caEcf149b24927c",
    "SettleRWA":          "0x4558a0C6E992bdA8E8987a4Aedc296031e5AB006",
    "PaymentVerifierUSC": "0xB5DfeC9747719CAc1a6e6546EcFa1bAc028cC531"
  },
  "source": { "chainKey": 1, "chainId": 11155111,
              "usdc": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" }
}
```

**Deliverable:** manifest diperluas + sinkron dengan `docs/evidence/contracts/deployment-txs.md`:

```jsonc
{
  // ...field lama tetap...
  "deployment": {
    "deployedAt": "<ISO date>",
    "sourceCommit": "<git commit/tag saat deploy>",
    "verified": false,                       // ← update saat Blockscout verify selesai
    "txs": {
      "TestRWA":            { "hash": "0x...", "explorer": "https://creditcoin-testnet.blockscout.com/tx/0x..." },
      "SettleRWA":          { "hash": "0x...", "explorer": "..." },
      "PaymentVerifierUSC": { "hash": "0x...", "explorer": "..." }
    }
  },
  "protocolLimits": {
    "maxWindowBlocks": 50000,                // MAX_WINDOW
    "reclaimDelaySeconds": 86400,            // MIN_RECLAIM_DELAY = 24 jam
    "estimatedSourceBlockTimeSeconds": 12    // ESTIMATED_SOURCE_BLOCK_TIME
  }
}
```

**Langkah:**

- [ ] Kumpulkan tx hash deploy dari `docs/evidence/contracts/deployment-txs.md` (sudah ada) → masukkan ke manifest.
- [ ] Tambahkan `sourceCommit` (commit repo saat deploy) + tanggal.
- [ ] Tambahkan blok `protocolLimits` dari konstanta kontrak.
- [ ] (Opsional tapi disarankan) verifikasi source di Blockscout → set `"verified": true`.

**Acceptance criteria:**

- [ ] `jq '.deployment.txs | length' contracts/deployments/cc3-testnet.json` ≥ 3, semua hash valid format `0x…64 hex`.
- [ ] Semua link explorer dapat dibuka dan menunjukkan tx sukses.
- [ ] Manifest tetap lolos `npm run format:check`.

**Risiko/catatan:** Testnet bisa reset (§5.1 spec) — karena itu `sourceCommit` + redeploy script (`npm run contracts:deploy`) adalah pasangan pemulihannya; jangan lewatkan field commit.

---

### Item 3 — Param Spec `createSale` (~½ hari)

**Tujuan.** "Kontrak antar-manusia": aturan mengisi parameter tanpa salah satuan dan tanpa melanggar validasi on-chain. Bagian tersulit bagi integrator bukan memanggil fungsi, tapi mengisi field dengan benar.

**Deliverable:** `docs/integration/PARAM-SPEC.md`

**Isi wajib:**

**(a) Tabel parameter `createSale`:**

| Field | Tipe | Aturan | Error on-chain jika salah |
|---|---|---|---|
| `buyer` | address | ≠ zero; private sale — hanya wallet ini yang settlement-nya sah | `InvalidBuyer()` |
| `assetContract` | address | Harus terdaftar allowlist (hubungi admin; proses curated) | `InvalidAsset()` |
| `tokenId` | uint256 **sebagai decimal string** | Seller pegang balance & sudah `setApprovalForAll` | `InvalidAsset()` |
| `assetAmount` | uint256 string | > 0 | `InvalidAsset()` |
| `paymentChainKey` | uint64 | `1` (Sepolia @ Attestcoin) | `UnsupportedPaymentChain()` |
| `paymentChainId` | uint64 | `11155111`; harus cocok pasangan chainKey | `UnsupportedPaymentChain()` |
| `paymentToken` | address | USDC resmi Sepolia (allowlist) | `UnsupportedPaymentToken()` |
| `paymentRecipient` | address | Wallet seller penerima USDC; ≠ zero | `InvalidPaymentAmount()` |
| `paymentAmount` | uint256 string, **raw 6-decimal** | `"5000 USDC"` = `"5000000000"`; > 0 | `InvalidPaymentAmount()` |
| `sourceStartBlock` | uint64 | Blok Sepolia terkini + 1 | `InvalidPaymentWindow()` |
| `sourceEndBlock` | uint64 | `start < end ≤ start + 50_000` | `InvalidPaymentWindow()` |

**(b) Aturan lintas-field (wajib didokumentasikan — penyebab gagal #1 integrator):**

1. **Jangan pakai JS `number`** untuk semua nilai uint256 — string/BigInt saja (TDD §1.13).
2. **chainKey ≠ chainId** (ADR-013): `1` dan `11155111` bukan typo.
3. **Tuple uniqueness:** kombinasi `(chainKey, token, buyer, recipient, amount)` identik hanya boleh dipakai satu sale OPEN → `DuplicatePaymentTuple()`. Cara menghindari: variasikan recipient/amount/window, atau tunggu settle/reclaim sale sebelumnya.
4. **Window = umur komersial sale:** 50.000 blok ≈ ±7 hari (12 dtk/blok). Setelah lewat + grace 24 jam, aset bisa direclaim seller.
5. Buyer yang benar saja yang settlementnya sah; pembayaran wallet lain akan ditolak verifier.

**(c) Contoh payload nyata (copy-paste-ready):**

```jsonc
// Contoh: RWA builder lain "GreenBond #777", harga 100 USDC
{
  "buyer":            "0xBuyerWallet...",
  "assetContract":    "0xTheirOwnERC1155...",
  "tokenId":          "777",
  "assetAmount":      "1",
  "paymentChainKey":  "1",
  "paymentChainId":   "11155111",
  "paymentToken":     "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "paymentRecipient": "0xSellerWallet...",
  "paymentAmount":    "100000000",           // 100 USDC × 10^6
  "sourceStartBlock": "11600001",
  "sourceEndBlock":   "11607201"             // +7200 blok ≈ 24 jam
}
```

**(d) Tabel error custom** (semua `error` Solidity + artinya + apakah retriable bagi worker).

**Acceptance criteria:**

- [ ] Dokumen lolos review silang terhadap source: setiap baris validasi cocok dengan `SettleRWA.sol` (tidak ada klaim yang tidak ada di kontrak).
- [ ] Semua contoh lolos schema Zod `prepareSaleRequest` API (format sama dengan `/api/v1/sales/prepare`).
- [ ] Lolos `npm run format:check`.

**Risiko/catatan:** Sumber kebenaran adalah kontrak live, bukan dokumen. Jika kontrak berubah (harusnya tidak, selama hackathon), spec wajib ikut direvisi di commit yang sama.

---

### Item 4 — Integration Guide: Alur 3 Langkah (~½ hari)

**Tujuan.** Dari nol sampai "aset saya escrow dan settle otomatis" tanpa membaca kode internal.

**Deliverable:** `docs/integration/README.md`

**Struktur wajib:**

```text
Langkah 0  Baca manifest → ambil alamat SettleRWA @ cc3-testnet (+ verifikasi explorer)
Langkah 1  Ajukan aset: kirim address ERC-1155 → admin approve via configureAsset
           (curated onboarding untuk hackathon; jalur governance = pasca-hackathon)
Langkah 2  Di kontrakmu: setApprovalForAll(SettleRWA, true)
Langkah 3  Panggil createSale(params dari PARAM-SPEC) → dapatkan saleId
           ── selesai; sisanya otomatis ──
           Buyer bayar USDC di Sepolia → worker ambil proof Attestcoin
           → PaymentVerifierUSC → escrow melepas aset ke buyer
Langkah 4  (Opsional) index events SaleCreated/AssetEscrowed/SaleSettled
           untuk dashboard-mu sendiri; atau pakai API bawaan:
           POST /api/v1/sales/index  (indexer mirror-of-chain, ADR-010)
           GET  /api/v1/sales/:saleId/settlement  (status gabungan)
```

**Kelengkapan lain:**

- [ ] Snippet viem/ethers minimal untuk `createSale` (≤ 15 baris, copy-paste-ready).
- [ ] Penjelasan model trust singkat: *"worker discovers, Attestcoin proves, contract decides"* — integrator tahu worker TIDAK punya otoritas settlement (INV-007).
- [ ] FAQ mini: kenapa settlement butuh 8–10 menit (latensi attestation = properti protokol), apa itu `DuplicatePaymentTuple`, bagaimana recovery kalau browser buyer tertutup (§2.28).
- [ ] Halaman status/kontak: cara mengajukan allowlist aset.

**Acceptance criteria:**

- [ ] Orang luar (bukan penulis kode) bisa menyusuri guide tanpa bertanya — uji dengan 1 pembaca fresh.
- [ ] Semua alamat/angka di guide bersumber dari manifest (tanpa hardcode ganda yang bisa drift).
- [ ] Lolos `npm run format:check`.

**Risiko/catatan:** Jangan janjikan "permissionless" selama allowlist masih curated — framing jujur: *"curated onboarding hari ini, jalur governance besok."*

---

### Item 5 — Bukti Komposability: Aset ke-2 via Kontrak yang Sama (~½–1 hari)

**Tujuan.** Membuktikan generalitas layer: **dua aset berbeda, satu settlement layer, tanpa deploy ulang SettleRWA**. Infra tanpa integrator kedua hanyalah klaim; ini demonstrasinya.

**Desain demonstrasi:**

```text
Kontrak SettleRWA: TETAP SATU (0x4558a0C6...) — tidak di-redeploy, tidak di-upgrade.

Aset A (sudah ada):  TestRWA #1001  — "Demo Treasury Note 2026-A"
Aset B (baru):       kontrak ERC-1155 TERPISAH milik "builder ketiga"
                     (deploy kontrak demo baru utk mensimulasikan pihak luar;
                      boleh nama bebas, mis. GreenBondDemo.sol, tokenId 777)

Alur:
1. Deploy aset B (kontrak pihak-ketiga simulasi)
2. Admin: configureAsset(assetB, true)          ← satu-satunya sentuhan admin
3. Owner aset B: setApprovalForAll(SettleRWA, true)
4. createSale(buyer, assetB, 777, ...)          ← jalur yang sama persis
5. Buyer bayar USDC Sepolia → worker → proof → SETTLED
6. Rekam evidence: balanceOf sebelum/sesudah utk KEDUA aset
```

**Deliverable:**

- [ ] `contracts/src/GreenBondDemo.sol` (atau nama serupa) — ERC-1155 demo polos, ~30 baris, gaya konsisten `TestRWA.sol`.
- [ ] `scripts/demo-composability.ts` — orkestrasi langkah 1–6, tulis evidence otomatis.
- [ ] Evidence mengikuti pola §3.20 TDD:

```text
docs/evidence/composability/
├── asset-b-addresses.json        ← alamat + tx deploy aset B
├── before.json                   ← balanceOf(seller/buyer) utk aset A dan B
├── after.json                    ← A tak berubah, B pindah ke buyer
├── payment-tx.json               ← hash Sepolia
└── settlement-tx.json            ← hash CC3 + queryId
```

**Acceptance criteria:**

- [ ] Alamat SettleRWA di semua evidence = manifest (bukti tidak ada redeploy).
- [ ] `after.json`: buyer balance aset B = 1, escrow = 0, aset A tidak tersentuh.
- [ ] Satu kali eksekusi penuh script end-to-end sukses (termasuk menunggu attestation 8–10 menit).
- [ ] Semua gate lokal tetap hijau: `npm test`, `forge test`, typecheck, lint, build.

**Risiko/catatan:**
- Biaya: 1× gas deploy aset B + 1× createSale + 1× settlement di CC3 + 1 transfer USDC Sepolia — pastikan faucet tCTC cukup sebelum mulai.
- Jangan jadikan aset B bagian dari kontrak inti — ia HARUS kontrak terpisah agar argumen komposability sah.
- Simpan mnemonic/wallet demo sesuai kebijakan repo (jangan commit key).

---

### Item 6 — TS SDK / npm Package / Subgraph — ❌ Pasca-Hackathon

**Keputusan:** tidak dikerjakan dalam window hackathon, dengan alasan arsitektural:

| Paket | Kenapa harus menunggu |
|---|---|
| **TS SDK** (`@settlerwa/sdk`) | Permukaannya harus dibekukan dulu (item 1–4 stabil + pengalaman ≥1 integrator nyata) sebelum dikemas jadi library — SDK yang salah bentuk lebih merugikan daripada tidak ada. |
| **npm package** | Publikasi = janji semver + maintenance. Baru layak setelah ada konsumen nyata dan CI release pipeline (trusted publishing, changelog). |
| **Subgraph/indexer publik** | Nilainya besar untuk marketplace pihak ketiga, tapi desain entity-nya idealnya menunggu Fase B (reservation layer) supaya tidak di-migrate dua kali. |

Catatan posisi: item 6 adalah **pembeda pasca-hackathon**, bukan prasyarat kredibilitas submission. Submission cukup terbukti dengan item 1–5 + negative live tests yang sudah tercatat di `docs/TDD-AUDIT.md`.

---

## 4. Urutan Eksekusi yang Disarankan

```text
Hari 1 pagi   Item 1 (ABI) + Item 2 (Manifest)      ← cepat, buka jalan
Hari 1 siang  Item 3 (Param spec)                    ← inti penulisan
Hari 2 pagi   Item 4 (Integration guide)
Hari 2 siang  Item 5 (Composability demo)            ← eksekusi testnet
              (jalankan sekali bersih; kalau perlu retry, backoff 10 mnt)
```

Aturan eksekusi (mengikuti disiplin repo):

1. Setiap item ditutup dengan **evidence berupa keluaran perintah nyata** (bukan pernyataan) — dicatat di bagian bawah file terkait atau `docs/TDD-AUDIT.md`.
2. Tidak ada perubahan `contracts/src/*` kecuali `GreenBondDemo.sol` (item 5).
3. Semua commit memakai Conventional Commits (§3.11): `docs(integration): ...`, `feat(demo): ...`.
4. Scope freeze tetap berlaku untuk hal lain: negative live tests + verifikasi Blockscout tetap prioritas yang tidak boleh tergeser oleh workplan ini — jadwalkan sebagai item paralel/berikutnya.

---

## 5. Definition of Done Workplan Ini

```text
[ ] docs/integration/abis/ berisi 3 ABI hasil generate + ABI-STABILITY.md
[ ] Manifest berisi tx hash + explorer link + sourceCommit + protocolLimits
[ ] PARAM-SPEC.md lengkap (tabel, aturan lintas-field, contoh, daftar error)
[ ] Integration guide alur 0–4 + snippet + FAQ + model trust
[ ] Composability demo: aset B settle via SettleRWA yang sama, evidence lengkap
[ ] npm run format:check && npm run lint && npm run typecheck && npm test && forge test → hijau semua
[ ] README bagian atas merujuk docs/integration/ sebagai pintu masuk builder
```

---

*Lampiran — konstanta resmi untuk penulis dokumentasi (sumber: manifest + kontrak live):*

| Konstanta | Nilai |
|---|---|
| CC3 RPC | `https://rpc.cc3-testnet.creditcoin.network` |
| CC3 chainId | `102031` |
| Explorer | `https://creditcoin-testnet.blockscout.com` |
| Sepolia chainId (EVM) | `11155111` |
| Sepolia Attestcoin chainKey | `1` |
| Sepolia USDC resmi | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` (6 desimal) |
| Proof Builder | `https://prover.cc3-testnet.creditcoin.network/` |
| Native Query Verifier | `0x0000000000000000000000000000000000000FD2` |
| `MAX_WINDOW` | `50_000` blok |
| `MIN_RECLAIM_DELAY` | `24 jam` |
| Estimasi blok Sepolia | `12 detik` |
| Latensi attestation tipikal | `8–10 menit` (properti protokol) |
