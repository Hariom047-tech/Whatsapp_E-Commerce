import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem("fv_cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("fv_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product, options = {}) => {
    const { size, color, qty = 1 } = options;
    const lineId = `${product.id}-${size || "default"}-${color || "default"}`;
    setCart((prev) => {
      const existing = prev.find((x) => x.lineId === lineId);
      if (existing) {
        return prev.map((x) =>
          x.lineId === lineId ? { ...x, qty: x.qty + qty } : x
        );
      }
      return [
        ...prev,
        {
          lineId,
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          size: size || product.sizes?.[0] || "M",
          color: color || product.colors?.[0] || null,
          qty,
        },
      ];
    });
    setCartOpen(true);
  }, []);

  const updateQty = useCallback((lineId, qty) => {
    setCart((prev) =>
      prev.map((x) => (x.lineId === lineId ? { ...x, qty: Math.max(1, qty) } : x))
    );
  }, []);

  const removeItem = useCallback((lineId) => {
    setCart((prev) => prev.filter((x) => x.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        cartOpen,
        setCartOpen,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
