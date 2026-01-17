const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const { DrawingState } = require('./state');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev simplicity
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

// State
// In a real app, this might be a Map<roomId, DrawingState>
const globalState = new DrawingState();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Broadcast user count
    io.emit('user_count', io.engine.clientsCount);

    // 1. Send initial state to the new user
    socket.emit('init_state', globalState.getHistory());

    // 2. Handle Drawing Events
    socket.on('draw', (data) => {
        // Validation: Simple check to prevent server crashes or malformed state
        if (!data || typeof data.x0 !== 'number' || typeof data.y0 !== 'number') {
            console.warn(`[Server] Received malformed draw event from ${socket.id}`, data);
            return;
        }

        // data: { x0, y0, x1, y1, color, width, ... }
        const action = { ...data, id: Date.now(), userId: socket.id, type: 'draw' };

        globalState.addAction(action);

        // Broadcast to everyone else (including sender? usually sender draws locally)
        // efficient: broadcast to others
        socket.broadcast.emit('draw', action);
    });

    // 3. Handle Cursor Movement (Ephemeral, no history)
    socket.on('cursor', (pos) => {
        // pos: { x, y }
        socket.broadcast.emit('cursor', { ...pos, userId: socket.id });
    });

    // 4. Handle Undo
    socket.on('undo', () => {
        const undoneAction = globalState.undo();
        if (undoneAction) {
            // Simplest robust undo: Tell everyone to reload state
            io.emit('sync_state', globalState.getHistory());
        }
    });

    // 5. Handle Redo
    socket.on('redo', () => {
        const redoneAction = globalState.redo();
        if (redoneAction) {
            io.emit('sync_state', globalState.getHistory());
        }
        // If null (stack empty), we do nothing. Safe, defensive.
    });

    // 5. Handle Clear
    socket.on('clear', () => {
        globalState.clear();
        io.emit('clear');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Clear cursor
        io.emit('cursor_disconnect', socket.id);
        // Update user count
        io.emit('user_count', io.engine.clientsCount);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
