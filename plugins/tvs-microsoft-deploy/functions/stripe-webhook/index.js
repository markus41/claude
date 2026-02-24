/**
 * Azure Function: stripe-webhook
 * HTTP trigger that validates Stripe webhook signatures and processes subscription events.
 * Updates Dataverse subscription records via the Dataverse Web API.
 *
 * Endpoint: POST /api/stripe-webhook
 * Events handled:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 */

const Stripe = require("stripe");
const { DefaultAzureCredential } = require("@azure/identity");
const fetch = require("node-fetch");

// ── Constants ───────────────────────────────────────────────────────────────

const TIER_MAP = {
  price_starter_monthly: { tier: 100000000, hours: 20, label: "Starter" },
  price_basic_monthly: { tier: 100000001, hours: 40, label: "Basic" },
  price_advanced_monthly: { tier: 100000002, hours: 80, label: "Advanced" },
};

const STATUS_MAP = {
  trialing: 100000000,
  active: 100000001,
  past_due: 100000002,
  canceled: 100000003,
  paused: 100000004,
};

// ── Dataverse Client ────────────────────────────────────────────────────────

class DataverseClient {
  constructor(environmentUrl) {
    this.baseUrl = `${environmentUrl}/api/data/v9.2`;
    this.credential = new DefaultAzureCredential();
  }

  async getToken() {
    const tokenResponse = await this.credential.getToken(
      `${this.baseUrl.split("/api")[0]}/.default`
    );
    return tokenResponse.token;
  }

  async request(method, entity, data = null, filter = null) {
    const token = await this.getToken();
    let url = `${this.baseUrl}/${entity}`;
    if (filter) url += `?$filter=${encodeURIComponent(filter)}`;

    const options = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        Prefer: 'return=representation,odata.include-annotations="*"',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Dataverse ${method} ${entity} failed: ${response.status} - ${errorBody}`
      );
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async findSubscription(stripeSubscriptionId) {
    const result = await this.request(
      "GET",
      "tvs_subscriptions",
      null,
      `tvs_stripesubscriptionid eq '${stripeSubscriptionId}'`
    );
    return result?.value?.[0] || null;
  }

  async findAccountByStripeCustomer(stripeCustomerId) {
    const result = await this.request(
      "GET",
      "tvs_accounts",
      null,
      `tvs_stripecustomerid eq '${stripeCustomerId}'`
    );
    return result?.value?.[0] || null;
  }

  async updateSubscription(subscriptionId, data) {
    return this.request(
      "PATCH",
      `tvs_subscriptions(${subscriptionId})`,
      data
    );
  }

  async createSubscription(data) {
    return this.request("POST", "tvs_subscriptions", data);
  }

  async updateAccount(accountId, data) {
    return this.request("PATCH", `tvs_accounts(${accountId})`, data);
  }

  async logAutomation(data) {
    return this.request("POST", "tvs_automationlogs", {
      tvs_flowname: "stripe-webhook",
      tvs_triggertype: 100000003, // Webhook
      tvs_executedat: new Date().toISOString(),
      ...data,
    });
  }
}

// ── Event Handlers ──────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session, dv, context) {
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!subscriptionId) {
    context.log("Checkout session without subscription, skipping.");
    return { action: "skipped", reason: "no subscription in session" };
  }

  const account = await dv.findAccountByStripeCustomer(customerId);
  if (!account) {
    context.log.warn(`No Dataverse account found for Stripe customer ${customerId}`);
    return { action: "skipped", reason: `no account for customer ${customerId}` };
  }

  // Resolve tier from line items
  const priceId = session.metadata?.price_id || "price_starter_monthly";
  const tierInfo = TIER_MAP[priceId] || TIER_MAP.price_starter_monthly;

  const existing = await dv.findSubscription(subscriptionId);
  if (existing) {
    context.log(`Subscription ${subscriptionId} already exists, updating.`);
    await dv.updateSubscription(existing.tvs_subscriptionid, {
      tvs_status: STATUS_MAP.active,
      tvs_tier: tierInfo.tier,
      tvs_monthlyhours: tierInfo.hours,
    });
    return { action: "updated", subscriptionId };
  }

  // Create new subscription record
  await dv.createSubscription({
    tvs_name: `${account.tvs_name} - ${tierInfo.label} Subscription`,
    "tvs_accountid@odata.bind": `/tvs_accounts(${account.tvs_accountid})`,
    tvs_stripesubscriptionid: subscriptionId,
    tvs_tier: tierInfo.tier,
    tvs_monthlyhours: tierInfo.hours,
    tvs_startdate: new Date().toISOString().split("T")[0],
    tvs_status: STATUS_MAP.active,
  });

  // Update account tier
  await dv.updateAccount(account.tvs_accountid, {
    tvs_tier: tierInfo.tier,
    tvs_monthlyhours: tierInfo.hours,
    tvs_status: 100000002, // Active
  });

  return { action: "created", subscriptionId, tier: tierInfo.label };
}

async function handleSubscriptionUpdated(subscription, dv, context) {
  const existing = await dv.findSubscription(subscription.id);
  if (!existing) {
    context.log.warn(`No Dataverse record for subscription ${subscription.id}`);
    return { action: "skipped", reason: "subscription not found" };
  }

  const status = STATUS_MAP[subscription.status] ?? STATUS_MAP.active;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tierInfo = priceId ? TIER_MAP[priceId] : null;

  const updateData = {
    tvs_status: status,
    tvs_currentperiodend: new Date(
      subscription.current_period_end * 1000
    )
      .toISOString()
      .split("T")[0],
  };

  if (tierInfo) {
    updateData.tvs_tier = tierInfo.tier;
    updateData.tvs_monthlyhours = tierInfo.hours;
  }

  if (subscription.cancel_at_period_end) {
    updateData.tvs_enddate = new Date(
      subscription.current_period_end * 1000
    )
      .toISOString()
      .split("T")[0];
  }

  await dv.updateSubscription(existing.tvs_subscriptionid, updateData);
  return { action: "updated", status: subscription.status };
}

async function handleSubscriptionDeleted(subscription, dv, context) {
  const existing = await dv.findSubscription(subscription.id);
  if (!existing) {
    return { action: "skipped", reason: "subscription not found" };
  }

  await dv.updateSubscription(existing.tvs_subscriptionid, {
    tvs_status: STATUS_MAP.canceled,
    tvs_enddate: new Date().toISOString().split("T")[0],
  });

  // Update account status to Paused
  if (existing._tvs_accountid_value) {
    await dv.updateAccount(existing._tvs_accountid_value, {
      tvs_status: 100000003, // Paused
    });
  }

  return { action: "canceled", subscriptionId: subscription.id };
}

async function handleInvoicePaymentSucceeded(invoice, dv, context) {
  if (!invoice.subscription) return { action: "skipped", reason: "no subscription" };

  const existing = await dv.findSubscription(invoice.subscription);
  if (!existing) return { action: "skipped", reason: "subscription not found" };

  await dv.updateSubscription(existing.tvs_subscriptionid, {
    tvs_status: STATUS_MAP.active,
    tvs_monthlyprice: invoice.amount_paid / 100,
  });

  return { action: "payment_recorded", amount: invoice.amount_paid / 100 };
}

async function handleInvoicePaymentFailed(invoice, dv, context) {
  if (!invoice.subscription) return { action: "skipped", reason: "no subscription" };

  const existing = await dv.findSubscription(invoice.subscription);
  if (!existing) return { action: "skipped", reason: "subscription not found" };

  await dv.updateSubscription(existing.tvs_subscriptionid, {
    tvs_status: STATUS_MAP.past_due,
  });

  return {
    action: "payment_failed",
    subscriptionId: invoice.subscription,
    attempt: invoice.attempt_count,
  };
}

// ── Main Function ───────────────────────────────────────────────────────────

module.exports = async function (context, req) {
  const startTime = Date.now();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Validate webhook signature
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      context.res = {
        status: 401,
        body: { error: "Missing stripe-signature header" },
      };
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      context.log.error(`Webhook signature verification failed: ${err.message}`);
      context.res = {
        status: 400,
        body: { error: "Invalid signature" },
      };
      return;
    }

    context.log(`Processing Stripe event: ${event.type} (${event.id})`);

    // Initialize Dataverse client
    const dataverseUrl =
      process.env.DATAVERSE_TVS_URL || "https://org-tvs-dev.crm.dynamics.com";
    const dv = new DataverseClient(dataverseUrl);

    // Route event to handler
    let result;
    switch (event.type) {
      case "checkout.session.completed":
        result = await handleCheckoutCompleted(event.data.object, dv, context);
        break;
      case "customer.subscription.updated":
        result = await handleSubscriptionUpdated(event.data.object, dv, context);
        break;
      case "customer.subscription.deleted":
        result = await handleSubscriptionDeleted(event.data.object, dv, context);
        break;
      case "invoice.payment_succeeded":
        result = await handleInvoicePaymentSucceeded(event.data.object, dv, context);
        break;
      case "invoice.payment_failed":
        result = await handleInvoicePaymentFailed(event.data.object, dv, context);
        break;
      default:
        context.log(`Unhandled event type: ${event.type}`);
        result = { action: "ignored", reason: `unhandled event type: ${event.type}` };
    }

    // Log automation result
    const duration = Date.now() - startTime;
    await dv.logAutomation({
      tvs_status: 100000000, // Success
      tvs_duration: duration,
      tvs_inputpayload: JSON.stringify({
        eventId: event.id,
        eventType: event.type,
      }),
      tvs_outputpayload: JSON.stringify(result),
      tvs_correlationid: event.id,
    }).catch((err) => {
      context.log.warn(`Failed to log automation: ${err.message}`);
    });

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        eventId: event.id,
        eventType: event.type,
        result,
        durationMs: duration,
      },
    };
  } catch (error) {
    context.log.error(`Stripe webhook failed: ${error.message}`);
    context.log.error(error.stack);

    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        error: "Webhook processing failed",
        message: error.message,
        durationMs: Date.now() - startTime,
      },
    };
  }
};
