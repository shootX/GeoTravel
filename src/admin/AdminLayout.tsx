import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminLoginForm from "./AdminLoginForm";
import {
  LayoutDashboard,
  MapPin,
  Tags,
  Globe,
  Languages,
  BookOpen,
  Gem,
  Route,
  Package,
  LogOut,
  Compass,
  Loader2,
  Sparkles,
} from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/places", label: "Places", icon: MapPin },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/countries", label: "Countries", icon: Globe },
  { to: "/admin/translations", label: "Translations", icon: Languages },
  { to: "/admin/story", label: "Story Editor", icon: BookOpen },
  { to: "/admin/hidden-gems", label: "Hidden Gems", icon: Gem },
  { to: "/admin/route-templates", label: "Route Templates", icon: Route },
  { to: "/admin/packages", label: "Packages", icon: Package },
  { to: "/admin/ai", label: "AI Planner", icon: Sparkles },
];

export default function AdminLayout() {
  const { user, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AdminLoginForm />;
  }

  if (user.role !== "admin") {
    return (
      <AdminLoginForm
        title="Access Denied"
        description="This account does not have admin privileges. Sign in with an admin account."
        currentEmail={user.email}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-16 px-5 flex items-center gap-2 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">VoyaAI CMS</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Admin</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 truncate mb-2">{user.email}</div>
          <button
            onClick={() => logout().then(() => navigate("/admin"))}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
