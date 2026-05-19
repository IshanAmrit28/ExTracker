# Finance Tracker Pro 📊

A production-ready, full-stack MERN (MongoDB, Express, React, Node.js) application designed to help you take complete control of your personal finances. Track your income, categorize your expenses, monitor your budget adherence, and analyze your financial health over time.

## ✨ Features

- **🔒 Military-Grade Security:** All sensitive financial data (like salaries and transaction amounts) is encrypted at rest in the database using AES-256-GCM encryption.
- **🛡️ Secure Authentication:** Full JWT-based user authentication system ensuring complete data privacy and user isolation.
- **📱 Responsive Dashboard:** A beautiful, dark-mode UI that provides an overarching view of your account balance, monthly spending, and budget variance.
- **💸 Income & Expense Tracking:** Dedicated, intuitive interfaces for logging daily expenses and incoming cash flow.
- **🤖 Smart Categorization:** Automatically maps your spending into Needs, Wants, and Savings to calculate your personalized "Financial Score."
- **📈 Advanced Analytics:** Dive deep into your habits with Weekly Analysis, Monthly Breakdown charts, and a Yearly Calendar heatmap.
- **🌐 Production Ready:** Configured for seamless deployment with Vercel (Frontend) and Render (Backend).

## 🚀 Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Vanilla CSS (Dark mode optimized)
- **Icons:** `lucide-react`
- **Analytics:** `@vercel/analytics`
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose)
- **Authentication:** `jsonwebtoken` & `bcryptjs`
- **Security:** Built-in Node `crypto` module for database-level encryption

## 🛠️ Local Development Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [Git](https://git-scm.com/) installed on your machine.

### 1. Clone & Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables
You need to set up your `.env` files for both the frontend and backend.

**Backend (`backend/.env`):**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
ENCRYPTION_KEY=a_secure_32_character_string_for_aes_256
FRONTEND_URI=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Run the Application

Open two separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
The application will be running at `http://localhost:5173`.

## 🌍 Deployment

### Frontend (Vercel)
1. Push your code to GitHub.
2. Import the `frontend` directory into a new Vercel project.
3. Add the `VITE_BACKEND_URL` environment variable pointing to your live backend URL.
4. Deploy.

### Backend (Render)
1. Create a new "Web Service" on Render.
2. Connect your repository and select the `backend` folder as the root directory.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add all environment variables (`MONGO_URI`, `JWT_SECRET`, `ENCRYPTION_KEY`, `FRONTEND_URI`).
6. Deploy.

## ✉️ Automated Email Reports (GitHub Actions & IST Timezone)

The application includes an automated financial reporting system that compiles transaction details, income, and category breakdowns into a highly secure, passwordless weekly or monthly PDF report emailed directly to authenticated users.

This is automated via **GitHub Actions** and is fully timezone-safe, guaranteeing execution matching **Indian Standard Time (IST)** boundaries:

- **Weekly Reports:** Auto-sent every Monday at `00:00 IST` (covering the previous week from Monday to Sunday).
- **Monthly Reports:** Auto-sent on the `1st` day of every month at `00:00 IST` (covering the entire previous calendar month).

### ⚙️ Timezone Safety & IST Conversion
The runner environment runs in UTC by default. The custom runner script (`backend/scripts/sendReports.js`) performs a strict timezone check on the reference time (either current runner time or a custom time provided):
1. **Detects** if the given time already specifies an IST timezone offset (`+05:30` / `-330` minutes).
2. **Converts** the time automatically to IST if the offset is different (e.g. UTC/GMT).
3. **Decides** which report to run based on the converted IST day/date, ensuring calendar boundaries are aligned exactly with Indian Standard Time.

### 🔑 Setting up GitHub Action Secrets
To enable automated reports in your GitHub repository, navigate to **Settings > Secrets and variables > Actions** and add the following repository secrets:

| Secret Name | Description |
|---|---|
| `MONGO_URI` | Your MongoDB connection string (e.g. Atlas connection URI). |
| `ENCRYPTION_KEY` | The **32-character AES key** used to encrypt/decrypt transaction amounts and settings. |
| `RESEND_API_KEY` | Your Resend API token used to dispatch the emails. |

### 🚀 Manual Trigger / Testing
You can manually run and test the report dispatch from the GitHub **Actions** tab:
1. Select the **Scheduled Report Emails** workflow.
2. Click **Run workflow**.
3. Choose the **Report Type** (`auto`, `weekly`, `monthly`, or `both`).
4. Optionally specify a **Custom time** in ISO or human-readable format to test timezone conversion.

## 📄 License
This project is open-source and available under the MIT License.

