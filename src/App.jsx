import AppRoutes from "./routes/AppRoutes";
import { AppUiProvider } from "./context/AppUiProvider.jsx";
import { LocationProvider } from "./context/LocationProvider.jsx";
import { AssistantProvider } from "./context/AssistantProvider.jsx";

import "./App.css";
import "./styles/theme.css";
import "./styles/shell.css";
import "./styles/screens.css";
import "./styles/assistant.css";

/**
 * Provider order matters: the assistant dispatches into the UI and location
 * layers, so both sit above it.
 */
function App() {
  return (
    <AppUiProvider>
      <LocationProvider>
        <AssistantProvider>
          <AppRoutes />
        </AssistantProvider>
      </LocationProvider>
    </AppUiProvider>
  );
}

export default App;
