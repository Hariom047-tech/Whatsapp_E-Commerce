import { Outlet } from "react-router-dom";
import AnnouncementBar from "../components/AnnouncementBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { Toaster } from "../components/ui/toaster";
import { useCart } from "../context/CartContext";

export default function ShopLayout() {
  const { cart, cartCount, subtotal, cartOpen, setCartOpen, updateQty, removeItem } = useCart();

  return (
    <div className="App bg-white min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        subtotal={subtotal}
        onUpdate={updateQty}
        onRemove={removeItem}
      />
      <Toaster />
    </div>
  );
}
