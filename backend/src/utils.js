export function parseProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    mrp: row.mrp,
    discount: row.discount,
    image: row.image,
    hoverImage: row.hover_image,
    colors: JSON.parse(row.colors || "[]"),
    sizes: JSON.parse(row.sizes || "[]"),
    tag: row.tag || undefined,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    sortOrder: row.sort_order,
    active: !!row.active,
  };
}

export function boolToInt(v) {
  return v ? 1 : 0;
}
