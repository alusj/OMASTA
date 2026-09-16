/* eslint-disable react-refresh/only-export-components -- the provider and its hook are one API; splitting them would fragment the context. */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/**
 * App-wide interface state: the toast notice, the global search sheet, the
 * support sheet and the "not built yet" explainer sheets. Keeping it here means
 * the header, the screens and the assistant can all open the same surfaces.
 */

const AppUiContext = createContext(null);

const NOTICE_TIMEOUT_MS = 4200;

export function AppUiProvider({ children }) {
  const [notice, setNotice] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSeed, setSearchSeed] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportTopic, setSupportTopic] = useState(null);
  const [placeholderId, setPlaceholderId] = useState(null);
  const noticeTimer = useRef(null);

  const showNotice = useCallback((message, tone = "info") => {
    if (!message) {
      return;
    }

    window.clearTimeout(noticeTimer.current);
    setNotice({ message, tone });
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_TIMEOUT_MS);
  }, []);

  const dismissNotice = useCallback(() => {
    window.clearTimeout(noticeTimer.current);
    setNotice(null);
  }, []);

  const openSearch = useCallback((seed = "") => {
    setSearchSeed(seed);
    setSearchOpen(true);
  }, []);

  const openSupportSheet = useCallback((topic = null) => {
    setSupportTopic(topic);
    setSupportOpen(true);
  }, []);

  const openPlaceholder = useCallback((id) => setPlaceholderId(id), []);

  const value = useMemo(
    () => ({
      notice,
      showNotice,
      dismissNotice,
      searchOpen,
      searchSeed,
      openSearch,
      closeSearch: () => setSearchOpen(false),
      supportOpen,
      supportTopic,
      openSupportSheet,
      closeSupportSheet: () => setSupportOpen(false),
      placeholderId,
      openPlaceholder,
      closePlaceholder: () => setPlaceholderId(null),
    }),
    [
      notice,
      showNotice,
      dismissNotice,
      searchOpen,
      searchSeed,
      openSearch,
      supportOpen,
      supportTopic,
      openSupportSheet,
      placeholderId,
      openPlaceholder,
    ]
  );

  return <AppUiContext.Provider value={value}>{children}</AppUiContext.Provider>;
}

export function useAppUi() {
  const context = useContext(AppUiContext);

  if (!context) {
    throw new Error("useAppUi must be used inside AppUiProvider");
  }

  return context;
}
