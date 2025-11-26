// src/hooks/useSalesforceTracking.ts
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PRODUCTS, ProductId } from "@/config/products";
import {
  sendCustomInteractionEvent,
  sendIdentityEvent,
  sendContactPointEmailEvent,
  sendPartyIdentificationEvent,
  sendConsentEvent,
  sendCatalogInteractionEvent,
} from "@/lib/salesforce-helpers";

export function useSalesforceTracking() {
  const pathname = usePathname();

  // Reinit on route change for SPA navigation
  useEffect(() => {
    if (typeof window !== "undefined" && window.SalesforceInteractions) {
      try {
        window.SalesforceInteractions.reinit();
        console.log("🔄 Salesforce reinit for route:", pathname);
      } catch (error) {
        console.error("Error reinitializing Salesforce:", error);
      }
    }
  }, [pathname]);

  // Generic event tracking (using catalog event type)
  const trackEvent = (
    eventName: string,
    additionalData?: Record<string, string | number | boolean>
  ): void => {
    sendCustomInteractionEvent(eventName, additionalData);
  };

  // Track user identity (registration/login or anonymous)
  const trackIdentity = (params: {
    isAnonymous: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  }): void => {
    sendIdentityEvent(params);
  };

  // Track email contact point
  const trackEmail = (email: string): void => {
    sendContactPointEmailEvent(email);
  };

  // Track user ID mapping
  const trackUserId = (params: {
    userId: string;
    idType: string;
    idName: string;
  }): void => {
    sendPartyIdentificationEvent(params);
  };

  // Track consent changes
  const trackConsent = (params: {
    purpose: string;
    status: "OptIn" | "OptOut" | "NotProvided";
    provider?: string;
  }): void => {
    sendConsentEvent(params);
  };

  const trackProductCatalogClick = (productId: ProductId): void => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    sendCatalogInteractionEvent({
      interactionName: "View_Product_Object",
      catalogType: "Product",
      id: product.sku, // masuk ke DLO sebagai id
      name: product.name, // attributeName
      sku: product.sku, // attributeSku
      extraAttributes: {
        productId: product.id,
      },
    });
  };

  return {
    trackEvent,
    trackIdentity,
    trackEmail,
    trackUserId,
    trackConsent,
    trackProductCatalogClick,
  };
}
