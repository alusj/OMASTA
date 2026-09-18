/**
 * DEMO CATALOGUE.
 *
 * None of this is verified Orange product or pricing data. It exists so the
 * experience can be reviewed end to end. Replace this module with a real
 * catalogue API response shaped the same way (see services/catalog).
 */

/**
 * Product imagery.
 *
 * `images` is an ordered list; the first entry is the cover used on cards.
 * An entry with `src` renders as a real photo: { id, src, label }. Until real
 * Orange product photography is supplied, entries without `src` render the
 * illustrated device motif from a different view, so galleries already work.
 */
function illustratedViews(art) {
  return [
    { id: "front", art, view: "front", label: "Front view (illustration)" },
    { id: "angle", art, view: "angle", label: "Angled view (illustration)" },
    { id: "detail", art, view: "detail", label: "Close-up (illustration)" },
    { id: "box", art, view: "box", label: "In the box (illustration)" },
  ];
}

export const PRODUCT_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "phones", label: "Phones" },
  { id: "internet", label: "Routers & MiFi" },
  { id: "sim", label: "SIM & eSIM" },
  { id: "accessories", label: "Accessories" },
];

export const PRODUCTS = [
  {
    id: "home-router-4g",
    categoryId: "internet",
    category: "Home internet",
    name: "4G Home Router",
    tagline: "Reliable internet for your home or small office.",
    description:
      "A plug-and-play router that shares one connection with the whole household. Connects up to 32 devices over Wi-Fi.",
    price: "SLE 1,250",
    priceValue: 1250,
    currency: "SLE",
    note: "Device only",
    badge: "Popular",
    art: "router",
    images: illustratedViews("router"),
    highlights: ["Up to 32 connected devices", "Works with any Orange data plan", "Simple setup, no engineer needed"],
    specs: [
      { label: "Network", value: "4G LTE" },
      { label: "Wi-Fi", value: "2.4 GHz + 5 GHz" },
      { label: "Power", value: "Mains, with battery backup slot" },
    ],
    isDemo: true,
  },
  {
    id: "mifi-pocket",
    categoryId: "internet",
    category: "Internet on the go",
    name: "Pocket MiFi",
    tagline: "A personal hotspot that fits in your pocket.",
    description:
      "Battery powered Wi-Fi for travel, campus and fieldwork. Share your connection with up to 10 devices.",
    price: "SLE 850",
    priceValue: 850,
    currency: "SLE",
    note: "Device only",
    badge: null,
    art: "mifi",
    images: illustratedViews("mifi"),
    highlights: ["Up to 10 devices", "All-day battery", "Pairs with any data bundle"],
    specs: [
      { label: "Network", value: "4G LTE" },
      { label: "Battery", value: "3000 mAh" },
      { label: "Weight", value: "120 g" },
    ],
    isDemo: true,
  },
  {
    id: "smart-5g-phone",
    categoryId: "phones",
    category: "Smartphone",
    name: "Smart 5G Handset",
    tagline: "A capable everyday phone, ready for faster networks.",
    description:
      "A balanced smartphone with a large screen and long battery life, ready for 5G where coverage is available.",
    price: "SLE 3,400",
    priceValue: 3400,
    currency: "SLE",
    note: "Or pay in instalments",
    badge: "New",
    art: "phone",
    images: illustratedViews("phone"),
    highlights: ["6.6 inch display", "5000 mAh battery", "Dual SIM + eSIM ready"],
    specs: [
      { label: "Storage", value: "128 GB" },
      { label: "Memory", value: "6 GB" },
      { label: "Camera", value: "50 MP main" },
    ],
    isDemo: true,
  },
  {
    id: "essential-phone",
    categoryId: "phones",
    category: "Smartphone",
    name: "Essential 4G Phone",
    tagline: "Everything you need, nothing you do not.",
    description: "An affordable 4G smartphone for calls, messaging, Orange Money and everyday browsing.",
    price: "SLE 1,150",
    priceValue: 1150,
    currency: "SLE",
    note: "Device only",
    badge: null,
    art: "phone",
    images: illustratedViews("phone"),
    highlights: ["Long battery life", "Orange Money ready", "Dual SIM"],
    specs: [
      { label: "Storage", value: "64 GB" },
      { label: "Memory", value: "4 GB" },
      { label: "Network", value: "4G LTE" },
    ],
    isDemo: true,
  },
  {
    id: "starter-sim",
    categoryId: "sim",
    category: "SIM",
    name: "Prepaid Starter SIM",
    tagline: "Get an Orange number the same day.",
    description:
      "A prepaid SIM with starter credit. Registration is completed at an Orange shop or authorised agent with a valid ID.",
    price: "SLE 25",
    priceValue: 25,
    currency: "SLE",
    note: "Includes starter credit",
    badge: null,
    art: "sim",
    images: illustratedViews("sim"),
    highlights: ["Same-day activation", "Keep your number when you upgrade", "ID required for registration"],
    specs: [
      { label: "Format", value: "Nano / Micro / Standard" },
      { label: "Registration", value: "Valid ID required" },
    ],
    isDemo: true,
  },
  {
    id: "esim-profile",
    categoryId: "sim",
    category: "eSIM",
    name: "eSIM Profile",
    tagline: "A digital SIM for compatible devices.",
    description: "Activate an Orange line on a supported phone or watch without a physical SIM card.",
    price: "SLE 40",
    priceValue: 40,
    currency: "SLE",
    note: "Compatible devices only",
    badge: "Digital",
    art: "sim",
    images: illustratedViews("sim"),
    highlights: ["No physical card", "Keep a second line active", "Transferable between devices"],
    specs: [
      { label: "Requires", value: "eSIM capable device" },
      { label: "Activation", value: "QR profile" },
    ],
    isDemo: true,
  },
  {
    id: "power-bank",
    categoryId: "accessories",
    category: "Accessory",
    name: "20,000 mAh Power Bank",
    tagline: "Stay powered through the day.",
    description: "Fast-charge power bank with two outputs, sized for phones, MiFi devices and small tablets.",
    price: "SLE 480",
    priceValue: 480,
    currency: "SLE",
    note: "12 month warranty",
    badge: null,
    art: "accessory",
    images: illustratedViews("accessory"),
    highlights: ["Charges a phone up to 4 times", "Dual USB output", "Charges a MiFi too"],
    specs: [
      { label: "Capacity", value: "20,000 mAh" },
      { label: "Output", value: "USB-A + USB-C" },
    ],
    isDemo: true,
  },
  {
    id: "router-bundle-pack",
    categoryId: "internet",
    category: "Bundle offer",
    name: "Router + 50 GB Pack",
    tagline: "A router and a month of data together.",
    description: "A starter pack that pairs the 4G Home Router with a 50 GB monthly data allowance.",
    price: "SLE 1,590",
    priceValue: 1590,
    currency: "SLE",
    note: "Promotional pack",
    badge: "Save",
    art: "router",
    images: illustratedViews("router"),
    highlights: ["Router included", "50 GB for the first month", "Set up in minutes"],
    specs: [
      { label: "Includes", value: "4G Home Router" },
      { label: "Data", value: "50 GB / 30 days" },
    ],
    isDemo: true,
  },
];
