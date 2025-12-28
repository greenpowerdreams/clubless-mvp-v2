import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Calendar, Users, MapPin, Music } from "lucide-react";

interface FormData {
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
}

export default function SubmitEvent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    eventName: "",
    eventType: "",
    expectedGuests: "",
    preferredDate: "",
    location: "",
    description: "",
    experience: "",
    socialLinks: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store in localStorage for admin dashboard demo
    const proposals = JSON.parse(localStorage.getItem("eventProposals") || "[]");
    proposals.push({
      ...formData,
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      status: "pending",
    });
    localStorage.setItem("eventProposals", JSON.stringify(proposals));

    toast({
      title: "Proposal Submitted!",
      description: "We'll review your event and get back to you within 48 hours.",
    });

    setIsSubmitting(false);
    navigate("/");
  };

  return (
    <Layout>
      <section className="pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
                Submit Your <span className="text-gradient">Event Proposal</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Tell us about your event idea. We'll review it and get back to
                you within 48 hours with next steps.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Info */}
              <div className="glass rounded-2xl p-8">
                <h2 className="font-display text-xl font-semibold mb-6">
                  Your Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@email.com"
                      required
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(555) 123-4567"
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialLinks">Social Media / Website</Label>
                    <Input
                      id="socialLinks"
                      name="socialLinks"
                      value={formData.socialLinks}
                      onChange={handleChange}
                      placeholder="@yourhandle or URL"
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="glass rounded-2xl p-8">
                <h2 className="font-display text-xl font-semibold mb-6">
                  Event Details
                </h2>
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="eventName">
                        <Music className="w-4 h-4 inline mr-2" />
                        Event Name *
                      </Label>
                      <Input
                        id="eventName"
                        name="eventName"
                        value={formData.eventName}
                        onChange={handleChange}
                        placeholder="e.g., Neon Nights"
                        required
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Event Type *</Label>
                      <Select
                        value={formData.eventType}
                        onValueChange={(v) => handleSelectChange("eventType", v)}
                        required
                      >
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dj-night">DJ Night</SelectItem>
                          <SelectItem value="live-music">Live Music</SelectItem>
                          <SelectItem value="album-release">Album Release</SelectItem>
                          <SelectItem value="themed-party">Themed Party</SelectItem>
                          <SelectItem value="private-event">Private Event</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>
                        <Users className="w-4 h-4 inline mr-2" />
                        Expected Guests *
                      </Label>
                      <Select
                        value={formData.expectedGuests}
                        onValueChange={(v) =>
                          handleSelectChange("expectedGuests", v)
                        }
                        required
                      >
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50-100">50-100 guests</SelectItem>
                          <SelectItem value="100-200">100-200 guests</SelectItem>
                          <SelectItem value="200-300">200-300 guests</SelectItem>
                          <SelectItem value="300-500">300-500 guests</SelectItem>
                          <SelectItem value="500+">500+ guests</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Preferred Date *
                      </Label>
                      <Input
                        id="preferredDate"
                        name="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={handleChange}
                        required
                        className="bg-secondary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Preferred City/Area *
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Downtown LA, Brooklyn, Miami Beach"
                      required
                      className="bg-secondary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Event Description & Vision *
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell us about your event concept, the vibe you're going for, your target audience, and any special requirements..."
                      required
                      className="bg-secondary/50 min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Your Experience</Label>
                    <Textarea
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      placeholder="Tell us about your experience hosting events or DJing. Past events, residencies, followers, etc."
                      className="bg-secondary/50 min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col items-center gap-4">
                <Button
                  type="submit"
                  variant="gradient"
                  size="xl"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-w-[250px]"
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Proposal
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  We'll review your proposal and respond within 48 hours.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
