import { Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext.jsx";
import { Layout } from "./components/Layout.jsx";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import StockPage from "./pages/StockPage.jsx";
import DoublonsPage from "./pages/DoublonsPage.jsx";
import ComparerPage from "./pages/ComparerPage.jsx";
import PannePage from "./pages/PannePage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import PalettePage from "./pages/PalettePage.jsx";
import CataloguePage from "./pages/CataloguePage.jsx";
import ProposalsPage from "./pages/ProposalsPage.jsx";
import AdminProposalsPage from "./pages/AdminProposalsPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/inscription" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout />
            </DataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="doublons" element={<DoublonsPage />} />
        <Route path="comparer" element={<ComparerPage />} />
        <Route path="panne" element={<PannePage />} />
        <Route path="envies" element={<WishlistPage />} />
        <Route path="palette" element={<PalettePage />} />
        <Route path="catalogue" element={<CataloguePage />} />
        <Route path="propositions" element={<ProposalsPage />} />
        <Route
          path="admin/propositions"
          element={
            <AdminRoute>
              <AdminProposalsPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/utilisateurs"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}
