import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data", "fashion-virus.db");

import fs from "fs";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS top_nav_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      href TEXT DEFAULT '#',
      is_default INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS hero_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      cta TEXT DEFAULT 'SHOP NOW',
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS editorial_tiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT NOT NULL,
      badge TEXT NOT NULL,
      tag TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS steals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      price TEXT NOT NULL,
      prefix TEXT DEFAULT 'UNDER',
      image TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS featured_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      badge TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      mrp REAL NOT NULL,
      discount INTEGER DEFAULT 0,
      image TEXT NOT NULL,
      hover_image TEXT,
      colors TEXT DEFAULT '[]',
      sizes TEXT DEFAULT '[]',
      tag TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS menu_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      href TEXT DEFAULT '#',
      accent INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS footer_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS footer_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL REFERENCES footer_sections(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      href TEXT DEFAULT '#',
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS promo_banner (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      section_title TEXT DEFAULT 'SHOP YOUR SIZE',
      image TEXT,
      href TEXT DEFAULT '#',
      bg_color TEXT DEFAULT '#111111',
      left_text_1 TEXT DEFAULT 'GRAB',
      left_text_2 TEXT DEFAULT 'OR GONE',
      right_main TEXT DEFAULT '50%OFF',
      right_sub TEXT DEFAULT '+ 10% Extra*',
      date_text TEXT,
      note_text TEXT,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      shipping REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT DEFAULT 'cod',
      status TEXT DEFAULT 'confirmed',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.prepare("UPDATE promo_banner SET bg_color = '#111111' WHERE bg_color = '#2AA5E8' OR bg_color IS NULL").run();
}

export default db;
