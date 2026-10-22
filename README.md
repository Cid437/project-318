# MotoShop (prototype)

A motorcycle parts and services shop (MERN: MongoDB, Express 5, React 19 + Vite, Redux, Node).
**This is a prototype for coursework, not production software.**

## Setup

Requires Node 22.12+ (or 20.19+), a MongoDB database (Atlas), a Cloudinary account and a Mailtrap inbox.

```bash
# backend
cd backEnd
npm install
npm install pdfkit bad-words@3.0.4        # receipt PDF + review word filter
cp config/.env.example config/.env        # then fill in the values
npm start                                 # http://localhost:4001

# frontend (new terminal)
cd frontEnd
npm install
npm install formik yup @react-oauth/google   # form validation + Google login
npm run dev                                  # http://localhost:5173
```

Run the backend from inside `backEnd/` (it reads `./config/.env`). In `frontEnd/` copy `.env.example` to `.env` (it already points to `http://localhost:4001/api/v1`).

To make an admin: register a user, then change `role` to `admin` in the `users` collection.

### Google login (optional)
1. Google Cloud Console, then APIs and Services, Credentials, create an **OAuth client ID** (Web application) with `http://localhost:5173` as an authorized JavaScript origin.
2. Put the same ID in `backEnd/config/.env` (`GOOGLE_CLIENT_ID`) and `frontEnd/.env` (`VITE_GOOGLE_CLIENT_ID`), then restart both servers. Without an ID the Google button is hidden.

## Features

| Area | What it does |
|---|---|
| Products | Admin datatable (MUI DataGrid), create/edit with multiple photos (Cloudinary), checkbox bulk delete |
| Filters | Price slider, category, ratings, minimum reviews, keyword search |
| Home page | Infinite scroll (loads the next page near the bottom) |
| Reviews | Only users with a **Delivered** order of the product can review; edit own review; admin deletes reviews; bad words are masked (`bad-words`) |
| Orders | Cart, shipping, confirm, (simulated) payment, order list; admin changes status; stock reduces once |
| Email | Status change emails the customer the items, subtotals and grand total, with a PDF receipt attached |
| Forms | Formik + Yup validation on product create/update, login, update profile |
| Charts | Sales by date (bar chart with start/end date), sales per customer, sales per product |
| Login | Email/password, optional Google login; session survives a page refresh |

## Demo flow
1. Register/login as a customer, add a product to the cart, check out.
2. Login as admin, then Orders, open the order, set **Shipped**, then **Delivered**. Check the Mailtrap inbox for the email and PDF.
3. As the customer, open the product and use **Submit Your Review**.
4. Admin dashboard: pick a start/end date on the sales chart.

## Known limitations
- Payment is simulated (no real payment gateway); the order is saved with a fixed fake payment id.
- Reviews require a Delivered order, so an admin must mark the order Delivered first.
- Sales-by-date uses Philippine time (UTC+8) for day boundaries.
- Google tokens are verified with Google's `tokeninfo` endpoint, which is fine for a prototype; production should verify the token locally.
- Cloudinary, MongoDB, Mailtrap and Google were not reachable during development of the finishing changes, so those integrations were tested with mocks only.
