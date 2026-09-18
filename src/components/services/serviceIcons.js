import {
  CreditCard,
  Globe,
  Grid3x3,
  Hash,
  Headphones,
  Layers,
  MapPin,
  Phone,
  QrCode,
  Receipt,
  Router,
  Smartphone,
  Tag,
  Wallet,
  Wifi,
} from "lucide-react";

/** Icon keys used by `data/orangeServices.js`, resolved in one place. */
const SERVICE_ICONS = {
  wifi: Wifi,
  smartphone: Smartphone,
  wallet: Wallet,
  headphones: Headphones,
  layers: Layers,
  tag: Tag,
  router: Router,
  receipt: Receipt,
  "map-pin": MapPin,
  hash: Hash,
  card: CreditCard,
  qr: QrCode,
  globe: Globe,
  phone: Phone,
};

export function getServiceIcon(key) {
  return SERVICE_ICONS[key] || Grid3x3;
}
