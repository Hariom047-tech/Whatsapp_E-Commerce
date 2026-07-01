import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { parseProduct, boolToInt } from "../utils.js";

const router = Router();

function crud(table, fields, { jsonFields = [], boolFields = [] } = {}) {
  return {
    list: () => db.prepare(`SELECT * FROM ${table} ORDER BY sort_order, id`).all().map((row) => {
      const out = { ...row };
      jsonFields.forEach((f) => { out[f] = JSON.parse(out[f] || "[]"); });
      boolFields.forEach((f) => { out[f] = !!out[f]; });
      return out;
    }),
    get: (id) => {
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      if (!row) return null;
      jsonFields.forEach((f) => { row[f] = JSON.parse(row[f] || "[]"); });
      boolFields.forEach((f) => { row[f] = !!row[f]; });
      return row;
    },
    create: (data) => {
      const cols = fields.join(", ");
      const placeholders = fields.map(() => "?").join(", ");
      const vals = fields.map((f) => {
        if (jsonFields.includes(f)) return JSON.stringify(data[f] ?? []);
        if (boolFields.includes(f)) return boolToInt(data[f]);
        return data[f] ?? null;
      });
      const r = db.prepare(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`).run(...vals);
      return r.lastInsertRowid;
    },
    update: (id, data) => {
      const sets = fields.map((f) => `${f} = ?`).join(", ");
      const vals = fields.map((f) => {
        if (jsonFields.includes(f)) return JSON.stringify(data[f] ?? []);
        if (boolFields.includes(f)) return boolToInt(data[f]);
        return data[f] ?? null;
      });
      db.prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`).run(...vals, id);
    },
    remove: (id) => db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id),
  };
}

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM admin_users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || "change-this-secret-in-production",
    { expiresIn: "7d" }
  );
  res.json({ token, username: user.username });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ username: req.admin.username });
});

router.get("/stats", authMiddleware, (_req, res) => {
  res.json({
    products: db.prepare("SELECT COUNT(*) as c FROM products").get().c,
    categories: db.prepare("SELECT COUNT(*) as c FROM categories").get().c,
    heroSlides: db.prepare("SELECT COUNT(*) as c FROM hero_slides").get().c,
    announcements: db.prepare("SELECT COUNT(*) as c FROM announcements").get().c,
  });
});

function makeRoutes(path, table, fields, opts = {}) {
  const api = crud(table, fields, opts);

  router.get(`/${path}`, authMiddleware, (_req, res) => res.json(api.list()));
  router.post(`/${path}`, authMiddleware, (req, res) => {
    const id = api.create(req.body);
    res.status(201).json({ id });
  });
  router.put(`/${path}/:id`, authMiddleware, (req, res) => {
    if (!api.get(req.params.id)) return res.status(404).json({ error: "Not found" });
    api.update(req.params.id, req.body);
    res.json({ ok: true });
  });
  router.delete(`/${path}/:id`, authMiddleware, (req, res) => {
    api.remove(req.params.id);
    res.json({ ok: true });
  });
}

makeRoutes("announcements", "announcements", ["message", "sort_order", "active"], { boolFields: ["active"] });
makeRoutes("top-nav-categories", "top_nav_categories", ["name", "href", "is_default", "sort_order", "active"], { boolFields: ["is_default", "active"] });
makeRoutes("hero-slides", "hero_slides", ["image", "title", "subtitle", "cta", "sort_order", "active"], { boolFields: ["active"] });
makeRoutes("editorial-tiles", "editorial_tiles", ["image", "badge", "tag", "sort_order", "active"], { boolFields: ["active"] });
makeRoutes("steals", "steals", ["label", "price", "prefix", "image", "sort_order", "active"], { boolFields: ["active"] });
makeRoutes("featured-categories", "featured_categories", ["name", "image", "badge", "sort_order", "active"], { boolFields: ["active"] });
makeRoutes("categories", "categories", ["name", "slug", "sort_order", "active"], { boolFields: ["active"] });
makeRoutes("menu-links", "menu_links", ["title", "href", "accent", "sort_order", "active"], { boolFields: ["accent", "active"] });

// Products (string id)
router.get("/products", authMiddleware, (_req, res) => {
  const rows = db.prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.sort_order
  `).all();
  res.json(rows.map(parseProduct));
});

router.post("/products", authMiddleware, (req, res) => {
  const p = req.body;
  const id = p.id || `p${Date.now()}`;
  db.prepare(`
    INSERT INTO products (id, name, price, mrp, discount, image, hover_image, colors, sizes, tag, category_id, sort_order, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, p.name, p.price, p.mrp, p.discount || 0, p.image, p.hoverImage || p.hover_image || null,
    JSON.stringify(p.colors || []), JSON.stringify(p.sizes || []), p.tag || null,
    p.categoryId || p.category_id || null, p.sortOrder ?? p.sort_order ?? 0, boolToInt(p.active ?? true)
  );
  res.status(201).json({ id });
});

router.put("/products/:id", authMiddleware, (req, res) => {
  const p = req.body;
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });
  db.prepare(`
    UPDATE products SET name=?, price=?, mrp=?, discount=?, image=?, hover_image=?, colors=?, sizes=?, tag=?, category_id=?, sort_order=?, active=?
    WHERE id=?
  `).run(
    p.name, p.price, p.mrp, p.discount || 0, p.image, p.hoverImage || p.hover_image || null,
    JSON.stringify(p.colors || []), JSON.stringify(p.sizes || []), p.tag || null,
    p.categoryId || p.category_id || null, p.sortOrder ?? p.sort_order ?? 0, boolToInt(p.active ?? true),
    req.params.id
  );
  res.json({ ok: true });
});

router.delete("/products/:id", authMiddleware, (req, res) => {
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Footer sections with links
router.get("/footer-sections", authMiddleware, (_req, res) => {
  const sections = db.prepare("SELECT * FROM footer_sections ORDER BY sort_order").all();
  const getLinks = db.prepare("SELECT * FROM footer_links WHERE section_id = ? ORDER BY sort_order");
  res.json(sections.map((s) => ({
    ...s,
    active: !!s.active,
    links: getLinks.all(s.id).map((l) => ({ ...l, active: !!l.active })),
  })));
});

router.post("/footer-sections", authMiddleware, (req, res) => {
  const { title, sort_order = 0, active = true, links = [] } = req.body;
  const r = db.prepare("INSERT INTO footer_sections (title, sort_order, active) VALUES (?, ?, ?)").run(title, sort_order, boolToInt(active));
  const ins = db.prepare("INSERT INTO footer_links (section_id, label, href, sort_order, active) VALUES (?, ?, ?, ?, ?)");
  links.forEach((l, i) => ins.run(r.lastInsertRowid, l.label, l.href || "#", l.sort_order ?? i, boolToInt(l.active ?? true)));
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put("/footer-sections/:id", authMiddleware, (req, res) => {
  const { title, sort_order, active, links = [] } = req.body;
  db.prepare("UPDATE footer_sections SET title=?, sort_order=?, active=? WHERE id=?").run(title, sort_order, boolToInt(active), req.params.id);
  db.prepare("DELETE FROM footer_links WHERE section_id = ?").run(req.params.id);
  const ins = db.prepare("INSERT INTO footer_links (section_id, label, href, sort_order, active) VALUES (?, ?, ?, ?, ?)");
  links.forEach((l, i) => ins.run(req.params.id, l.label, l.href || "#", l.sort_order ?? i, boolToInt(l.active ?? true)));
  res.json({ ok: true });
});

router.delete("/footer-sections/:id", authMiddleware, (req, res) => {
  db.prepare("DELETE FROM footer_sections WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Promo banner (singleton)
router.get("/promo-banner", authMiddleware, (_req, res) => {
  const row = db.prepare("SELECT * FROM promo_banner WHERE id = 1").get();
  res.json(row ? { ...row, active: !!row.active } : null);
});

router.put("/promo-banner", authMiddleware, (req, res) => {
  const p = req.body;
  const exists = db.prepare("SELECT id FROM promo_banner WHERE id = 1").get();
  if (!exists) {
    db.prepare(`
      INSERT INTO promo_banner (id, section_title, image, href, bg_color, left_text_1, left_text_2, right_main, right_sub, date_text, note_text, active)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.section_title || p.sectionTitle, p.image, p.href || "#", p.bg_color || p.bgColor || "#111111",
      p.left_text_1 || p.leftText1, p.left_text_2 || p.leftText2, p.right_main || p.rightMain,
      p.right_sub || p.rightSub, p.date_text || p.dateText, p.note_text || p.noteText, boolToInt(p.active ?? true)
    );
  } else {
    db.prepare(`
      UPDATE promo_banner SET section_title=?, image=?, href=?, bg_color=?, left_text_1=?, left_text_2=?,
      right_main=?, right_sub=?, date_text=?, note_text=?, active=? WHERE id=1
    `).run(
      p.section_title || p.sectionTitle, p.image, p.href || "#", p.bg_color || p.bgColor || "#111111",
      p.left_text_1 || p.leftText1, p.left_text_2 || p.leftText2, p.right_main || p.rightMain,
      p.right_sub || p.rightSub, p.date_text || p.dateText, p.note_text || p.noteText, boolToInt(p.active ?? true)
    );
  }
  res.json({ ok: true });
});

export default router;
