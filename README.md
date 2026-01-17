# Real-Time Collaborative Drawing Canvas

A performant, real-time shared drawing application built with **Node.js**, **Socket.io**, and **Vanilla HTML5 Canvas**.

## 🚀 Features

- **Real-time Synchronization**: Instant updates across all connected clients.
- **Global Undo**: One shared history stack - multiple users can undo each other's actions (collaborative flow).
- **Global Redo**: Reapplies the last undone action (server-enforced history model).
- **User Presence**: See real-time cursors of other users with randomized names/colors.
- **Optimistic UI**: Immediate local drawing for zero-latency feel.
- **Responsive**: Canvas adapts to window size (note: drawing coordinates are normalized).
- **Mobile Support**: Works on touch devices (iPad/Phones) with full drawing capability.
- **Tools**: Brush (customizable color/size), Eraser, Clear All.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Architecture**: Centralized State Management (Server Authority)

## 📦 Setup & Running

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Open Application**
   Visit `http://localhost:3000` in your browser.

## 🧪 How to Test (Multi-User)

1. Open `http://localhost:3000` in **Window A**.
2. Open `http://localhost:3000` in **Incognito Window B** (simulating a second user).
3. Draw something in Window A. You will see it appear instantly in Window B.
4. Move your mouse in Window A. You will see a "User XXXX" cursor in Window B.
5. Click **Undo** in Window B. It will remove the stroke drawn by Window A (Global Undo).

## 🔧 Architecture Highlights

- **Data Flow**: `mousedown/move` -> Draw Local -> Emit `draw` -> Server Broadcast -> Receivers Draw.
- **Conflict Resolution**: "Last Write Wins" based on server arrival order. The server maintains a linear `history` array.
- **Undo Strategy**: Global Undo. When `undo` is triggered, the server pops the last action and broadcasts a `sync_state` event, causing all clients to redraw the full history. This ensures perfect consistency.
- **Performance**:
  - **Coordinates** are normalized (0-1) to handle different screen sizes.
  - **Canvas Context** set to `{ alpha: false }` for potential rendering speedup.
  - **Optimistic UI** prevents "laggy" feel for the drawer.

## ⏱️ Time Spent
Approx. 2–3 hours focused implementation.

## 🐛 Known Limitations & Trade-offs

> **Note**: These are intentional engineering decisions for the scope of this assignment.

1.  **Global Undo/Redo**: Undo affects everyone on the canvas (Shared State). Redo is supported and history branching is enforced server-side.
2.  **In-Memory State**: Canvas history is stored in server memory. Restarting the server wipes the drawing.
    -   *Improvement*: Use Redis/Postgres for persistence.
3.  **Authentication**: No auth is implemented. Users are identified by ephemeral Socket IDs.
4.  **Event Throttling**: Basic mouse event throttling is not implemented, relying on network capability.
    -   *Improvement*: Implement client-side batching (e.g., send every 50ms) to reduce network overhead.
    -   *Note*: In practice, this performs well for small groups.
