import { Link, useParams, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const order = state?.order;

  return (
    <div className="px-4 md:px-8 py-16 md:py-24 max-w-xl mx-auto text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
      <h1 className="font-display text-2xl md:text-3xl tracking-[0.15em] mb-2">ORDER CONFIRMED</h1>
      <p className="text-neutral-500 mb-6">Thank you for shopping with Fashion Virus!</p>

      <div className="bg-neutral-50 border p-6 text-left space-y-3 mb-8">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">Order Number</span>
          <span className="font-semibold">{orderNumber}</span>
        </div>
        {order?.customer?.email && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Confirmation sent to</span>
            <span>{order.customer.email}</span>
          </div>
        )}
        {order?.total && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Total Paid</span>
            <span className="font-bold">₹{order.total}</span>
          </div>
        )}
        {order?.paymentMethod && (
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Payment</span>
            <span className="uppercase">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Prepaid"}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-neutral-600 mb-8">
        We&apos;ll send you shipping updates on your registered phone and email.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/shop"
          className="bg-black text-white text-[12px] tracking-[0.2em] font-semibold px-8 py-3.5 hover:bg-neutral-800 transition-colors"
        >
          CONTINUE SHOPPING
        </Link>
        <Link
          to="/"
          className="border border-black text-[12px] tracking-[0.2em] font-semibold px-8 py-3.5 hover:bg-neutral-50 transition-colors"
        >
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}
