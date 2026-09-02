const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const crypto = require("crypto");

const paymongoSecret = defineSecret("PAYMONGO_SECRET_KEY");
const paymongoWebhookSecret = defineSecret("PAYMONGO_WEBHOOK_SECRET");
const siteUrl = "https://foodmart-f4b93.web.app";
const catalog = {
  bananas: { name: "Fresh Bananas", amount: 10000 },
  biscuits: { name: "Butter Biscuits", amount: 10000 },
  cucumber: { name: "Fresh Cucumber", amount: 10000 },
  milk: { name: "Pure Fresh Milk", amount: 10000 },
  tomatoes: { name: "Garden Tomatoes", amount: 10000 },
  ketchup: { name: "Tomato Ketchup", amount: 10000 }
};

function jsonResponse(response, data, status = 200) {
  response.status(status).type("application/json").send(data);
}

exports.createCheckout = onRequest({ secrets: [paymongoSecret] }, async (request, response) => {
  if (request.method !== "POST") return jsonResponse(response, { message: "POST requests only." }, 405);

  const items = Array.isArray(request.body && request.body.items) ? request.body.items : [];
  const lineItems = [];
  let total = 0;

  for (const item of items) {
    const product = catalog[String(item.id || "")];
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return jsonResponse(response, { message: "The order contains an invalid product or quantity." }, 422);
    }
    lineItems.push({ currency: "PHP", amount: product.amount, name: product.name, quantity });
    total += product.amount * quantity;
  }

  if (!lineItems.length) return jsonResponse(response, { message: "Your cart is empty." }, 422);
  const email = String(request.body.customer_email || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(response, { message: "Enter a valid email address." }, 422);
  }

  const payload = {
    data: {
      attributes: {
        line_items: lineItems,
        payment_method_types: ["card", "gcash", "paymaya"],
        description: `FoodMart order ${String(request.body.order_number || "FoodMart").slice(0, 40)}`,
        send_email_receipt: true,
        success_url: `${siteUrl}/shop.html?payment=success`,
        cancel_url: `${siteUrl}/shop.html?payment=cancelled`
      }
    }
  };

  try {
    const paymongoResponse = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${paymongoSecret.value()}:`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await paymongoResponse.json();
    const checkoutUrl = result.data && result.data.attributes && result.data.attributes.checkout_url;
    if (!paymongoResponse.ok || !checkoutUrl) {
      return jsonResponse(response, { message: "PayMongo could not create the checkout session." }, 502);
    }
    return jsonResponse(response, { checkout_url: checkoutUrl, amount: total });
  } catch (error) {
    return jsonResponse(response, { message: "The payment service is temporarily unavailable." }, 502);
  }
});

exports.paymentWebhook = onRequest({ secrets: [paymongoWebhookSecret] }, (request, response) => {
  if (request.method !== "POST") return jsonResponse(response, { message: "POST requests only." }, 405);
  const signature = String(request.get("paymongo-signature") || "");
  const parts = Object.fromEntries(signature.split(",").map((part) => part.split("=", 2)));
  const timestamp = parts.t;
  const provided = parts.li || parts.te;
  const rawBody = request.rawBody || Buffer.from(JSON.stringify(request.body || {}));
  const expected = crypto.createHmac("sha256", paymongoWebhookSecret.value())
    .update(`${timestamp}.${rawBody.toString()}`).digest("hex");
  const valid = timestamp && provided && provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected)) &&
    Math.abs(Date.now() / 1000 - Number(timestamp)) <= 300;
  if (!valid) return jsonResponse(response, { message: "Invalid webhook signature." }, 401);
  return jsonResponse(response, { received: true });
});
