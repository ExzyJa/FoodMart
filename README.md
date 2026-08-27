# FoodMart

## Firebase email verification

1. Create a project at https://console.firebase.google.com/.
2. In Authentication, enable the Email/Password sign-in provider.
3. Add your GoDaddy domain under Authentication > Settings > Authorized domains.
4. Register a Web app in Firebase Project settings and copy its `apiKey`, `authDomain`, `projectId`, and `appId` into `js/firebase-config.js`.
5. Upload the site to GoDaddy `public_html` and test `register.html` over HTTPS.

Firebase sends a verification link to the Gmail address. It stores the password securely, and this site does not store passwords in browser storage. Firebase sends a link rather than a six-digit verification code.