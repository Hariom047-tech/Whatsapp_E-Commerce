const SLUG_MAP = {
  discover: null,
  shirts: "shirts",
  shirt: "shirts",
  "t-shirts": "t-shirts",
  "t-shirt": "t-shirts",
  tshirts: "t-shirts",
  jeans: "jeans",
  trousers: "trousers",
  "cargo pants": "cargo-pants",
  cargos: "cargo-pants",
  "cargo-pants": "cargo-pants",
  shoes: "shoes",
  overshirt: "overshirt",
  overshirts: "overshirt",
  "plus-size": "plus-size",
  "plus size": "plus-size",
  shorts: "shorts",
  polos: "t-shirts",
  sunglasses: "sunglasses",
  perfumes: "perfumes",
  "new arrivals": null,
  sale: null,
};

export function nameToSlug(name) {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (key in SLUG_MAP) return SLUG_MAP[key];
  return key.replace(/\s+/g, "-");
}

export function categoryPath(slugOrName) {
  const slug = typeof slugOrName === "string" && slugOrName.includes("/")
    ? slugOrName
    : nameToSlug(slugOrName);
  if (!slug) return "/shop";
  return `/category/${slug}`;
}

export function productPath(id) {
  return `/product/${id}`;
}
