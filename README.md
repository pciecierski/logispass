# Carry — Wallet Pass Studio

Create and serve **Apple Wallet** (`.pkpass`) and **Google Wallet** passes from one app.

## Features

- Web studio to design generic, coupon, event ticket, store/loyalty, and boarding passes
- Signed Apple Wallet packages when Pass Type ID + certificates are configured
- Google Wallet “Save to Wallet” links when Issuer ID + service account are configured
- Public pass pages with Add to Apple / Add to Google buttons
- Preview mode when credentials are missing (pass JSON still generated)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Apple Wallet setup

1. In Apple Developer, create a **Pass Type ID**.
2. Create a Pass Type certificate, export as `.p12`, then convert to PEM:

```bash
openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out certs/signerCert.pem
openssl pkcs12 -in Certificates.p12 -nocerts -nodes -out certs/signerKey.pem
# Download Apple WWDR G4 intermediate and save as certs/wwdr.pem
```

3. Set environment variables:

```bash
APPLE_PASS_TYPE_ID=pass.com.your.company
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_ORG_NAME=Your Organization
```

## Google Wallet setup

1. Enable the Google Wallet API in Google Cloud.
2. Create a service account and download the JSON key.
3. In Google Pay & Wallet Console, create an issuer and grant the service account access.
4. Set:

```bash
GOOGLE_ISSUER_ID=3388xxxxxxxx
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/status` | Credential status |
| `GET` | `/api/passes` | List passes |
| `POST` | `/api/passes` | Create a pass |
| `GET` | `/api/passes/:id` | Pass metadata + URLs |
| `GET` | `/api/passes/:id/apple.pkpass` | Download Apple pass |
| `GET` | `/api/passes/:id/google?redirect=1` | Redirect to Google save URL |
| `GET` | `/p/:id` | Public pass landing page |

## Deploy (Railway)

```bash
railway up -y
railway domain
railway variable set PUBLIC_BASE_URL=https://your-domain.up.railway.app
```

Mount Apple PEMs under `/app/certs` or set the `APPLE_*_PATH` variables. Put the Google service account JSON in `GOOGLE_SERVICE_ACCOUNT_KEY`.

## Scripts

- `npm run dev` — local development
- `npm run build` — compile TypeScript
- `npm start` — run compiled server
