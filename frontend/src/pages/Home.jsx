import HeroCarousel from "../components/HeroCarousel";
import EditorialTiles from "../components/EditorialTiles";
import StealsSection from "../components/StealsSection";
import PromoBanner from "../components/PromoBanner";
import FeaturedCategories from "../components/FeaturedCategories";
import ProductGrid from "../components/ProductGrid";
import { useCart } from "../context/CartContext";

export default function Home() {
  const { addToCart } = useCart();

  return (
    <>
      <HeroCarousel />
      <EditorialTiles />
      <StealsSection />
      <PromoBanner />
      <FeaturedCategories />
      <ProductGrid onAdd={addToCart} />
    </>
  );
}
