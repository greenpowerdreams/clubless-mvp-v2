import { useState, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/shared/hooks/useSEO";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Ticket as TicketIcon,
  Image as ImageIcon,
  Eye,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────────────

const basicsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(2000).optional(),
  city: z.string().min(2, "City is required").max(80),
  address: z.string().max(240).optional(),
});

const dateSchema = z
  .object({
    start_at: z.string().min(1, "Start date is required"),
    end_at: z.string().min(1, "End date is required"),
    capacity: z
      .string()
      .min(1, "Capacity is required")
      .refine((v) => /^\d+$/.test(v) && parseInt(v, 10) > 0, "Capacity must be a positive number"),
  })
  .refine((d) => new Date(d.end_at) > new Date(d.start_at), {
    message: "End must be after start",
    path: ["end_at"],
  });

const tierSchema = z.object({
  name: z.string().min(1, "Tier name required").max(60),
  priceUsd: z.string().refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && parseFloat(v) >= 0, "Price must be 0 or greater"),
  qty: z.string().refine((v) => /^\d+$/.test(v) && parseInt(v, 10) > 0, "Quantity must be a positive number"),
});

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

interface TicketTier {
  name: string;
  priceUsd: string;
  qty: string;
  description: string;
}

const STEPS = [
  { id: 1, label: "Basics", icon: MapPin },
  { id: 2, label: "Date & capacity", icon: Calendar },
  { id: 3, label: "Tickets", icon: TicketIcon },
  { id: 4, label: "Cover image", icon: ImageIcon },
  { id: 5, label: "Review", icon: Eye },
];

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

export default function CreateEvent() {
  useSEO({
    title: "Create an Event | Clubless Collective",
    description: "Create your event in Clubless. Add date, venue, ticket tiers, and a cover image — publish to your audience in minutes.",
    robots: "noindex,follow",
  });

  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Seattle");
  const [address, setAddress] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [tiers, setTiers] = useState<TicketTier[]>([
    { name: "General Admission", priceUsd: "20", qty: "100", description: "" },
  ]);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");

  // ────────────────────────────────────────
  // Validation gates per step
  // ────────────────────────────────────────

  const validateStep = (s: number): boolean => {
    setErrors({});
    if (s === 1) {
      const result = basicsSchema.safeParse({ title, description, city, address });
      if (!result.success) {
        const e: Record<string, string> = {};
        result.error.issues.forEach((i) => {
          const k = i.path[0] as string;
          if (!e[k]) e[k] = i.message;
        });
        setErrors(e);
        return false;
      }
      return true;
    }
    if (s === 2) {
      const result = dateSchema.safeParse({ start_at: startAt, end_at: endAt, capacity });
      if (!result.success) {
        const e: Record<string, string> = {};
        result.error.issues.forEach((i) => {
          const k = i.path[0] as string;
          if (!e[k]) e[k] = i.message;
        });
        setErrors(e);
        return false;
      }
      return true;
    }
    if (s === 3) {
      if (tiers.length === 0) {
        toast.error("Add at least one ticket tier");
        return false;
      }
      for (let idx = 0; idx < tiers.length; idx++) {
        const result = tierSchema.safeParse(tiers[idx]);
        if (!result.success) {
          const first = result.error.issues[0];
          setErrors({ [`tier-${idx}-${first.path[0]}`]: first.message });
          toast.error(`Tier ${idx + 1}: ${first.message}`);
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length));
  };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  // ────────────────────────────────────────
  // Image upload
  // ────────────────────────────────────────

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    if (!user) {
      toast.error("Not authenticated");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("event-images")
        .getPublicUrl(path);
      setCoverImageUrl(publicUrl);
      toast.success("Cover image uploaded");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ────────────────────────────────────────
  // Submit
  // ────────────────────────────────────────

  const submit = async (publish: boolean) => {
    if (!user) {
      toast.error("You must be signed in to create an event");
      return;
    }
    // Re-validate everything
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error("Please fix the errors above");
      return;
    }
    setSubmitting(true);
    try {
      const slug = slugify(title);
      const totalCapacity = parseInt(capacity, 10);
      const startIso = new Date(startAt).toISOString();
      const endIso = new Date(endAt).toISOString();

      // Insert event. Write to BOTH new and legacy column names where they exist
      // (schema-alignment migration left both sets in place; sync trigger handles
      // some but not all). Belt-and-suspenders approach.
      const eventPayload: Record<string, unknown> = {
        creator_id: user.id,
        title,
        name: title,
        description: description || null,
        city,
        neighborhood: city,
        address: address || null,
        start_at: startIso,
        end_at: endIso,
        event_date: startIso.split("T")[0],
        capacity: totalCapacity,
        max_attendees: totalCapacity,
        status: publish ? "published" : "draft",
        cover_image_url: coverImageUrl || null,
        image_url: coverImageUrl || null,
        slug,
        is_private: false,
      };

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(eventPayload as any)
        .select("id")
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error("Event was not created");

      // Insert ticket tiers
      const ticketRows = tiers.map((t, idx) => {
        const priceCents = Math.round(parseFloat(t.priceUsd) * 100);
        const qtyTotal = parseInt(t.qty, 10);
        return {
          event_id: eventData.id,
          name: t.name,
          description: t.description || null,
          price: priceCents,
          price_cents: priceCents,
          quantity_total: qtyTotal,
          qty_total: qtyTotal,
          quantity_sold: 0,
          qty_sold: 0,
          qty_reserved: 0,
          max_per_order: 10,
          active: true,
          is_visible: true,
          sort_order: idx,
        };
      });

      const { error: ticketsError } = await supabase
        .from("tickets")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(ticketRows as any);

      if (ticketsError) {
        console.error("Tickets insert failed:", ticketsError);
        toast.error(`Event created but tickets failed: ${ticketsError.message}`);
        // Still navigate so user can edit
      } else {
        toast.success(publish ? "Event published! 🎉" : "Draft saved");
      }

      navigate(`/dashboard?tab=events`);
    } catch (err) {
      console.error("Create event failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to create event";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────
  // Auth gate
  // ────────────────────────────────────────

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="glass max-w-md w-full">
            <CardHeader>
              <CardTitle>Sign in to create an event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You need a creator account to publish events on Clubless Collective.
              </p>
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <a href="/signup">Create account</a>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <a href="/login">Sign in</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ────────────────────────────────────────
  // Render
  // ────────────────────────────────────────

  const renderError = (key: string) =>
    errors[key] ? (
      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {errors[key]}
      </p>
    ) : null;

  return (
    <Layout>
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard?tab=events")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to dashboard
            </Button>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Create an event
            </h1>
            <p className="text-muted-foreground">
              Build your event in 5 steps. Save as a draft anytime — publish when you're ready.
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isDone
                            ? "bg-primary/30 text-primary"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={`text-xs mt-2 hidden sm:block truncate ${
                        isActive ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isDone ? "bg-primary/30" : "bg-secondary"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Card className="glass">
            <CardContent className="pt-6 space-y-6">
              {/* Step 1: Basics */}
              {step === 1 && (
                <>
                  <div>
                    <Label htmlFor="title">Event title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Saturday Sessions: House on the Roof"
                      className="mt-1"
                    />
                    {renderError("title")}
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell people what to expect — vibe, lineup, dress code, anything that makes the night unique."
                      rows={5}
                      className="mt-1"
                    />
                    {renderError("description")}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Seattle"
                        className="mt-1"
                      />
                      {renderError("city")}
                    </div>
                    <div>
                      <Label htmlFor="address">Venue / address</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Pike St (or 'TBA')"
                        className="mt-1"
                      />
                      {renderError("address")}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Date & capacity */}
              {step === 2 && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_at">Start *</Label>
                      <Input
                        id="start_at"
                        type="datetime-local"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className="mt-1"
                      />
                      {renderError("start_at")}
                    </div>
                    <div>
                      <Label htmlFor="end_at">End *</Label>
                      <Input
                        id="end_at"
                        type="datetime-local"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className="mt-1"
                      />
                      {renderError("end_at")}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Total capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="100"
                      className="mt-1"
                    />
                    {renderError("capacity")}
                    <p className="text-xs text-muted-foreground mt-1">
                      Max attendees across all ticket tiers.
                    </p>
                  </div>
                </>
              )}

              {/* Step 3: Tickets */}
              {step === 3 && (
                <>
                  <div className="space-y-4">
                    {tiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Tier {idx + 1}</span>
                          {tiers.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setTiers((arr) => arr.filter((_, i) => i !== idx))
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={tier.name}
                            onChange={(e) =>
                              setTiers((arr) =>
                                arr.map((t, i) => (i === idx ? { ...t, name: e.target.value } : t))
                              )
                            }
                            placeholder="General Admission"
                            className="mt-1"
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Price (USD)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tier.priceUsd}
                              onChange={(e) =>
                                setTiers((arr) =>
                                  arr.map((t, i) =>
                                    i === idx ? { ...t, priceUsd: e.target.value } : t
                                  )
                                )
                              }
                              placeholder="20.00"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={tier.qty}
                              onChange={(e) =>
                                setTiers((arr) =>
                                  arr.map((t, i) =>
                                    i === idx ? { ...t, qty: e.target.value } : t
                                  )
                                )
                              }
                              placeholder="50"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Description (optional)</Label>
                          <Input
                            value={tier.description}
                            onChange={(e) =>
                              setTiers((arr) =>
                                arr.map((t, i) =>
                                  i === idx ? { ...t, description: e.target.value } : t
                                )
                              )
                            }
                            placeholder="e.g. Includes 1 free drink"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setTiers((arr) => [
                          ...arr,
                          { name: "", priceUsd: "0", qty: "50", description: "" },
                        ])
                      }
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add ticket tier
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Free tickets are fine — just set price to 0. You can edit tiers later from the dashboard.
                  </p>
                </>
              )}

              {/* Step 4: Cover image */}
              {step === 4 && (
                <div className="space-y-4">
                  <Label>Event cover image</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {coverImageUrl ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
                        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                        <img
                          src={coverImageUrl}
                          alt="Event cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        Replace image
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 bg-secondary/30"
                    >
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload (PNG, JPG, WebP — up to 10MB)
                          </span>
                        </>
                      )}
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Skip this step if you don't have an image yet — you can add one later.
                  </p>
                </div>
              )}

              {/* Step 5: Review */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Review your event</h3>
                    <p className="text-xs text-muted-foreground">
                      Check everything looks right. You can save as a draft and edit later, or publish to go live immediately.
                    </p>
                  </div>
                  {coverImageUrl && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                      <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Title</div>
                      <div className="font-medium">{title || "—"}</div>
                    </div>
                    {description && (
                      <div>
                        <div className="text-xs text-muted-foreground">Description</div>
                        <div className="text-sm">{description}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Where</div>
                        <div className="text-sm">{city}{address ? ` · ${address}` : ""}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Capacity</div>
                        <div className="text-sm">{capacity}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Start</div>
                        <div className="text-sm">{startAt ? new Date(startAt).toLocaleString() : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">End</div>
                        <div className="text-sm">{endAt ? new Date(endAt).toLocaleString() : "—"}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Tickets</div>
                      <div className="space-y-1">
                        {tiers.map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span>{t.name || `Tier ${i + 1}`}</span>
                            <Badge variant="outline">
                              {parseFloat(t.priceUsd || "0") === 0
                                ? "Free"
                                : `$${parseFloat(t.priceUsd || "0").toFixed(2)}`}{" "}
                              · {t.qty}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer nav */}
          <div className="flex items-center justify-between mt-6 gap-3">
            <Button
              variant="outline"
              onClick={back}
              disabled={step === 1 || submitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < STEPS.length ? (
              <Button onClick={next} disabled={submitting}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => submit(false)}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save as draft
                </Button>
                <Button onClick={() => submit(true)} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Publish event
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
