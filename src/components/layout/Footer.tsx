import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail } from "lucide-react";

const footerLinks = {
  platform: [
    { name: "Browse Events", path: "/events" },
    { name: "Vendor Marketplace", path: "/vendors" },
    { name: "Bar Service", path: "/bar-service" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "Profit Calculator", path: "/calculator" },
  ],
  creators: [
    { name: "Become a Host", path: "/dashboard/events/new" },
    { name: "Creator Dashboard", path: "/dashboard" },
    { name: "Check Status", path: "/status" },
  ],
};

export const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function Footer(props, ref) {
    return (
      <footer ref={ref} className="border-t border-border bg-card" {...props}>
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <Link to="/" className="inline-flex items-center gap-2 mb-5">
                <span className="text-white font-bold text-2xl tracking-tight">clubless</span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
                Built for creators who run their own nights.
              </p>
              <div className="flex gap-2">
                <a
                  href="https://instagram.com/clublesscollective"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com/clublesscoll"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="mailto:hello@clublesscollective.com"
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-4">
                Platform
              </h4>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Creator Links */}
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-4">
                For Creators
              </h4>
              <ul className="space-y-3">
                {footerLinks.creators.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {new Date().getFullYear()} Clubless Collective</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Seattle, WA</span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }
);
