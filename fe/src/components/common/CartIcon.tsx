import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "../../contexts/CartContext";

export default function CartIcon() {
  const { count } = useCart();

  return (
    <Link to="/cart" className="relative inline-flex items-center text-gray-700 hover:text-gray-900">
      <FaShoppingCart size={22} />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
