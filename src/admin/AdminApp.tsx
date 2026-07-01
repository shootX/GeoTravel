import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import DashboardPage from "./pages/DashboardPage";
import PlacesPage from "./pages/PlacesPage";
import CategoriesPage from "./pages/CategoriesPage";
import CountriesPage from "./pages/CountriesPage";
import TranslationsPage from "./pages/TranslationsPage";
import StoryEditorPage from "./pages/StoryEditorPage";
import HiddenGemsPage from "./pages/HiddenGemsPage";
import RouteTemplatesPage from "./pages/RouteTemplatesPage";
import PackagesPage from "./pages/PackagesPage";
import AiSettingsPage from "./pages/AiSettingsPage";
import ScraperPage from "./pages/ScraperPage";
import DestinationsPage from "./pages/DestinationsPage";
import BlogPage from "./pages/BlogPage";

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="places" element={<PlacesPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="countries" element={<CountriesPage />} />
        <Route path="translations" element={<TranslationsPage />} />
        <Route path="story" element={<StoryEditorPage />} />
        <Route path="hidden-gems" element={<HiddenGemsPage />} />
        <Route path="route-templates" element={<RouteTemplatesPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="ai" element={<AiSettingsPage />} />
        <Route path="scraper" element={<ScraperPage />} />
        <Route path="destinations" element={<DestinationsPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
