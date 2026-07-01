import { Router } from "express";
import db from "../db.js";
import { parseProduct } from "../utils.js";

const router = Router();

router.get("/announcements", (_req, res) => {
  const rows = db.prepare("SELECT message FROM announcements WHERE active = 1 ORDER BY sort_order").all();
  res.json(rows.map((r) => r.message));
});

router.get("/top-nav-categories", (_req, res) => {
  const rows = db.prepare(`
    SELECT id, name, href, is_default as active_default
    FROM top_nav_categories WHERE active = 1 ORDER BY sort_order
  `).all();
  res.json(rows.map((r) => ({
    id: r.id,
    name: r.name,
    href: r.href,
    active: !!r.active_default,
  })));
});

router.get("/hero-slides", (_req, res) => {
  const rows = db.prepare(`
    SELECT id, image, title, subtitle, cta FROM hero_slides WHERE active = 1 ORDER BY sort_order
  `).all();
  res.json(rows);
});

router.get("/editorial-tiles", (_req, res) => {
  const rows = db.prepare(`
    SELECT id, image, badge, tag FROM editorial_tiles WHERE active = 1 ORDER BY sort_order
  `).all();
  res.json(rows);
});

router.get("/steals", (_req, res) => {
  const rows = db.prepare(`
    SELECT id, label, price, prefix, image FROM steals WHERE active = 1 ORDER BY sort_order
  `).all();
  res.json(rows);
});

router.get("/featured-categories", (_req, res) => {
  const rows = db.prepare(`
    SELECT id, name, image, badge FROM featured_categories WHERE active = 1 ORDER BY sort_order
  `).all();
  res.json(rows);
});

router.get("/categories", (_req, res) => {
  const rows = db.prepare("SELECT id, name, slug FROM categories WHERE active = 1 ORDER BY sort_order").all();
  res.json(rows);
});

router.get("/products", (req, res) => {
  const { category } = req.query;
  let sql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.active = 1
  `;
  const params = [];
  if (category) {
    sql += " AND c.slug = ?";
    params.push(category);
  }
  sql += " ORDER BY p.sort_order";
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(parseProduct));
});

router.get("/products/:id", (req, res) => {
  const row = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = ? AND p.active = 1
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(parseProduct(row));
});

router.post("/orders", (req, res) => {
  const { customer, items, subtotal, shipping = 0, total, paymentMethod = "cod" } = req.body;
  if (!customer?.name || !customer?.email || !customer?.phone || !items?.length) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const orderNumber = `FV${Date.now().toString(36).toUpperCase()}`;
  db.prepare(`
    INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, address, city, state, pincode, items, subtotal, shipping, total, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNumber,
    customer.name,
    customer.email,
    customer.phone,
    customer.address,
    customer.city,
    customer.state,
    customer.pincode,
    JSON.stringify(items),
    subtotal,
    shipping,
    total,
    paymentMethod
  );
  res.status(201).json({
    orderNumber,
    total,
    paymentMethod,
    customer,
    status: "confirmed",
  });
});

router.get("/menu-links", (_req, res) => {
  const rows = db.prepare(`
    SELECT title, href, accent FROM menu_links WHERE active = 1 ORDER BY sort_order
  `).all();
  res.json({
    main: rows.map((r) => ({
      title: r.title,
      href: r.href,
      accent: !!r.accent,
    })),
  });
});

router.get("/footer", (_req, res) => {
  const sections = db.prepare(`
    SELECT id, title FROM footer_sections WHERE active = 1 ORDER BY sort_order
  `).all();
  const getLinks = db.prepare(`
    SELECT label FROM footer_links WHERE section_id = ? AND active = 1 ORDER BY sort_order
  `);
  res.json(sections.map((s) => ({
    title: s.title,
    links: getLinks.all(s.id).map((l) => l.label),
  })));
});

router.get("/promo-banner", (_req, res) => {
  const row = db.prepare("SELECT * FROM promo_banner WHERE id = 1 AND active = 1").get();
  if (!row) return res.json(null);
  res.json({
    sectionTitle: row.section_title,
    image: row.image,
    href: row.href,
    bgColor: row.bg_color,
    leftText1: row.left_text_1,
    leftText2: row.left_text_2,
    rightMain: row.right_main,
    rightSub: row.right_sub,
    dateText: row.date_text,
    noteText: row.note_text,
  });
});

export default router;
