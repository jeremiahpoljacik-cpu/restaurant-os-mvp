"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import DefaultRestaurantTheme from "./themes/DefaultRestaurantTheme";
import ViPollosCustomTheme from "./themes/ViPollosCustomTheme";

type RestaurantThemeRow = {
  id: string;
  name: string;
  slug: string;
  theme_key: string | null;
  theme_mode: string | null;
  published: boolean;
};

export default function RestaurantThemeRouter() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [restaurant, setRestaurant] = useState<RestaurantThemeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!slug) return;

    async function loadTheme() {
      setLoading(true);
      setMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `/api/public/restaurant-theme?slug=${encodeURIComponent(slug)}`,
        {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        }
      );

      const data = await response.json();

      if (!response.ok || !data.restaurant) {
        setRestaurant(null);
        setMessage(data.error || "Restaurant not found.");
        setLoading(false);
        return;
      }

      setRestaurant(data.restaurant);
      setLoading(false);
    }

    loadTheme();
  }, [slug]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f5ecdc",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        Loading restaurant...
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f5ecdc",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {message || "Restaurant not found."}
      </main>
    );
  }

  if (restaurant.theme_key === "vi-pollos-custom") {
    return (
      <ViPollosCustomTheme
        restaurantId={restaurant.id}
        slug={restaurant.slug}
      />
    );
  }

  return <DefaultRestaurantTheme />;
}
