# FoodMart

## Email verification

1. Create a project at https://console.firebase.google.com/.
2. In Authentication, enable the Email/Password sign-in provider.
3. Add your GoDaddy domain under Authentication > Settings > Authorized domains.
4. Register a Web app in Firebase Project settings and copy its `apiKey`, `authDomain`, `projectId`, and `appId` into `js/firebase-config.js`.
5. Upload the site to GoDaddy `public_html` and test `register.html` over HTTPS.

Firebase sends a verification link to the Gmail address. It stores the password securely, and this site does not store passwords in browser storage. Firebase sends a link rather than a six-digit verification code.

## PayMongo on GoDaddy

1. Create a PayMongo account and copy the test secret key from Developers > API keys.
2. Copy the test webhook signing secret from Developers > Webhooks.
3. Set `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, and `SITE_URL` in the GoDaddy PHP environment or server-side `.env` file.
4. Upload the `api` folder to GoDaddy `public_html`. PHP cURL must be enabled by the hosting plan.
5. In PayMongo Developers > Webhooks, add `https://intern7zsa.com/api/payment-webhook.php` and subscribe to successful and failed payment events.
6. Choose PayMongo at checkout. The browser calls `api/create-checkout.php`, which creates a hosted PayMongo checkout using server-side prices.

The current GitHub Pages deployment cannot execute PHP. The domain must point to GoDaddy for this setup.

Use test keys first. Replace them with live keys only after testing, and never put the PayMongo secret key in JavaScript or commit it to GitHub. The webhook currently verifies the event signature and acknowledges it; add order-database storage where marked in `api/payment-webhook.php` before relying on automatic fulfillment.