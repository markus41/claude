---
name: Stripe Integration
description: This skill should be used when working with stripe/**, billing/**, or subscription/** paths. It provides Stripe API patterns for TVS Motor subscription management including product/price creation, subscription lifecycle, webhook signature verification, customer portal integration, and metered billing for VA time tracking.
version: 1.0.0
---

# Stripe Integration for ROSA Holdings

Complete reference for Stripe API operations supporting TVS Motor broker subscription tiers and VA time-tracking billing.

## TVS Motor Subscription Tiers

| Tier | Monthly Price | Included Hours | Overage Rate | Stripe Price ID Pattern |
|------|-------------|----------------|--------------|------------------------|
| Starter | $360/mo | 20 hrs | $20/hr | `price_tvs_starter_monthly` |
| Basic | $640/mo | 40 hrs | $18/hr | `price_tvs_basic_monthly` |
| Advanced | $1,200/mo | 80 hrs | $16/hr | `price_tvs_advanced_monthly` |

## Authentication

```bash
# All Stripe API calls use Bearer auth
# Secret key stored in kv-rosa-holdings as "stripe-api-key-tvs"
STRIPE_SK="sk_live_xxxx"  # Retrieved from Key Vault at runtime
STRIPE="https://api.stripe.com/v1"
AUTH="Authorization: Bearer ${STRIPE_SK}"
```

## Product and Price Creation

```bash
# Create TVS Motor product
curl -s -X POST "${STRIPE}/products" \
  -H "${AUTH}" \
  -d "name=TVS Motor Broker Services" \
  -d "description=Virtual assistant services for TVS Motor broker operations" \
  -d "metadata[entity]=tvs" \
  -d "metadata[managed_by]=rosa-deploy"

# Create Starter tier price ($360/mo)
curl -s -X POST "${STRIPE}/prices" \
  -H "${AUTH}" \
  -d "product=${PRODUCT_ID}" \
  -d "unit_amount=36000" \
  -d "currency=usd" \
  -d "recurring[interval]=month" \
  -d "nickname=TVS Starter" \
  -d "lookup_key=tvs_starter_monthly" \
  -d "metadata[tier]=starter" \
  -d "metadata[included_hours]=20"

# Create Basic tier price ($640/mo)
curl -s -X POST "${STRIPE}/prices" \
  -H "${AUTH}" \
  -d "product=${PRODUCT_ID}" \
  -d "unit_amount=64000" \
  -d "currency=usd" \
  -d "recurring[interval]=month" \
  -d "nickname=TVS Basic" \
  -d "lookup_key=tvs_basic_monthly" \
  -d "metadata[tier]=basic" \
  -d "metadata[included_hours]=40"

# Create Advanced tier price ($1200/mo)
curl -s -X POST "${STRIPE}/prices" \
  -H "${AUTH}" \
  -d "product=${PRODUCT_ID}" \
  -d "unit_amount=120000" \
  -d "currency=usd" \
  -d "recurring[interval]=month" \
  -d "nickname=TVS Advanced" \
  -d "lookup_key=tvs_advanced_monthly" \
  -d "metadata[tier]=advanced" \
  -d "metadata[included_hours]=80"

# Create metered overage price (per-hour, usage-based)
curl -s -X POST "${STRIPE}/prices" \
  -H "${AUTH}" \
  -d "product=${PRODUCT_ID}" \
  -d "currency=usd" \
  -d "recurring[interval]=month" \
  -d "recurring[usage_type]=metered" \
  -d "recurring[aggregate_usage]=sum" \
  -d "billing_scheme=tiered" \
  -d "tiers_mode=graduated" \
  -d "tiers[0][up_to]=inf" \
  -d "tiers[0][unit_amount]=2000" \
  -d "nickname=TVS Overage Hours" \
  -d "lookup_key=tvs_overage_hourly" \
  -d "metadata[type]=overage"
```

## Customer Management

```bash
# Create customer for broker
curl -s -X POST "${STRIPE}/customers" \
  -H "${AUTH}" \
  -d "name=Acme Brokerage LLC" \
  -d "email=billing@acmebrokerage.com" \
  -d "metadata[broker_id]=rosa_broker_001" \
  -d "metadata[entity]=tvs" \
  -d "metadata[dataverse_id]=${DATAVERSE_BROKER_GUID}" \
  -d "tax_id_data[0][type]=us_ein" \
  -d "tax_id_data[0][value]=12-3456789"

# Update customer metadata
curl -s -X POST "${STRIPE}/customers/${CUSTOMER_ID}" \
  -H "${AUTH}" \
  -d "metadata[tier]=basic" \
  -d "metadata[onboarded_date]=2026-02-24"

# Search customers by metadata
curl -s -G "${STRIPE}/customers/search" \
  -H "${AUTH}" \
  --data-urlencode "query=metadata['entity']:'tvs' AND metadata['tier']:'basic'"

# List all TVS customers
curl -s "${STRIPE}/customers?limit=100" \
  -H "${AUTH}" \
  | jq '.data[] | select(.metadata.entity == "tvs") | {id, name, email, tier: .metadata.tier}'
```

## Subscription Lifecycle

### Create Subscription

```bash
# Create subscription with base tier + overage meter
curl -s -X POST "${STRIPE}/subscriptions" \
  -H "${AUTH}" \
  -d "customer=${CUSTOMER_ID}" \
  -d "items[0][price]=${STARTER_PRICE_ID}" \
  -d "items[1][price]=${OVERAGE_PRICE_ID}" \
  -d "payment_behavior=default_incomplete" \
  -d "payment_settings[save_default_payment_method]=on_subscription" \
  -d "expand[]=latest_invoice.payment_intent" \
  -d "metadata[entity]=tvs" \
  -d "metadata[tier]=starter" \
  -d "metadata[broker_id]=rosa_broker_001"
```

### Upgrade/Downgrade Tier

```bash
# Upgrade from Starter to Basic (prorate)
curl -s -X POST "${STRIPE}/subscriptions/${SUBSCRIPTION_ID}" \
  -H "${AUTH}" \
  -d "items[0][id]=${BASE_ITEM_ID}" \
  -d "items[0][price]=${BASIC_PRICE_ID}" \
  -d "proration_behavior=create_prorations" \
  -d "metadata[tier]=basic" \
  -d "metadata[upgraded_from]=starter" \
  -d "metadata[upgrade_date]=$(date -I)"
```

### Cancel Subscription

```bash
# Cancel at period end (graceful)
curl -s -X POST "${STRIPE}/subscriptions/${SUBSCRIPTION_ID}" \
  -H "${AUTH}" \
  -d "cancel_at_period_end=true" \
  -d "metadata[cancel_reason]=broker_churned"

# Immediate cancellation with proration
curl -s -X DELETE "${STRIPE}/subscriptions/${SUBSCRIPTION_ID}" \
  -H "${AUTH}" \
  -d "prorate=true" \
  -d "invoice_now=true"
```

### Pause Subscription

```bash
# Pause collection (keep subscription active but stop billing)
curl -s -X POST "${STRIPE}/subscriptions/${SUBSCRIPTION_ID}" \
  -H "${AUTH}" \
  -d "pause_collection[behavior]=void" \
  -d "metadata[paused_reason]=seasonal_break"

# Resume collection
curl -s -X POST "${STRIPE}/subscriptions/${SUBSCRIPTION_ID}" \
  -H "${AUTH}" \
  -d "pause_collection="
```

## Metered Billing for Time Tracking

```bash
# Report VA time worked (in hours, at end of day)
curl -s -X POST "${STRIPE}/subscription_items/${OVERAGE_ITEM_ID}/usage_records" \
  -H "${AUTH}" \
  -d "quantity=3" \
  -d "timestamp=$(date +%s)" \
  -d "action=increment" \
  -d "metadata[va_id]=juan.reyes.va" \
  -d "metadata[date]=$(date -I)" \
  -d "metadata[task]=broker_onboarding"

# Get usage summary for current period
curl -s "${STRIPE}/subscription_items/${OVERAGE_ITEM_ID}/usage_record_summaries?limit=10" \
  -H "${AUTH}" \
  | jq '.data[] | {period: .period, total_usage: .total_usage, invoice: .invoice}'

# Batch report usage (multiple VAs, via Azure Function)
# POST to func-rosa-ingest/api/report-time
# Body: [{"va_id": "juan.reyes.va", "hours": 3, "date": "2026-02-24", "task": "broker_onboarding"}]
```

## Webhook Handling

### Webhook Signature Verification (Node.js / Azure Function)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function handleStripeWebhook(req: Request): Promise<Response> {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
      await syncSubscriptionToDataverse(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.updated':
      await updateSubscriptionInDataverse(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await deactivateBrokerInDataverse(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.payment_succeeded':
      await recordPaymentInDataverse(event.data.object as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handleFailedPayment(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response('OK', { status: 200 });
}
```

### Register Webhook Endpoint

```bash
# Create webhook endpoint
curl -s -X POST "${STRIPE}/webhook_endpoints" \
  -H "${AUTH}" \
  -d "url=https://func-rosa-ingest.azurewebsites.net/api/stripe-webhook" \
  -d "enabled_events[]=customer.subscription.created" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted" \
  -d "enabled_events[]=invoice.payment_succeeded" \
  -d "enabled_events[]=invoice.payment_failed" \
  -d "enabled_events[]=customer.created" \
  -d "description=ROSA Holdings TVS ingest function" \
  -d "metadata[entity]=tvs"
```

## Customer Portal

```bash
# Create billing portal configuration
curl -s -X POST "${STRIPE}/billing_portal/configurations" \
  -H "${AUTH}" \
  -d "business_profile[headline]=TVS Motor Broker Services" \
  -d "business_profile[privacy_policy_url]=https://broker.tvs.rosah.com/privacy" \
  -d "business_profile[terms_of_service_url]=https://broker.tvs.rosah.com/terms" \
  -d "features[subscription_update][enabled]=true" \
  -d "features[subscription_update][default_allowed_updates][]=price" \
  -d "features[subscription_update][proration_behavior]=create_prorations" \
  -d "features[subscription_update][products][0][product]=${PRODUCT_ID}" \
  -d "features[subscription_update][products][0][prices][]=${STARTER_PRICE_ID}" \
  -d "features[subscription_update][products][0][prices][]=${BASIC_PRICE_ID}" \
  -d "features[subscription_update][products][0][prices][]=${ADVANCED_PRICE_ID}" \
  -d "features[subscription_cancel][enabled]=true" \
  -d "features[subscription_cancel][mode]=at_period_end" \
  -d "features[invoice_history][enabled]=true" \
  -d "features[payment_method_update][enabled]=true"

# Create portal session for customer
curl -s -X POST "${STRIPE}/billing_portal/sessions" \
  -H "${AUTH}" \
  -d "customer=${CUSTOMER_ID}" \
  -d "return_url=https://broker.tvs.rosah.com/dashboard"
# Returns: { "url": "https://billing.stripe.com/session/xxx" }
```

## Reporting

```bash
# Get MRR by tier
curl -s -G "${STRIPE}/subscriptions" \
  -H "${AUTH}" \
  -d "status=active" \
  -d "limit=100" \
  | jq '[.data[] | select(.metadata.entity == "tvs")] | group_by(.metadata.tier) | map({tier: .[0].metadata.tier, count: length, mrr_cents: (map(.items.data[0].price.unit_amount) | add)})'

# Get upcoming invoices for all active subscriptions
curl -s "${STRIPE}/invoices/upcoming?customer=${CUSTOMER_ID}" \
  -H "${AUTH}" \
  | jq '{amount_due: .amount_due, period_end: .period_end, lines: [.lines.data[] | {description, amount}]}'
```

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `resource_missing` | Invalid customer/price/subscription ID | Verify ID exists with GET before mutating |
| `card_declined` | Payment method failed | Trigger dunning flow, notify broker via email |
| `webhook_signature_verification_failed` | Wrong webhook secret | Verify `STRIPE_WEBHOOK_SECRET` matches endpoint config |
| `amount_too_small` | Charge below $0.50 | Accumulate usage until minimum threshold met |
| `rate_limit` | Too many API calls | Implement exponential backoff; batch operations |
| `idempotency_key_in_use` | Duplicate request | Wait for original request to complete |
