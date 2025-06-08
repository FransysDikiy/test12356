import "@ant-design/v5-patch-for-react-19";
import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import DevicePage from "./pages/DevicePage";
import { BrowserRouter as Router } from "react-router-dom";
import PetPage from "./pages/PetPage";
import ReminderPage from "./pages/ReminderPage";
import TokenHandler from "./components/TokenHandler";
import { NotificationProvider } from "./contexts/NotificationProvider";
const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
            <Route path="/token-handler" element={<TokenHandler />} />
            <Route
            path="/"
            element={
              <ProtectedRoute
                element={<HomePage />}
                allowedRoles={["User"]}
                routeProps={{ path: "/" }}
              />
            }
          />
          <Route
            path="/devices"
            element={
              <ProtectedRoute
                element={<DevicePage />}
                allowedRoles={["User"]}
                routeProps={{ path: "/devices" }}
              />
            }
          />
          <Route
            path="/pets"
            element={
              <ProtectedRoute
                element={<PetPage />}
                allowedRoles={["User"]}
                routeProps={{ path: "/pets" }}
              />
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute
                element={<ReminderPage />}
                allowedRoles={["User"]}
                routeProps={{ path: "/reminders" }}
              />
            }
          />
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
