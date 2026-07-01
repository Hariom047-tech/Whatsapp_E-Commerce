import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { publicApi } from "../lib/api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment: "cod",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-neutral-500 mb-4">Your bag is empty.</p>
        <Link to="/shop" className="text-sm font-semibold tracking-widest border-b-2 border-black pb-0.5">
          CONTINUE SHOPPING
        </Link>
      </div>
    );
  }

  const shipping = 0;
  const total = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const order = await publicApi.placeOrder({
        customer: form,
        items: cart.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          size: i.size,
          color: i.color,
          image: i.image,
        })),
        subtotal,
        shipping,
        total,
        paymentMethod: form.payment,
      });
      clearCart();
      navigate(`/order-confirmation/${order.orderNumber}`, { state: { order } });
    } catch {
      toast({ title: "Order failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 md:py-12 max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-[11px] tracking-wider text-neutral-500 mb-8">
        <Link to="/" className="hover:text-black">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black font-medium">Checkout</span>
      </nav>

      <h1 className="font-display text-2xl md:text-3xl tracking-[0.15em] mb-8">CHECKOUT</h1>

      <div className="grid md:grid-cols-5 gap-10">
        <form onSubmit={handleSubmit} className="md:col-span-3 space-y-6">
          <section>
            <h2 className="text-sm font-semibold tracking-widest mb-4">CONTACT</h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-widest mb-4">SHIPPING ADDRESS</h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input id="address" required value={form.address} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" required value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" required value={form.state} onChange={(e) => set("state", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input id="pincode" required value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-widest mb-4">PAYMENT</h2>
            <div className="space-y-2">
              {[
                { id: "cod", label: "Cash on Delivery" },
                { id: "prepaid", label: "Prepaid (UPI / Card) — Extra 10% off" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                    form.payment === opt.id ? "border-black bg-neutral-50" : "border-neutral-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.id}
                    checked={form.payment === opt.id}
                    onChange={() => set("payment", opt.id)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white text-[13px] tracking-[0.2em] font-semibold py-4 hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? "PLACING ORDER..." : "PLACE ORDER"}
          </button>
        </form>

        <div className="md:col-span-2">
          <div className="border p-5 sticky top-24">
            <h2 className="text-sm font-semibold tracking-widest mb-4">ORDER SUMMARY</h2>
            <ul className="space-y-4 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <li key={item.lineId} className="flex gap-3">
                  <img src={item.image} alt="" className="w-14 h-18 object-cover bg-neutral-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium line-clamp-2">{item.name}</p>
                    <p className="text-[11px] text-neutral-500">Size: {item.size} · Qty: {item.qty}</p>
                    <p className="text-sm font-semibold mt-1">₹{item.price * item.qty}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
