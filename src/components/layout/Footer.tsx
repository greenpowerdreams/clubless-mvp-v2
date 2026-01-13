import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

export const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function Footer(props, ref) {
    return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src={logo} 
                alt="Clubless Collective" 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              Built by nightlife insiders for the next generation of creatives.
              Turn any space into your own club, any event into your playground.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-4">
              Starting in Seattle. Growing city by city. One party at a time.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/calculator"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Profit Calculator
                </Link>
              </li>
              <li>
                <Link
                  to="/submit"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Submit Event
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">
              Connect
            </h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@clublesscollective.com"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Clubless Collective. Nightlife Reimagined.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
    );
  }
);