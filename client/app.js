const socket = io();

// UI Elements
const canvasEl = document.getElementById('drawing-canvas');
const toolBrush = document.getElementById('tool-brush');
const toolEraser = document.getElementById('tool-eraser');
const colorPicker = document.getElementById('color-picker');
const sizePicker = document.getElementById('size-picker');
const btnUndo = document.getElementById('action-undo');
const btnClear = document.getElementById('action-clear');
const statusText = document.getElementById('connection-status');
const cursorsContainer = document.getElementById('cursors-container');

// Initialize Canvas
const drawingCanvas = new DrawingCanvas(canvasEl);

// --- User Interaction ---

// Mouse Events
canvasEl.addEventListener('mousedown', (e) => {
    drawingCanvas.startDrawing(e.clientX, e.clientY);
});
window.addEventListener('mousemove', (e) => {
    drawingCanvas.draw(e.clientX, e.clientY);

    // Broadcast cursor position
    socket.emit('cursor', {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
    });
});
window.addEventListener('mouseup', () => drawingCanvas.stopDrawing());

// Touch Events (Mobile Support)
canvasEl.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    drawingCanvas.startDrawing(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    drawingCanvas.draw(touch.clientX, touch.clientY);

    socket.emit('cursor', {
        x: touch.clientX / window.innerWidth,
        y: touch.clientY / window.innerHeight
    });
}, { passive: false });

window.addEventListener('touchend', () => drawingCanvas.stopDrawing());

// Tool Logic
toolBrush.addEventListener('click', () => {
    drawingCanvas.tool = 'brush';
    toolBrush.classList.add('active');
    toolEraser.classList.remove('active');
});

toolEraser.addEventListener('click', () => {
    drawingCanvas.tool = 'eraser';
    toolEraser.classList.add('active');
    toolBrush.classList.remove('active');
});

colorPicker.addEventListener('input', (e) => {
    drawingCanvas.color = e.target.value;
    drawingCanvas.tool = 'brush'; // Auto-switch back to brush
    toolBrush.classList.add('active');
    toolEraser.classList.remove('active');
});

sizePicker.addEventListener('input', (e) => {
    drawingCanvas.size = parseInt(e.target.value, 10);
});

btnUndo.addEventListener('click', () => {
    socket.emit('undo');
});

btnClear.addEventListener('click', () => {
    socket.emit('clear');
});

// Canvas Callback (Send separate strokes)
drawingCanvas.onDraw = (data) => {
    socket.emit('draw', data);
};

// --- Socket Events ---

socket.on('connect', () => {
    statusDot.classList.add('connected');
    statusText.textContent = '🟢 Connected';
    statusDot.style.background = '#4caf50'; // Green
});

socket.on('connect_error', (err) => {
    console.error('Connection failed:', err);
    statusDot.classList.remove('connected');
    statusText.textContent = '🔴 Connection Error';
    statusDot.style.background = '#f44336'; // Red
});

socket.on('disconnect', (reason) => {
    statusDot.classList.remove('connected');
    statusText.textContent = '⚪ Disconnected';
    statusDot.style.background = '#ccc'; // Grey
    console.log('Disconnected:', reason);

    if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
    }
    // else the socket will automatically try to reconnect
});

socket.on('user_count', (count) => {
    const userCountEl = document.getElementById('user-count');
    // "You + X others" (if count > 1)
    const others = count - 1;
    if (others > 0) {
        const noun = others === 1 ? 'other' : 'others';
        userCountEl.textContent = `● You + ${others} ${noun}`;
    } else {
        userCountEl.textContent = `● You (Solo)`;
    }
});

socket.on('init_state', (history) => {
    drawingCanvas.clearCanvas();
    history.forEach(action => {
        drawingCanvas.drawRemote(action);
    });
});

socket.on('draw', (data) => {
    drawingCanvas.drawRemote(data);
});

socket.on('cursor', (data) => {
    updateCursor(data);
});

socket.on('cursor_disconnect', (userId) => {
    const el = document.getElementById(`cursor-${userId}`);
    if (el) el.remove();
});

socket.on('sync_state', (history) => {
    // Full redraw on undo
    drawingCanvas.clearCanvas();
    history.forEach(action => {
        drawingCanvas.drawRemote(action);
    });
});

socket.on('clear', () => {
    drawingCanvas.clearCanvas();
});

// --- Helper Functions ---

function updateCursor(data) {
    const { userId, x, y } = data;
    let cursor = document.getElementById(`cursor-${userId}`);

    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = `cursor-${userId}`;
        cursor.className = 'cursor';
        // Generate random color for cursor label
        const rColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        cursor.innerHTML = `
            <svg class="cursor-icon" viewBox="0 0 24 24" fill="${rColor}" stroke="white" stroke-width="2">
                <path d="M5.5 3.2L18 19l-4.5-1.5L9 22l-1.5-1.5L12 16 3 13l2.5-9.8z"/>
            </svg>
            <span class="cursor-label" style="background-color: ${rColor}">User ${userId.substr(0, 4)}</span>
        `;
        cursorsContainer.appendChild(cursor);
    }

    cursor.style.transform = `translate(${x * window.innerWidth}px, ${y * window.innerHeight}px)`;
}
