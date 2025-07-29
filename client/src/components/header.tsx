import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Menu, X } from "lucide-react";
import CitySwitcher from "./city-switcher";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    { name: "Events", href: "/events" },
    { name: "Artists", href: "/artists" },
    { name: "Venues", href: "/venues" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-dark-bg border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-spotify-green cursor-pointer">
                  TinyAmp
                </h1>
              </Link>
            </div>
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        isActive(item.href)
                          ? "text-spotify-green"
                          : "text-muted-text hover:text-white"
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* Search and City Selector */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search artists, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card-bg border-gray-600 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:border-spotify-green w-64 text-white"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-text h-4 w-4" />
            </div>
            <CitySwitcher />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-muted-text hover:text-white"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card-bg border-t border-gray-700">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span
                  className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                    isActive(item.href)
                      ? "text-spotify-green bg-gray-700"
                      : "text-muted-text hover:text-white hover:bg-gray-700"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </span>
              </Link>
            ))}
            <div className="px-3 py-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  className="bg-dark-bg border-gray-600 text-white"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-text h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
