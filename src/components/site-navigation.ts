import {
  FileCode2,
  Network,
  ReceiptText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type SiteMenu = {
  label: string;
  items: Array<[string, string, string, LucideIcon]>;
};

export const siteMenus: SiteMenu[] = [
  {
    label: "Product",
    items: [
      [
        "Mechanism",
        "How proof-triggered settlement works",
        "/#mechanism",
        Network,
      ],
      [
        "Evidence",
        "Inspect the public testnet proof",
        "/#evidence",
        ShieldCheck,
      ],
    ],
  },
  {
    label: "Developers",
    items: [
      [
        "Developer quickstart",
        "Integrate a sale from request to settlement",
        "/infra#quickstart",
        FileCode2,
      ],
      [
        "API reference",
        "Authentication, sales and payment endpoints",
        "/infra#api",
        Network,
      ],
      [
        "Interactive playground",
        "Run the complete settlement flow",
        "/playground",
        ReceiptText,
      ],
    ],
  },
];
