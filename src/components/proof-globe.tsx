import { Check, CircleDollarSign, Gem, ShieldCheck } from "lucide-react";

export function ProofGlobe() {
  return (
    <div
      className="proof-scene"
      aria-label="Payment proof moves from Sepolia to settle an RWA on Creditcoin"
    >
      <div className="scene-frame">
        <span>LIVE SETTLEMENT GRAPH</span>
        <i>TESTNET</i>
        <b />
      </div>
      <div className="scene-grid" />
      <div className="chain-plane chain-plane-source">
        <div className="chain-plane-top">
          <span className="chain-icon">
            <CircleDollarSign />
          </span>
          <span>
            <small>PAYMENT REMAINS ON</small>
            <strong>Sepolia</strong>
          </span>
        </div>
        <div className="chain-data">
          <span>USDC TRANSFER</span>
          <b>CONFIRMED</b>
        </div>
        <div className="chain-hash">0xfd25···3010</div>
      </div>
      <div className="proof-track">
        <i />
        <i />
        <i />
        <span className="proof-packet">
          <ShieldCheck />
        </span>
      </div>
      <div className="chain-plane chain-plane-target">
        <div className="chain-plane-top">
          <span className="chain-icon">
            <Gem />
          </span>
          <span>
            <small>ASSET REMAINS ON</small>
            <strong>Creditcoin</strong>
          </span>
        </div>
        <div className="chain-data">
          <span>RWA #1001</span>
          <b>
            <Check /> RELEASED
          </b>
        </div>
        <div className="chain-hash">0xcf9d···ff96</div>
      </div>
      <div className="scene-caption">
        <span>ASSETS STAY NATIVE</span>
        <em>ONLY PROOF CROSSES</em>
      </div>
    </div>
  );
}
