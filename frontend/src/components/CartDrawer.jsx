import { Link } from "react-router-dom";
import { Sheet, SheetContent } from "./ui/sheet";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";

export default function CartDrawer({ open, onOpenChange, cart, subtotal, onUpdate, onRemove }) {
  const total = subtotal ?? cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag strokeWidth={1.5} className="w-5 h-5" />
            <div className="font-semibold tracking-widest text-sm">MY BAG ({cart.length})</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
              <ShoppingBag strokeWidth={1} className="w-14 h-14 text-neutral-300" />
              <div className="mt-4 font-semibold">Your bag is empty</div>
              <p className="text-sm text-neutral-500 mt-1">Add some styles to get started</p>
              <Link
                to="/shop"
                onClick={() => onOpenChange(false)}
                className="mt-6 text-[11px] tracking-[0.2em] font-semibold border-b-2 border-black pb-0.5"
              >
                SHOP NOW
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {cart.map((item) => (
                <li key={item.lineId} className="flex gap-3 p-4">
                  <Link to={`/product/${item.id}`} onClick={() => onOpenChange(false)}>
                    <img src={item.image} alt={item.name} className="w-20 h-24 object-cover bg-neutral-100" />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <Link
                        to={`/product/${item.id}`}
                        onClick={() => onOpenChange(false)}
                        className="text-[13px] font-medium leading-snug pr-2 hover:underline"
                      >
                        {item.name}
                      </Link>
                      <button onClick={() => onRemove(item.lineId)} className="text-neutral-500 hover:text-black" aria-label="Remove">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-[12px] text-neutral-500 mt-1">Size: {item.size}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-neutral-300">
                        <button onClick={() => onUpdate(item.lineId, Math.max(1, item.qty - 1))} className="px-2 py-1 hover:bg-neutral-100">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-sm">{item.qty}</span>
                        <button onClick={() => onUpdate(item.lineId, item.qty + 1)} className="px-2 py-1 hover:bg-neutral-100">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-sm font-semibold">₹{item.price * item.qty}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-semibold">₹{total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Shipping</span>
              <span className="font-semibold text-green-600">FREE</span>
            </div>
            <div className="flex items-center justify-between text-base pt-2 border-t">
              <span className="font-semibold">Total</span>
              <span className="font-bold">₹{total}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => onOpenChange(false)}
              className="block w-full bg-black text-white text-[13px] tracking-[0.2em] font-semibold py-3.5 hover:bg-neutral-800 transition-colors text-center"
            >
              PROCEED TO CHECKOUT
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
