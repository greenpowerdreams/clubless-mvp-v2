import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Calendar,
  Users,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

interface Proposal {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventName: string;
  eventType: string;
  expectedGuests: string;
  preferredDate: string;
  location: string;
  description: string;
  experience: string;
  socialLinks: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

// Dummy data for demo
const dummyProposals: Proposal[] = [
  {
    id: "1",
    name: "Marcus Johnson",
    email: "marcus@djmarcus.com",
    phone: "(555) 123-4567",
    eventName: "Neon Dreams",
    eventType: "dj-night",
    expectedGuests: "200-300",
    preferredDate: "2024-02-15",
    location: "Downtown LA",
    description:
      "A vibrant house music night featuring local DJs and immersive light installations. Target audience is 25-35 urban professionals who love quality sound and production.",
    experience:
      "5 years DJing in LA clubs. Previous residency at Sound Nightclub. 15k Instagram followers.",
    socialLinks: "@djmarcusla",
    submittedAt: "2024-01-20T14:30:00Z",
    status: "pending",
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah@electronica.co",
    phone: "(555) 987-6543",
    eventName: "Techno Temple",
    eventType: "themed-party",
    expectedGuests: "300-500",
    preferredDate: "2024-03-01",
    location: "Brooklyn, NY",
    description:
      "Underground techno experience in a warehouse setting. Dark, industrial vibes with heavy bass and minimalist production. 21+ crowd, serious music enthusiasts.",
    experience:
      "Produced 12 warehouse events in NYC. Connected with major techno labels. Built a loyal following of 2k regular attendees.",
    socialLinks: "electronica.co",
    submittedAt: "2024-01-18T09:15:00Z",
    status: "approved",
  },
  {
    id: "3",
    name: "Alex Rivera",
    email: "alex.r@gmail.com",
    phone: "",
    eventName: "Sunset Sessions",
    eventType: "live-music",
    expectedGuests: "100-200",
    preferredDate: "2024-02-28",
    location: "Miami Beach",
    description:
      "Rooftop day party with live bands and DJs. Chill afternoon vibes transitioning to uptempo evening sets. Perfect for the beach crowd.",
    experience: "New to event hosting but have been DJing for 3 years at local bars.",
    socialLinks: "@alexsunsets",
    submittedAt: "2024-01-22T16:45:00Z",
    status: "rejected",
  },
];

export default function AdminDashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    // Load from localStorage or use dummy data
    const stored = localStorage.getItem("eventProposals");
    if (stored) {
      const storedProposals = JSON.parse(stored);
      setProposals([...dummyProposals, ...storedProposals]);
    } else {
      setProposals(dummyProposals);
    }
  }, []);

  const updateStatus = (id: string, status: "approved" | "rejected") => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    if (selectedProposal?.id === id) {
      setSelectedProposal((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    }
  };

  const formatEventType = (type: string) => {
    return type
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-strong border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Clubless Admin</span>
          </Link>
          <Badge variant="outline">Admin Panel</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Event Proposals
          </h1>
          <p className="text-muted-foreground">
            Review and manage incoming event proposals.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Proposals List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">All Proposals</h2>
              <span className="text-sm text-muted-foreground">
                {proposals.length} total
              </span>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {proposals.map((proposal) => (
                <button
                  key={proposal.id}
                  onClick={() => setSelectedProposal(proposal)}
                  className={`w-full text-left glass rounded-xl p-4 transition-all hover:border-primary/40 ${
                    selectedProposal?.id === proposal.id
                      ? "border-primary ring-1 ring-primary/30"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold truncate">{proposal.eventName}</h3>
                    {getStatusBadge(proposal.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    by {proposal.name}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(proposal.preferredDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {proposal.expectedGuests}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail View */}
          <div className="lg:col-span-2">
            {selectedProposal ? (
              <div className="glass rounded-2xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-display text-2xl font-bold">
                        {selectedProposal.eventName}
                      </h2>
                      {getStatusBadge(selectedProposal.status)}
                    </div>
                    <p className="text-muted-foreground">
                      Submitted{" "}
                      {new Date(selectedProposal.submittedAt).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(selectedProposal.submittedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {selectedProposal.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        onClick={() => updateStatus(selectedProposal.id, "rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => updateStatus(selectedProposal.id, "approved")}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      <p className="font-medium">{selectedProposal.name}</p>
                      <p className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-primary" />
                        {selectedProposal.email}
                      </p>
                      {selectedProposal.phone && (
                        <p className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-primary" />
                          {selectedProposal.phone}
                        </p>
                      )}
                      {selectedProposal.socialLinks && (
                        <p className="flex items-center gap-2 text-sm">
                          <ExternalLink className="w-4 h-4 text-primary" />
                          {selectedProposal.socialLinks}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Event Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        {formatEventType(selectedProposal.eventType)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(selectedProposal.preferredDate).toLocaleDateString(
                          "en-US",
                          { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                        )}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        {selectedProposal.expectedGuests} expected guests
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {selectedProposal.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Event Description
                  </h3>
                  <p className="text-foreground leading-relaxed">
                    {selectedProposal.description}
                  </p>
                </div>

                {/* Experience */}
                {selectedProposal.experience && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Organizer Experience
                    </h3>
                    <p className="text-foreground leading-relaxed">
                      {selectedProposal.experience}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  Select a Proposal
                </h3>
                <p className="text-muted-foreground">
                  Click on a proposal from the list to view details and take
                  action.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
