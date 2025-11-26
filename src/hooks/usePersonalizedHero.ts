import { useEffect, useState } from "react";

export function usePersonalizedHero() {
  const [ctaText, setCtaText] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const runFetch = () => {
      const personalization = window.SalesforceInteractions?.Personalization;
      if (!personalization) {
        console.log(
          "[SF] Personalization SDK not available. Skip personalized block."
        );
        return;
      }

      personalization
        .fetch(["Home_Page_Image"])
        .then((response) => {
          console.log("[SF] Personalization response:", response);
          const attrs = response.personalizations?.[0]?.attributes;
          if (!attrs) return;

          const newImage = attrs.Product_Image_URL;
          const newCta = attrs.CTA_Text;

          if (newImage) setImageUrl(newImage);
          if (newCta) setCtaText(newCta);
        })
        .catch((err) => {
          console.error("[SF] Error fetching personalization:", err);
        });
    };

    // kalau SDK sudah siap (misal setelah hot reload)
    if (window.__sfInteractionsReady) {
      runFetch();
      return;
    }

    // kalau belum: tunggu event dari layout
    const handler = () => {
      runFetch();
    };

    window.addEventListener("sf_interactions_ready", handler);

    return () => {
      window.removeEventListener("sf_interactions_ready", handler);
    };
  }, []);

  return { ctaText, imageUrl };
}
