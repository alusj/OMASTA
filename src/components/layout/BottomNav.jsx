import { NavLink } from "react-router-dom";
import { House, LifeBuoy, MapPinned, ShoppingBag, UserRound } from "lucide-react";

const ITEMS = [
  { label: "Home", to: "/orange", icon: House },
  { label: "Shop", to: "/shop", icon: ShoppingBag },
  { label: "Find", to: "/find", icon: MapPinned },
  { label: "Support", to: "/support", icon: LifeBuoy },
  { label: "Account", to: "/account", icon: UserRound },
];

/** Primary navigation. The assistant button is deliberately kept outside it. */
export default function BottomNav() {
  return (
    <nav className="orange-bottom-nav" aria-label="Main navigation">
      {ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "is-active" : "")}>
            <Icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
