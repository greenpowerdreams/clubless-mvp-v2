import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Events", path: "/events" },
  { name: "How It Works", path: "/how-it-works" },
  { name: "Profit Calculator", path: "/calculator" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src={logo} 
                alt="Clubless Collective" 
                className="relative h-12 md:h-14 w-auto drop-shadow-[0_0_10px_rgba(187,134,252,0.3)]"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                to="/portal"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5",
                  location.pathname.startsWith("/portal")
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <User className="w-4 h-4" />
                Host Portal
              </Link>
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            {isLoggedIn ? (
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal">My Dashboard</Link>
              </Button>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link to="/submit">Become a Host</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-base font-medium transition-colors hover:text-primary py-2",
                    location.pathname === link.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              {isLoggedIn && (
                <Link
                  to="/portal"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-base font-medium transition-colors hover:text-primary py-2 flex items-center gap-2",
                    location.pathname.startsWith("/portal")
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <User className="w-4 h-4" />
                  Host Portal
                </Link>
              )}
              {isLoggedIn ? (
                <Button variant="outline" className="mt-2" asChild>
                  <Link to="/portal" onClick={() => setIsOpen(false)}>
                    My Dashboard
                  </Link>
                </Button>
              ) : (
                <Button variant="default" className="mt-2" asChild>
                  <Link to="/submit" onClick={() => setIsOpen(false)}>
                    Become a Host
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
