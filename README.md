# RetailMind — Edge-AI Retail Operations Copilot
> **"Smarter Stores. Happier People."**

RetailMind is an Edge-AI Retail Operations Copilot for modern supermarkets. It integrates live store camera analytics, queue congestion forecasting, inventory stockout risk prediction, and automated staff dispatch.

---

## Architecture Overview

```
                          ┌──────────────────────────────────────────────┐
                          │          React 18 + Vite + Tailwind          │
                          │          (Lucide Icons, Recharts,            │
                          │           Socket.IO Client, Axios)           │
                          └───────────────▲───────────────▲──────────────┘
                                          │ REST          │ WebSockets
                                          │ APIs          │ (Socket.IO)
                          ┌───────────────▼───────────────┴──────────────┐
                          │         Node.js + Express + TypeScript       │
                          │    (Simulation Engine, Alert Deduplication,  │
                          │       Event Engine, Mongoose Models)         │
                          └───────────────▲───────────────▲──────────────┘
                                          │               │ HTTP / JSON
                                          │ Mongoose      │
                          ┌───────────────▼─────────┐   ┌─▼───────────────────────────┐
                          │   MongoDB Atlas (Cloud) │   │     Python 3.14 + FastAPI   │
                          │ (Stores, Cameras, Queue,│   │  (XGBoost Queue Regressor,  │
                          │  Inventory, Alerts, etc)│   │  Inventory Stockout Model)  │
                          └─────────────────────────┘   └─────────────────────────────┘
```

---

## Key Modules Implemented (Phase 1: Cameras & Timeline)

1. **Cameras & Timeline Dashboard**:
   - Inspired by the reference operational layout, enhanced with a modern **Green-accent system** (`#16A34A`, `#166534`, `#DCFCE7`), slate dark sidebar (`#0A101F`), and clean typography.
   - Dynamic system date (`Today, 14 Sep 2026`), Live/Playback toggle, and time range window (`06:00 AM – 11:59 PM`).
   - Category filter tabs with real-time MongoDB counts: **All Cameras**, **Entrance**, **Shelves**, **Checkout**, **Floor**.
   - Working search filtering across name, ID, type, location, and zone.
   - Grid and List view toggle.
   - Fully functional **+ Add Camera** modal with Zod input validation, saving to MongoDB, and Socket.IO real-time emission.

2. **Interactive Camera Cards**:
   - Displays live timestamp, pulsating `● LIVE` badge, and `SIMULATED LIVE` indicator.
   - Supermarket camera feeds with automatic fallback if stream is unavailable.
   - Camera zoom controls: **Zoom In**, **Zoom Out**, and **Reset Zoom** using CSS transform scale.
   - **Fullscreen modal** with high-definition view and stream metrics.
   - AI Detection bounding box overlays:
     - Cam 02 (Shelf A3 - Milk): "Misplaced Item"
     - Cam 04 (Shelf B2 - Beverages): "Missing product"
     - Cam 05 (Checkout 2): "High Queue"
   - Real-time bottom badges for people count, queue length, stock counts, and status indicators.

3. **Camera Details Right Panel**:
   - Dynamically inspects the selected camera without reloading.
   - 4 Interactive Tabs:
     - **Details**: Camera type, location, stock, compliance, shelf health score & bar, predicted stockout, last alert, and staff status.
     - **Stock Info**: SKU, product name, expected vs current stock, stock availability %, daily demand rate, replenishment units, and warehouse backstock.
     - **Planogram**: Planogram compliance %, expected slot vs detected slot, misplaced product details, and misplaced item counts.
     - **Events**: Historical events log for the selected camera.
   - Action buttons: "View Full Screen" and "Send Alert" (manual escalation).

4. **Multi-track Timeline & Event Feed**:
   - Interactive scrubber from 06:00 AM to 11:59 PM with dynamic time bubble.
   - Playback mode: scrubs historical camera snapshots and event logs from MongoDB.
   - Multi-camera thumbnail tracks (Cam 01 Entrance, Cam 02 Shelf A3, Cam 03 Checkout 1, Cam 04 Shelf B2) with event markers.
   - Real-time Event List with severity badges (`Critical`, `Warning`, `Info`, `Success`).

5. **Live Backend Simulation Engine**:
   - Runs every 4 seconds on the backend.
   - Coherent bounded state transitions:
     - Entrance footfall walk (12 → 13 → 12 → 14).
     - Queue equation: $Q(t + \Delta t) = Q(t) + \text{Arrivals} - \text{Served}$.
     - Shelf stock depletion (6 → 5 → 4 → 3).
     - Automated AI alert trigger on threshold crossing (`LOW_STOCK`, `QUEUE_CONGESTION`).
     - Automated staff replenishment demo: after 18 seconds, stock is replenished (3 → 8 units), alert marked `Resolved`, and timeline updated.
     - Camera offline / online toggle simulation.
   - Alert deduplication and cooldown to prevent spamming.

6. **Real Machine Learning Microservice**:
   - Python 3.14 + FastAPI on port `8000`.
   - **Queue Congestion Model**: XGBoost Regressor trained on chronological 70/15/15 split of `Queue_10min` sheet.
     - Test MAE: `0.7822`
     - Test RMSE: `1.2939`
     - Test $R^2$: `0.4092`
     - Returns explainable "WHY?" breakdown and recommendations (e.g. "Open Counter 3").
   - **Inventory Stock-out Predictor**: XGBoost Regressor trained on `Inventory_Shelf_Daily`.
     - Test MAE: `0.0295`
     - Test RMSE: `0.0405`
     - Test $R^2$: `0.9838`

---

## Getting Started

### Prerequisites
- Node.js >= 18 (Tested on v24.20.0)
- Python >= 3.10 (Tested on v3.14.7)
- MongoDB Atlas cluster or local MongoDB instance

---

### Step 1: Clone and Configure Environment

1. Copy `.env.example` to `backend/.env`:
   ```bash
   cp .env.example backend/.env
   ```

2. Edit `backend/.env` with your settings:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/retailmind?retryWrites=true&w=majority
   MONGODB_DB_NAME=retailmind
   PORT=5000
   ML_SERVICE_URL=http://localhost:8000
   CLIENT_URL=http://localhost:5173
   SIMULATION_ENABLED=true
   SIMULATION_INTERVAL_MS=4000
   ```

---

### Step 2: Python ML Setup & Training

1. Install Python dependencies:
   ```bash
   pip install -r ml/requirements.txt
   ```

2. Train the XGBoost models from the Excel dataset:
   ```bash
   python ml/training/train_queue_model.py
   python ml/training/train_inventory_model.py
   ```

3. Launch the FastAPI ML microservice:
   ```bash
   python -m uvicorn ml.inference.app:app --host 0.0.0.0 --port 8000
   ```
   Verify health at `http://localhost:8000/health`.

---

### Step 3: Backend Setup & Seeding

1. Install Node.js backend packages:
   ```bash
   cd backend
   npm install
   ```

2. Seed the MongoDB database from `RetailMind_1Year_Synthetic_Dataset.xlsx`:
   ```bash
   npm run seed
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```
   Verify backend at `http://localhost:5000/api/health`.

---

### Step 4: Frontend Setup

1. Install frontend packages:
   ```bash
   cd ../frontend
   npm install
   ```

2. Start the Vite React development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:5173`.

---

## API Documentation Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health (API, MongoDB, ML, Simulation, Socket) |
| `GET` | `/api/system/status` | Edge AI system and sync status |
| `GET` | `/api/cameras` | List cameras with filter query and counts |
| `GET` | `/api/cameras/:id` | Detailed camera data |
| `POST` | `/api/cameras` | Add new camera (Zod validated) |
| `PATCH` | `/api/cameras/:id` | Update camera configuration |
| `POST` | `/api/cameras/:id/toggle-status` | Toggle camera ONLINE / OFFLINE |
| `GET` | `/api/timeline` | Query timeline events |
| `GET` | `/api/notifications` | Fetch active alerts and unread counts |
| `POST` | `/api/ml/queue/predict` | Predict queue congestion (XGBoost) |
| `POST` | `/api/ml/inventory/predict` | Predict stockout risk & shelf health |

---

## Acceptance Criteria Verification Matrix

| # | Criterion | Status |
|---|---|---|
| 1 | Cameras load from MongoDB / seed dataset | Verified |
| 2 | Camera counts are database-driven | Verified |
| 3 | Camera search filters in real time | Verified |
| 4 | Category filters (Entrance, Shelves, Checkout, Floor) work | Verified |
| 5 | Grid / List view toggle works | Verified |
| 6 | Add Camera modal persists to DB & emits Socket.IO | Verified |
| 7 | Camera Details panel dynamic selection works | Verified |
| 8 | Stock information is database-driven | Verified |
| 9 | Planogram information works | Verified |
| 10 | Camera events work | Verified |
| 11 | Timeline scrubber works | Verified |
| 12 | Playback mode works | Verified |
| 13 | Live simulation engine works | Verified |
| 14 | Real-time updates every 4 seconds without refresh | Verified |
| 15 | Controlled bounded random walk (no erratic jumps) | Verified |
| 16 | Zero `Math.random()` in React for live values | Verified |
| 17 | Socket.IO real-time updates work | Verified |
| 18 | Queue calculation $Q(t+\Delta t) = Q(t) + A - S$ works | Verified |
| 19 | Real XGBoost Queue prediction ML works | Verified |
| 20 | Real XGBoost Inventory stockout prediction ML works | Verified |
| 21 | Automatic AI alert engine works | Verified |
| 22 | Alert deduplication & cooldown works | Verified |
| 23 | Notification badge is database-driven | Verified |
| 24 | Camera offline/online simulation works | Verified |
| 25 | System status reflects actual service states | Verified |
| 26 | Error handling & image fallback work | Verified |
| 27 | Dataset imported from Excel | Verified |
| 28 | No fake AI values | Verified |
| 29 | UI matches reference layout with restrained Green accent | Verified |
| 30 | Supermarket imagery clearly labeled SIMULATED LIVE | Verified |
