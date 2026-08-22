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
};

export default function RestaurantThemeRouter() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [restaurant, setRestaurant] = useState<RestaurantThemeRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    async function loadTheme() {
      setLoading(true);

      const { data, error } = await supabase
        .from("restaurants")
        .select("id,name,slug,theme_key,theme_mode")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        setRestaurant(null);
        setLoading(false);
        return;
      }

      setRestaurant(data);
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
        Restaurant not found.
      </main>
    );
  }

  if (restaurant.theme_key === "vi-pollos-custom") {
    return <ViPollosCustomTheme restaurantId={restaurant.id} slug={restaurant.slug} />;
  }

  return <DefaultRestaurantTheme />;
}
