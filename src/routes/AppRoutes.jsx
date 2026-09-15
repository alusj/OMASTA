import { Navigate, Route, Routes } from "react-router-dom";

import OrangeHome from "../components/OrangeHome/OrangeHome";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/orange" replace />} />
      <Route path="/orange" element={<OrangeHome />} />
      <Route path="*" element={<Navigate to="/orange" replace />} />
    </Routes>
  );
}
