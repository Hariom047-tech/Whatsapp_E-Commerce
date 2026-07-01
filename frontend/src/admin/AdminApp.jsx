import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CrudPage from "./pages/CrudPage";
import PromoBannerPage from "./pages/PromoBannerPage";
import FooterPage from "./pages/FooterPage";

const fieldDefs = {
  announcements: {
    title: "Announcements",
    description: "Scrolling messages in the top announcement bar",
    fields: [
      { key: "message", label: "Message", type: "textarea" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    columns: [{ key: "message", label: "Message" }, { key: "sort_order", label: "Order" }, { key: "active", label: "Active", type: "boolean" }],
  },
  "hero-slides": {
    title: "Hero Carousel",
    description: "Homepage hero banner slides",
    fields: [
      { key: "image", label: "Image URL", type: "image" },
      { key: "title", label: "Title" },
      { key: "subtitle", label: "Subtitle" },
      { key: "cta", label: "Button Text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    columns: [
      { key: "image", label: "Image", type: "image" },
      { key: "title", label: "Title" },
      { key: "subtitle", label: "Subtitle" },
      { key: "active", label: "Active", type: "boolean" },
    ],
  },
  "editorial-tiles": {
    title: "Editorial Tiles",
    description: "Collection tiles below hero section",
    fields: [
      { key: "image", label: "Image URL", type: "image" },
      { key: "badge", label: "Badge Text" },
      { key: "tag", label: "Tag (optional emoji)" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    columns: [{ key: "image", label: "Image", type: "image" }, { key: "badge", label: "Badge" }, { key: "active", label: "Active", type: "boolean" }],
  },
  steals: {
    title: "Steals Section",
    description: "Price deal cards on homepage",
    fields: [
      { key: "label", label: "Category Label" },
      { key: "price", label: "Price Text (e.g. ₹699)" },
      { key: "prefix", label: "Prefix (e.g. UNDER)" },
      { key: "image", label: "Image URL", type: "image" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    columns: [{ key: "label", label: "Label" }, { key: "price", label: "Price" }, { key: "image", label: "Image", type: "image" }],
  },
  "featured-categories": {
    title: "Featured Categories",
    description: "Category grid on homepage",
    fields: [
      { key: "name", label: "Name" },
      { key: "image", label: "Image URL", type: "image" },
      { key: "badge", label: "Badge (optional)" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    columns: [{ key: "name", label: "Name" }, { key: "badge", label: "Badge" }, { key: "image", label: "Image", type: "image" }],
  },
  categories: {
    title: "Product Categories",
    description: "Categories for organizing products",
    fields: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug (e.g. shirts)" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    columns: [{ key: "name", label: "Name" }, { key: "slug", label: "Slug" }],
  },
  "top-nav-categories": {
    title: "Nav Categories",
    description: "Category strip in header",
    fields: [
      { key: "name", label: "Name" },
      { key: "href", label: "Link" },
      { key: "is_default", label: "Default Active", type: "boolean" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    columns: [{ key: "name", label: "Name" }, { key: "href", label: "Link" }, { key: "is_default", label: "Default", type: "boolean" }],
  },
  "menu-links": {
    title: "Menu Links",
    description: "Side navigation menu items",
    fields: [
      { key: "title", label: "Title" },
      { key: "href", label: "Link" },
      { key: "accent", label: "Accent (Sale style)", type: "boolean" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    columns: [{ key: "title", label: "Title" }, { key: "href", label: "Link" }, { key: "accent", label: "Accent", type: "boolean" }],
  },
  products: {
    title: "Products",
    description: "Product items in New Drops section",
    fields: [
      { key: "name", label: "Product Name" },
      { key: "price", label: "Price", type: "number" },
      { key: "mrp", label: "MRP", type: "number" },
      { key: "discount", label: "Discount %", type: "number" },
      { key: "image", label: "Image URL", type: "image" },
      { key: "hoverImage", label: "Hover Image URL", type: "image" },
      { key: "colors", label: "Colors (hex codes)", type: "json-array", placeholder: "#000, #fff" },
      { key: "sizes", label: "Sizes", type: "json-array", placeholder: "S, M, L, XL" },
      { key: "tag", label: "Tag (BESTSELLER, NEW, etc.)" },
      { key: "categoryId", label: "Category", type: "category" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    columns: [
      { key: "image", label: "Image", type: "image" },
      { key: "name", label: "Name" },
      { key: "price", label: "Price" },
      { key: "tag", label: "Tag" },
    ],
  },
};

function CrudRoute({ resource }) {
  const def = fieldDefs[resource];
  return <CrudPage resource={resource} {...def} />;
}

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          {Object.keys(fieldDefs).map((r) => (
            <Route key={r} path={r} element={<CrudRoute resource={r} />} />
          ))}
          <Route path="promo-banner" element={<PromoBannerPage />} />
          <Route path="footer" element={<FooterPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
