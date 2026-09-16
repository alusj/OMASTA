import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "../components/layout/AppShell.jsx";
import OrangeHome from "../components/OrangeHome/OrangeHome.jsx";
import ShopScreen from "../screens/ShopScreen.jsx";
import ProductDetailScreen from "../screens/ProductDetailScreen.jsx";
import FindScreen from "../screens/FindScreen.jsx";
import SupportScreen from "../screens/SupportScreen.jsx";
import AccountScreen from "../screens/AccountScreen.jsx";

/**
 * Screens are real routes rather than local tab state, so the assistant, the
 * search sheet and deep links can all navigate the app the same way.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/orange" element={<OrangeHome />} />
        <Route path="/shop" element={<ShopScreen />} />
        <Route path="/shop/:productId" element={<ProductDetailScreen />} />
        <Route path="/find" element={<FindScreen />} />
        <Route path="/support" element={<SupportScreen />} />
        <Route path="/account" element={<AccountScreen />} />
      </Route>
      <Route path="/" element={<Navigate to="/orange" replace />} />
      <Route path="*" element={<Navigate to="/orange" replace />} />
    </Routes>
  );
}
