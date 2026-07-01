import { Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import ShopLayout from "./layouts/ShopLayout";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AdminApp from "./admin/AdminApp";

export default function AppRoutes() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<ShopLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<CategoryPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        </Route>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </CartProvider>
  );
}
