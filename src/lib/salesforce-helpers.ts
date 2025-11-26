// src/lib/salesforce-helpers.ts

import type {
  CatalogInteractionEventPayload,
  CatalogObjectAttributes,
} from "@/types/salesforce";

// Helper to send Identity event (user registration/login or anonymous)
export function sendIdentityEvent(params: {
  isAnonymous: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}): void {
  if (typeof window === "undefined" || !window.SalesforceInteractions) return;

  try {
    const attrs: Record<string, string | number> = {
      eventType: "identity",
      isAnonymous: params.isAnonymous ? 1 : 0, // 1 = known, 0 = anonymous (atau sebaliknya, yang penting konsisten dengan schema kamu)
    };

    if (params.firstName) attrs.firstName = params.firstName;
    if (params.lastName) attrs.lastName = params.lastName;
    if (params.email) attrs.email = params.email;
    if (params.phoneNumber) attrs.phoneNumber = params.phoneNumber;

    window.SalesforceInteractions.sendEvent({
      user: {
        attributes: attrs,
      },
    });

    console.log("📊 Identity event sent via SDK:", attrs);
  } catch (error) {
    console.error("Error sending identity event:", error);
  }
}

// Helper to send Contact Point Email event
export function sendContactPointEmailEvent(email: string): void {
  if (typeof window === "undefined" || !window.SalesforceInteractions) return;

  try {
    window.SalesforceInteractions.sendEvent({
      eventType: "contactPointEmail",
      category: "Profile",
      email: email,
    });
    console.log("📊 Contact Point Email event sent:", email);
  } catch (error) {
    console.error("Error sending contact point email event:", error);
  }
}

// Helper to send Party Identification event (user ID mapping)
export function sendPartyIdentificationEvent(params: {
  userId: string;
  idType: string;
  idName: string;
}): void {
  if (typeof window === "undefined" || !window.SalesforceInteractions) return;

  try {
    window.SalesforceInteractions.sendEvent({
      eventType: "partyIdentification",
      category: "Profile",
      userId: params.userId,
      IDType: params.idType,
      IDName: params.idName,
    });
    console.log("📊 Party Identification event sent:", params);
  } catch (error) {
    console.error("Error sending party identification event:", error);
  }
}

// Helper to send Consent event
export function sendConsentEvent(params: {
  purpose: string;
  status: "OptIn" | "OptOut" | "NotProvided";
  provider?: string;
}): void {
  if (typeof window === "undefined" || !window.SalesforceInteractions) return;

  try {
    const consentData: Record<string, string> = {
      eventType: "consentLog",
      category: "Engagement",
      purpose: params.purpose,
      status: params.status,
    };

    if (params.provider) {
      consentData.provider = params.provider;
    }

    window.SalesforceInteractions.sendEvent(consentData);
    console.log("📊 Consent event sent:", params);
  } catch (error) {
    console.error("Error sending consent event:", error);
  }
}

// Helper to send Catalog Interaction event (product/feature click)
export function sendCatalogInteractionEvent(params: {
  interactionName: string; // "View_Feature_Object"
  catalogType: string; // "Feature"
  id: string; // "fast-feature", "secure-feature", ...
  name: string; // label di UI
  sku: string; // sku unik
  extraAttributes?: Record<string, string>;
}): void {
  if (typeof window === "undefined" || !window.SalesforceInteractions) return;

  try {
    const attributes: CatalogObjectAttributes = {
      name: params.name,
      sku: params.sku,
      ...(params.extraAttributes ?? {}),
    };

    const payload: CatalogInteractionEventPayload = {
      interaction: {
        name: params.interactionName,
        catalogObject: {
          type: params.catalogType,
          id: params.id,
          attributes,
        },
      },
    };

    window.SalesforceInteractions.sendEvent(payload);
    console.log("📊 Catalog interaction event sent:", payload);
  } catch (error) {
    console.error("Error sending catalog interaction event:", error);
  }
}

// Generic custom interaction event sender (using catalog eventType)
export function sendCustomInteractionEvent(
  interactionName: string,
  additionalData?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined" || !window.SalesforceInteractions) return;

  try {
    const eventData: Record<string, string | number | boolean> = {
      eventType: "catalog",
      category: "Engagement",
      interactionName: interactionName,
      id: `interaction-${Date.now()}`,
      type: "interaction",
    };

    // Add additional data if provided
    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        eventData[key] = additionalData[key];
      });
    }

    window.SalesforceInteractions.sendEvent(eventData);
    console.log(
      "📊 Custom interaction event sent:",
      interactionName,
      additionalData
    );
  } catch (error) {
    console.error("Error sending custom interaction event:", error);
  }
}
