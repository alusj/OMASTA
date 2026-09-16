import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import AppHeader from "./AppHeader.jsx";
import BottomNav from "./BottomNav.jsx";
import GlobalSearchSheet from "./GlobalSearchSheet.jsx";
import NoticeToast from "./NoticeToast.jsx";
import PlaceholderSheet from "./PlaceholderSheet.jsx";
import SupportSheet from "./SupportSheet.jsx";
import AssistantFab from "../assistant/AssistantFab.jsx";
import AssistantPanel from "../assistant/AssistantPanel.jsx";

import "../OrangeHome/OrangeHome.css";

/**
 * The persistent frame around every screen: header, scrolling content, bottom
 * navigation, the OMASTA AI button and panel, and the global sheets.
 */
export default function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <div className="orange-app">
      <AppHeader />

      <main className="orange-main" key={pathname}>
        <div className="omasta-route-transition">
          <Outlet />
        </div>
      </main>

      <BottomNav />

      <AssistantFab />
      <AssistantPanel />

      <GlobalSearchSheet />
      <SupportSheet />
      <PlaceholderSheet />
      <NoticeToast />
    </div>
  );
}
