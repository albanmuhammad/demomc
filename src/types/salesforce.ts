// src/types/salesforce.ts

// Consent Types
export interface SalesforceConsent {
  purpose: string;
  status: "OptIn" | "OptOut" | "NotProvided";
}

export interface SalesforceSDKConfig {
  consents: SalesforceConsent[] | Promise<SalesforceConsent[]>;
  cookieDomain?: string;
}

export interface SalesforceInteractionsConfig {
  debug?: {
    logLevel: number;
  };
}

// Event Category Types based on Schema
export type EventCategory = "Engagement" | "Profile";

// Base Event Fields (common across all events)
interface BaseEventFields {
  category: string;
  dateTime: string; // ISO 8601 format
  deviceId: string;
  eventId: string;
  eventType: string;
  sessionId: string;
}

// Optional Source Fields
interface SourceFields {
  sourceChannel?: string;
  sourceLocale?: string;
  sourcePageType?: string;
  sourceUrl?: string;
  sourceUrlReferrer?: string;
  pageView?: number;
}

// Engagement Events
export interface CartEvent extends BaseEventFields, SourceFields {
  interactionName: string;
}

export interface CartItemEvent extends BaseEventFields {
  cartEventId: string;
  catalogObjectId: string;
  catalogObjectType: string;
  currency?: string;
  price?: number;
  quantity: number;
}

export interface CatalogEvent extends BaseEventFields, SourceFields {
  id: string;
  interactionName: string;
  type: string;
}

export interface ConsentEvent extends BaseEventFields {
  provider?: string;
  purpose?: string;
  status: "OptIn" | "OptOut" | "NotProvided";
}

export interface OrderEvent extends BaseEventFields, SourceFields {
  interactionName: string;
  orderId: string;
  orderCurrency?: string;
  orderTotalValue?: number;
}

export interface OrderItemEvent extends BaseEventFields {
  catalogObjectId: string;
  catalogObjectType: string;
  currency?: string;
  orderEventId: string;
  price?: number;
  quantity: number;
}

// Profile Events
export interface ContactPointAddressEvent
  extends BaseEventFields,
    SourceFields {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  city: string;
  country: string;
  postalCode: string;
  stateProvince: string;
}

export interface ContactPointEmailEvent extends BaseEventFields, SourceFields {
  email: string;
}

export interface ContactPointPhoneEvent extends BaseEventFields, SourceFields {
  phoneNumber: string;
}

export interface IdentityEvent extends BaseEventFields, SourceFields {
  isAnonymous: number; // 0 or 1
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  stateProvince?: string;
}

export interface PartyIdentificationEvent
  extends BaseEventFields,
    SourceFields {
  IDName: string;
  IDType: string;
  userId: string;
}

// Generic Event Interaction Interface for backward compatibility
export interface SalesforceEventInteraction {
  eventType: string;
  category?: string;
  name?: string;
  interactionName?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface SalesforceEventPayload {
  interaction: SalesforceEventInteraction;
}

// Strongly typed event payload
export type TypedEventPayload =
  | { interaction: CartEvent }
  | { interaction: CartItemEvent }
  | { interaction: CatalogEvent }
  | { interaction: ConsentEvent }
  | { interaction: OrderEvent }
  | { interaction: OrderItemEvent }
  | { interaction: ContactPointAddressEvent }
  | { interaction: ContactPointEmailEvent }
  | { interaction: ContactPointPhoneEvent }
  | { interaction: IdentityEvent }
  | { interaction: PartyIdentificationEvent };

export interface SalesforceC360a {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: (args: unknown) => void;
  loaded: boolean;
  version: string;
}

export type SalesforceEventValue =
  | string
  | number
  | boolean
  | null
  | SalesforceEventPayloadObject
  | SalesforceEventValue[]; // array

export interface SalesforceEventPayloadObject {
  [key: string]: SalesforceEventValue;
}

/**
 * Catalog payload types
 */

// Attributes di dalam catalogObject
export interface CatalogObjectAttributes extends SalesforceEventPayloadObject {
  name: string;
  sku: string;
}

// Payload catalogObject
export interface CatalogObjectPayload extends SalesforceEventPayloadObject {
  type: string; // misal "Experience" / "Feature" / "Product"
  id: string; // ID produk / feature
  attributes: CatalogObjectAttributes;
}

// interaction khusus catalog
export interface CatalogInteraction extends SalesforceEventPayloadObject {
  name: string; // misal "View_Feature_Object"
  catalogObject: CatalogObjectPayload;
}

// payload event yang dikirim ke sendEvent
export interface CatalogInteractionEventPayload
  extends SalesforceEventPayloadObject {
  interaction: CatalogInteraction;
}

export interface SalesforceInteractionsAPI {
  init: (config: SalesforceSDKConfig) => Promise<void>;
  initSitemap: () => Promise<void>;
  reinit: () => void;
  updateConsents: (consents: SalesforceConsent[]) => void;
  sendEvent: (payload: SalesforceEventPayloadObject) => void;
  Personalization?: SalesforcePersonalizationAPI;
}

// ---- Personalization types ----
export interface SalesforcePersonalizationAttributes {
  [key: string]: string;
}

export interface SalesforcePersonalizationItem {
  attributes?: SalesforcePersonalizationAttributes;
  // data memang ada tapi di kasus kamu kosong, jadi opsional saja
  data?: unknown[];
  decisionId?: string;
  personalizationId?: string;
  personalizationPointId?: string;
  personalizationPointName?: string;
}

export interface SalesforcePersonalizationResponse {
  personalizations?: SalesforcePersonalizationItem[];
  requestId?: string;
}

export interface SalesforcePersonalizationAPI {
  fetch: (keys: string[]) => Promise<SalesforcePersonalizationResponse>;
}

declare global {
  interface Window {
    c360a: SalesforceC360a;
    _c360a: SalesforceC360a;
    SalesforceInteractions: SalesforceInteractionsAPI;
    __sfInteractionsReady?: boolean;
  }
}

export {};
