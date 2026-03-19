import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorDirectory } from "./hooks/useProfile";
import { MapPin, Music, CheckCircle2, ArrowRight } from "lucide-react";

const HERO_IMAGES = [
  "/img/hero/4151.jpg",
  "/img/hero/4152.jpg",
  "/img/hero/4153.jpg",
  "/img/hero/4154.jpg",
  "/img/hero/4155.jpg",
  "/img/hero/4156.jpg",
  "/img/hero/4157.jpg",
  "/img/hero/4158.jpg",
  "/img/hero/4168.jpg",
  "/img/hero/4169.jpg",
  "/img/hero/4170.jpg",
  "/img/hero/4171.jpg",
  "/img/hero/4173.jpg",
  "/img/hero/4174.jpg",
  "/img/hero/4175.jpg",
  "/img/hero/4176.jpg",
];

function Filmstrip() {
  // Double the array for seamless infinite loop
  const images = [...HERO_IMAGES, ...HERO_IMAGES];
  return (
    <div
      className="relative overflow-hidden mb-12"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
      }}
    >
      <div
        className="flex gap-3"
        style={{
          width: "max-content",
          animation: "filmRoll 45s linear infinite",
          willChange: "transform",
        }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-52 h-36 md:w-64 md:h-44 rounded-xl overflow-hidden"
          >
            <img
              src={src}
              alt="Seattle nightlife"
              width={256}
              height={176}
              loading={i < 6 ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes filmRoll {
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

const COMING_SOON_CITIES = ["Los Angeles", "San Francisco", "New York", "Miami", "Austin"];

export default function CreatorDirectory() {
  const [selectedCity, setSelectedCity] = useState("Seattle");
  const isComingSoon = selectedCity !== "Seattle";
  const { data: creators, isLoading } = useCreatorDirectory(isComingSoon ? undefined : selectedCity);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Discover <span className="text-primary">Creators</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10">
              DJs, promoters, and hosts building the nightlife scene
            </p>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-56 h-12 bg-secondary border-border mx-auto">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Seattle">Seattle</SelectItem>
                {COMING_SOON_CITIES.map((city) => (
                  <SelectItem key={city} value={city} className="text-muted-foreground">
                    {city} (Coming Soon)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Creator Grid */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          {isComingSoon ? (
            <div className="max-w-4xl mx-auto">
              <Filmstrip />
              <div className="text-center">
                <h3 className="font-display text-2xl font-bold mb-3">{selectedCity} Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  We're expanding to {selectedCity}. For now, explore Seattle creators.
                </p>
                <button
                  onClick={() => setSelectedCity("Seattle")}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  View Seattle creators
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : !creators || creators.length === 0 ? (
            <div className="max-w-4xl mx-auto">
              <Filmstrip />
              <div className="text-center">
                <h3 className="font-display text-2xl font-bold mb-3">Join the Creators of Seattle</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  The Seattle scene is building. Host your first event and put your name on the map.
                </p>
                <Button asChild>
                  <Link to="/submit">
                    Become a Host
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-8 max-w-5xl mx-auto">
                <span className="font-semibold text-foreground">{creators.length}</span> creator
                {creators.length !== 1 ? "s" : ""}
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {creators.map((creator) => {
                  const linkPath = creator.slug
                    ? `/u/${creator.slug}`
                    : `/u/${creator.user_id}`;

                  return (
                    <Link
                      key={creator.id}
                      to={linkPath}
                      className="group block"
                    >
                      <div className="rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 p-6">
                        <div className="flex items-start gap-4 mb-4">
                          {creator.avatar_url ? (
                            <img
                              src={creator.avatar_url}
                              alt=""
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/30 transition-colors"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                              <Music className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-display text-lg font-semibold truncate group-hover:text-primary transition-colors">
                                {creator.stage_name || creator.display_name || "Creator"}
                              </h3>
                              {creator.verified && (
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {(creator.home_city || creator.city) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {creator.home_city || creator.city}
                                </span>
                              )}
                              {creator.creator_type && (
                                <Badge variant="secondary" className="text-2xs capitalize">
                                  {creator.creator_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {creator.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {creator.bio}
                          </p>
                        )}

                        {creator.genres && creator.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {creator.genres.slice(0, 4).map((genre) => (
                              <Badge key={genre} variant="secondary" className="text-2xs">
                                {genre}
                              </Badge>
                            ))}
                            {creator.genres.length > 4 && (
                              <Badge variant="secondary" className="text-2xs">
                                +{creator.genres.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}

                        {creator.booking_open && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <Badge className="bg-green-500/20 text-green-400 text-2xs">
                              Open for bookings
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
