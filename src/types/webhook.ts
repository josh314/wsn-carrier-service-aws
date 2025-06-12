// src/types/webhook.ts

export interface RateRequestBody {
  readonly rate: RateRequest;
}

export interface RateRequest {
  readonly origin: Contact;
  readonly destination: Contact;
  readonly items: Array<OrderItem>;
  readonly currency: string;
  readonly locale: string;
}

export interface Contact {
  readonly country: string;
  readonly postal_code: string;
  readonly province: string;
  readonly city: string;
  readonly name?: string | null;
  readonly address1: string;
  readonly address2?: string | null;
  readonly address3?: string | null;
  readonly phone?: string | null;
  readonly fax?: string | null;
  readonly email?: string | null;
  readonly address_type?: string | null;
  readonly company_name?: string | null;
}

export interface OrderItem {
  readonly name?: string | null;
  readonly sku?: string | null;
  readonly quantity: number;
  readonly grams: number;
  readonly price: number;
  readonly vendor?: string | null;
  readonly requires_shipping: boolean;
  readonly taxable: boolean;
  readonly fulfillment_service?: string | null;
  readonly properties?: string | null;
  readonly product_id: number;
  readonly variant_id: number;
}
