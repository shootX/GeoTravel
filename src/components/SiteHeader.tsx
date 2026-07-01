import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Globe, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/destinations", label: "Destinations" },
  { to: "/experiences", label: "Experiences" },
  { to: "/custom-routes", label: "Custom Routes" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About Us" },
];

interface SiteHeaderProps {
  onLogin: () => void;
  onSignUp: () => void;
  onLogoClick?: () => void;
}

export default function SiteHeader({ onLogin, onSignUp, onLogoClick }: SiteHeaderProps) {
  const { user, loading: authLoading, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="h-20 px-4 md:px-8 flex items-center justify-between bg-white z-30 shrink-0 max-w-7xl mx-auto w-full">
        <Link
          to="/"
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            onLogoClick?.();
            closeMobile();
          }}
        >
          <div className="relative flex items-center justify-center">
            <MapPin className="w-8 h-8 text-[#0B4A46]" fill="#0B4A46" strokeWidth={1} />
            <Globe className="w-4 h-4 text-white absolute top-1.5" strokeWidth={2} />
          </div>
          <span className="font-display font-bold text-xl tracking-wide text-[#0B4A46] uppercase">
            GEOTRAVEL
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to ? "text-[#0B4A46]" : "text-gray-700 hover:text-[#0B4A46]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1 text-gray-500 text-sm">
            <Globe className="w-4 h-4" />
            <span className="font-medium">EN</span>
          </div>

          <div className="hidden md:block w-px h-5 bg-gray-300" />

          {!authLoading && (
            user ? (
              <div className="hidden sm:flex items-center gap-4">
                {user.role === "admin" && (
                  <Link to="/admin" className="text-sm font-medium text-[#0B4A46] hover:underline">
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 text-sm font-bold flex items-center justify-center">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate hidden md:inline">
                    {user.name || user.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-4">
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-sm font-medium text-gray-700 hover:text-[#0B4A46] transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={onSignUp}
                  className="text-sm font-medium bg-[#0B4A46] text-white px-5 py-2.5 rounded-full hover:bg-[#083a37] transition-colors cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )
          )}

          <button
            type="button"
            className="lg:hidden p-2 text-gray-700 hover:text-[#0B4A46]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={closeMobile}>
          <div
            className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-[#0B4A46] uppercase">Menu</span>
              <button type="button" onClick={closeMobile}><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobile}
                  className={`text-base font-medium ${
                    location.pathname === link.to ? "text-[#0B4A46]" : "text-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-6 border-t border-gray-100 space-y-3">
              {!authLoading && (
                user ? (
                  <>
                    {user.role === "admin" && (
                      <Link to="/admin" onClick={closeMobile} className="block text-sm font-medium text-[#0B4A46]">
                        Admin Panel
                      </Link>
                    )}
                    <button type="button" onClick={() => { logout(); closeMobile(); }} className="text-sm text-gray-600">
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => { onLogin(); closeMobile(); }} className="w-full py-2 text-sm font-medium border rounded-full">
                      Log In
                    </button>
                    <button type="button" onClick={() => { onSignUp(); closeMobile(); }} className="w-full py-2 text-sm font-medium bg-[#0B4A46] text-white rounded-full">
                      Sign Up
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
