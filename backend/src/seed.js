import bcrypt from "bcryptjs";
import db, { initDb } from "./db.js";

const announcementMessages = [
  "FREE SHIPPING ON ALL PREPAID ORDERS",
  "ADDITIONAL 10% OFF ON ORDERS ABOVE ₹3999",
  "SIGN UP & GET 10% OFF ON YOUR FIRST ORDER",
  "EASY 15 DAYS RETURNS & EXCHANGE",
];

const topNavCategories = [
  { name: "Discover", href: "#", is_default: 1 },
  { name: "Shirts", href: "#" },
  { name: "T-shirts", href: "#" },
  { name: "Jeans", href: "#" },
  { name: "Trousers", href: "#" },
  { name: "Cargo Pants", href: "#" },
  { name: "Shoes", href: "#" },
  { name: "Overshirt", href: "#" },
  { name: "Plus-Size", href: "#" },
  { name: "Shorts", href: "#" },
  { name: "Sunglasses", href: "#" },
  { name: "Perfumes", href: "#" },
];

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920",
    title: "LINEN EDIT",
    subtitle: "Breathable. Bold. Beautifully crafted.",
    cta: "SHOP NOW",
  },
  {
    image: "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920",
    title: "SUMMER 2025",
    subtitle: "The season of statement pieces",
    cta: "EXPLORE",
  },
  {
    image: "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920",
    title: "NEW ARRIVALS",
    subtitle: "Fresh drops every week",
    cta: "DISCOVER",
  },
];

const editorialTiles = [
  { image: "https://images.pexels.com/photos/15869823/pexels-photo-15869823.jpeg?auto=compress&cs=tinysrgb&w=940", badge: "VIRUS FC", tag: "⚽" },
  { image: "https://images.unsplash.com/photo-1596993100471-c3905dafa78e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", badge: "SUMMER" },
  { image: "https://images.unsplash.com/photo-1603189343302-e603f7add05a?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", badge: "OFFICE WEAR" },
  { image: "https://images.unsplash.com/photo-1619603364937-8d7af41ef206?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", badge: "CORE LAB" },
  { image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", badge: "VIRUS LUXE" },
];

const steals = [
  { label: "SHIRTS", price: "₹699", prefix: "UNDER", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?crop=entropy&cs=srgb&fm=jpg&q=85&w=600" },
  { label: "JEANS", price: "₹999", prefix: "UNDER", image: "https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?crop=entropy&cs=srgb&fm=jpg&q=85&w=600" },
  { label: "T-SHIRTS", price: "₹599", prefix: "UNDER", image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?crop=entropy&cs=srgb&fm=jpg&q=85&w=600" },
  { label: "TROUSERS", price: "₹899", prefix: "UNDER", image: "https://images.unsplash.com/photo-1649850874075-49e014357b9d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600" },
];

const featuredCategories = [
  { name: "SHIRTS", image: "https://images.unsplash.com/photo-1740711152088-88a009e877bb?crop=entropy&cs=srgb&fm=jpg&q=85&w=500" },
  { name: "TROUSERS", image: "https://images.unsplash.com/photo-1649850874075-49e014357b9d?crop=entropy&cs=srgb&fm=jpg&q=85&w=500" },
  { name: "POLOS", image: "https://images.pexels.com/photos/11100293/pexels-photo-11100293.jpeg?auto=compress&cs=tinysrgb&w=500" },
  { name: "JEANS", image: "https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?crop=entropy&cs=srgb&fm=jpg&q=85&w=500" },
  { name: "CARGOS", image: "https://images.unsplash.com/photo-1649850874075-49e014357b9d?crop=entropy&cs=srgb&fm=jpg&q=85&w=500" },
  { name: "T-SHIRTS", image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?crop=entropy&cs=srgb&fm=jpg&q=85&w=500" },
  { name: "SHORTS", image: "https://images.unsplash.com/photo-1651761179569-4ba2aa054997?crop=entropy&cs=srgb&fm=jpg&q=85&w=500" },
  { name: "PLUS SIZE", badge: "3XL TO 6XL", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?crop=entropy&cs=srgb&fm=jpg&q=85&w=500" },
  { name: "SHOES", badge: "JUST LAUNCHED", image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?crop=entropy&cs=srgb&fm=jpg&q=85&w=500" },
];

const products = [
  { id: "p1", name: "Clyster Off-White Overshirt", price: 1499, mrp: 2499, discount: 40, image: "https://images.unsplash.com/photo-1619603364937-8d7af41ef206?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1617137968427-85924c800a22?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#F5F0E8", "#2E2E2E", "#5B4B3A"], sizes: ["S", "M", "L", "XL", "XXL"], tag: "BESTSELLER", category: "overshirt" },
  { id: "p2", name: "Blue Comfort Fit Jeans", price: 1699, mrp: 2299, discount: 26, image: "https://images.unsplash.com/photo-1643155511946-4af707cb82fd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#4A69A0", "#212F45", "#1B1B1B"], sizes: ["28", "30", "32", "34", "36"], tag: "NEW", category: "jeans" },
  { id: "p3", name: "Sleek Striped Black Polo T-Shirt", price: 999, mrp: 1599, discount: 38, image: "https://images.unsplash.com/photo-1639747658423-1b00fee36582?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1625910513413-c23b8bb81cba?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#1B1B1B", "#FFFFFF", "#8B1E1E"], sizes: ["S", "M", "L", "XL"], tag: "TRENDING", category: "t-shirts" },
  { id: "p4", name: "Everett Black Cargo Pant", price: 1899, mrp: 2799, discount: 32, image: "https://images.unsplash.com/photo-1629244032690-1c243449f90a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1649850874075-49e014357b9d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#1B1B1B", "#54503E", "#3A3E2C"], sizes: ["28", "30", "32", "34", "36"], category: "cargo-pants" },
  { id: "p5", name: "Navy Textured Cuban Collar Shirt", price: 1299, mrp: 1999, discount: 35, image: "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#1B2A49", "#EDE7DA", "#1B1B1B"], sizes: ["S", "M", "L", "XL", "XXL"], tag: "BESTSELLER", category: "shirts" },
  { id: "p6", name: "Quintet Black Polo T-Shirt", price: 899, mrp: 1499, discount: 40, image: "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1625910513413-c23b8bb81cba?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#1B1B1B", "#4A4A4A", "#8B1E1E"], sizes: ["S", "M", "L", "XL"], category: "t-shirts" },
  { id: "p7", name: "Ivory Linen Relaxed Fit Shirt", price: 1399, mrp: 2199, discount: 36, image: "https://images.pexels.com/photos/8802622/pexels-photo-8802622.jpeg?auto=compress&cs=tinysrgb&w=600", hoverImage: "https://images.unsplash.com/photo-1740711152088-88a009e877bb?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#F1E9D7", "#B69A7E", "#1B1B1B"], sizes: ["S", "M", "L", "XL", "XXL"], tag: "NEW", category: "shirts" },
  { id: "p8", name: "Charcoal Tailored Trouser", price: 1799, mrp: 2599, discount: 31, image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1649850874075-49e014357b9d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#2E2E2E", "#8B7355", "#1B2A49"], sizes: ["28", "30", "32", "34", "36"], category: "trousers" },
  { id: "p9", name: "Burgundy Graphic T-Shirt", price: 799, mrp: 1299, discount: 38, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1651761179569-4ba2aa054997?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#7B1E28", "#1B1B1B", "#F1E9D7"], sizes: ["S", "M", "L", "XL", "XXL"], tag: "TRENDING", category: "t-shirts" },
  { id: "p10", name: "Sand Beige Chino Pant", price: 1499, mrp: 2199, discount: 31, image: "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#C9B08A", "#8B7355", "#2E2E2E"], sizes: ["28", "30", "32", "34", "36"], category: "trousers" },
  { id: "p11", name: "Olive Utility Cargo Shorts", price: 1099, mrp: 1699, discount: 35, image: "https://images.unsplash.com/photo-1651761179569-4ba2aa054997?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1649850874075-49e014357b9d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#3A3E2C", "#1B1B1B", "#8B7355"], sizes: ["S", "M", "L", "XL"], category: "shorts" },
  { id: "p12", name: "Emerald Retro Sneakers", price: 2299, mrp: 3499, discount: 34, image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", hoverImage: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", colors: ["#0F5E3A", "#FFFFFF", "#1B1B1B"], sizes: ["7", "8", "9", "10", "11"], tag: "JUST LAUNCHED", category: "shoes" },
];

const menuLinks = [
  { title: "NEW ARRIVALS", href: "#" },
  { title: "SHIRTS", href: "#" },
  { title: "T-SHIRTS", href: "#" },
  { title: "JEANS", href: "#" },
  { title: "TROUSERS", href: "#" },
  { title: "CARGO PANTS", href: "#" },
  { title: "SHORTS", href: "#" },
  { title: "OVERSHIRTS", href: "#" },
  { title: "SUITS & BLAZERS", href: "#" },
  { title: "SHOES", href: "#" },
  { title: "SUNGLASSES", href: "#" },
  { title: "PERFUMES", href: "#" },
  { title: "PLUS SIZE", href: "#" },
  { title: "SALE", href: "#", accent: 1 },
];

const footerSections = [
  { title: "HELP", links: ["Contact Us", "Track Order", "Returns & Exchange", "Shipping Policy", "FAQs", "Size Guide"] },
  { title: "COMPANY", links: ["About Us", "Virus Stores", "Virus X", "Careers", "Press", "Sustainability"] },
  { title: "LEGAL", links: ["Privacy Policy", "Terms & Conditions", "Refund Policy", "Cookie Policy"] },
];

function seed() {
  initDb();

  const count = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
  if (count > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)").run(username, hash);

  const insAnn = db.prepare("INSERT INTO announcements (message, sort_order) VALUES (?, ?)");
  announcementMessages.forEach((m, i) => insAnn.run(m, i));

  const insNav = db.prepare("INSERT INTO top_nav_categories (name, href, is_default, sort_order) VALUES (?, ?, ?, ?)");
  topNavCategories.forEach((c, i) => insNav.run(c.name, c.href, c.is_default || 0, i));

  const insHero = db.prepare("INSERT INTO hero_slides (image, title, subtitle, cta, sort_order) VALUES (?, ?, ?, ?, ?)");
  heroSlides.forEach((s, i) => insHero.run(s.image, s.title, s.subtitle, s.cta, i));

  const insEdit = db.prepare("INSERT INTO editorial_tiles (image, badge, tag, sort_order) VALUES (?, ?, ?, ?)");
  editorialTiles.forEach((t, i) => insEdit.run(t.image, t.badge, t.tag || null, i));

  const insSteal = db.prepare("INSERT INTO steals (label, price, prefix, image, sort_order) VALUES (?, ?, ?, ?, ?)");
  steals.forEach((s, i) => insSteal.run(s.label, s.price, s.prefix, s.image, i));

  const insFeat = db.prepare("INSERT INTO featured_categories (name, image, badge, sort_order) VALUES (?, ?, ?, ?)");
  featuredCategories.forEach((c, i) => insFeat.run(c.name, c.image, c.badge || null, i));

  const insCat = db.prepare("INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)");
  const catMap = {};
  ["shirts", "t-shirts", "jeans", "trousers", "cargo-pants", "shorts", "overshirt", "shoes"].forEach((slug, i) => {
    const name = slug.replace(/-/g, " ").toUpperCase();
    const r = insCat.run(name, slug, i);
    catMap[slug] = r.lastInsertRowid;
  });

  const insProd = db.prepare(`
    INSERT INTO products (id, name, price, mrp, discount, image, hover_image, colors, sizes, tag, category_id, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  products.forEach((p, i) => {
    insProd.run(
      p.id, p.name, p.price, p.mrp, p.discount, p.image, p.hoverImage,
      JSON.stringify(p.colors), JSON.stringify(p.sizes), p.tag || null,
      catMap[p.category] || null, i
    );
  });

  const insMenu = db.prepare("INSERT INTO menu_links (title, href, accent, sort_order) VALUES (?, ?, ?, ?)");
  menuLinks.forEach((l, i) => insMenu.run(l.title, l.href, l.accent || 0, i));

  const insSec = db.prepare("INSERT INTO footer_sections (title, sort_order) VALUES (?, ?)");
  const insLink = db.prepare("INSERT INTO footer_links (section_id, label, href, sort_order) VALUES (?, ?, ?, ?)");
  footerSections.forEach((sec, si) => {
    const r = insSec.run(sec.title, si);
    sec.links.forEach((l, li) => insLink.run(r.lastInsertRowid, l, "#", li));
  });

  db.prepare(`
    INSERT INTO promo_banner (id, section_title, image, left_text_1, left_text_2, right_main, right_sub, date_text, note_text)
    VALUES (1, 'SHOP YOUR SIZE',
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600',
      'GRAB', 'OR GONE', '50%OFF', '+ 10% Extra*',
      '27th JUNE - 6th JULY', '( on orders above 3999 )')
  `).run();

  console.log("Database seeded successfully.");
  console.log(`Admin login: ${username} / ${password}`);
}

seed();
