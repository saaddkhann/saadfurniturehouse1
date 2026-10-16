# Saad Furniture House — React + Vite

A responsive furniture storefront with Firebase Authentication admin login, Firestore product/order management, optional Cloudinary uploads, customer guest checkout, UPI intent/QR handoff, Cash on Delivery, and WhatsApp order follow-up.

## 1. Install and run

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Open the local URL printed by Vite.

## 2. Configure Firebase

1. Open Firebase Console and select your existing project.
2. In Project settings, register a Web App if you have not already done so.
3. Copy its web configuration into `.env` (the `VITE_FIREBASE_*` variables).
4. In **Authentication → Sign-in method**, enable **Email/Password**.
5. In **Firestore Database**, create a database if needed.
6. In Firestore **Rules**, publish the contents of `firestore.rules`.
7. In Authentication → Users, create the admin user using a strong password.
8. Copy that user's UID. In Firestore, create a collection named `admins`, then create a document whose document ID is exactly that UID. It can contain `{ "role": "admin" }`.

**Important:** Do not add a public admin sign-up flow. Do not put service-account keys or other private credentials in a Vite `.env` file. Variables prefixed with `VITE_` are visible to website visitors.

## 3. UPI and COD

- COD / pay at pickup is available at checkout.
- For UPI, set `VITE_UPI_ID` to your real merchant UPI ID and `VITE_UPI_NAME` to your display name in `.env`.
- The starter displays a QR code and attempts to open a UPI app using a UPI payment URI. It does **not** automatically verify payment or guarantee that a UPI app is installed.
- For reliable online payment confirmation, integrate a gateway such as Razorpay with a server-side order-creation endpoint and verified webhook/signature handling. Never mark an order paid just because the browser says it is paid.
- Test with a small amount before accepting customer payments.

## 4. WhatsApp

Set `VITE_WHATSAPP_NUMBER` to the shop number with country code, digits only (example: `919876543210`). The customer checkout opens WhatsApp with an order summary. This requires the WhatsApp number to be correct.

## 5. Product photos (Cloudinary)

1. Create/select a Cloudinary account.
2. Create an **unsigned upload preset** with appropriate restrictions (allowed image formats and size limits).
3. Add `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` to `.env`.
4. Restart the Vite dev server after editing `.env`.

The storefront uses demo product images until you add your own products. You can also paste an image URL in the admin form.

## 6. Deploy on Vercel

1. Push the project to a GitHub repository.
2. Import it in Vercel.
3. Add all needed `VITE_*` variables in Vercel Project Settings → Environment Variables.
4. Deploy. Redeploy after changing environment variables.

## 7. Important security and production notes

- Firestore rules restrict product editing and order viewing/updating to users whose UID has a document in `admins`.
- Public checkout can create orders, but the starter rules are not a complete anti-abuse or pricing-validation system. For production, use a trusted server/Cloud Function or backend to validate product IDs, current prices, stock, totals, rate-limit submissions, and verify online payments.
- The browser checkout writes item prices sent by the client. Before public launch, implement server-side total calculation and validation so customers cannot tamper with prices.
- Add delivery fees, serviceable PIN codes, privacy policy, cancellation/return policy, and tax details appropriate for your business.
- The default products and Unsplash photos are demo content. Replace with real products/photos and confirm you have rights to use each image.
- `firestore.rules` allows public reads of the product catalogue and guest order creation; order reads are admin-only. Never use permissive test-mode rules for a live shop.


## Component structure

The product listing is split into reusable React components:

- `src/components/ProductCard.jsx` — one furniture card and quick-view action.
- `src/components/ProductGrid.jsx` — renders the product collection and empty state.
- `src/App.jsx` — page layout, cart/checkout state, Firebase data, and admin dashboard.

The product photos use `object-fit: contain` in the shop cards and product detail modal so the complete furniture item is visible rather than cropped. Admins can add new furniture categories from **Admin → Categories**; categories are stored in the Firestore `categories` collection. Deploy the updated `firestore.rules` when using Firebase.
