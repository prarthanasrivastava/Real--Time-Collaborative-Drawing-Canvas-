class DrawingCanvas {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimization
        this.isDrawing = false;
        this.currentPath = [];

        // Tool state
        this.color = '#000000';
        this.size = 5;
        this.tool = 'brush'; // 'brush' or 'eraser'

        // Callbacks
        this.onDraw = null; // Function to call when a stroke completes or updates

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Use a white background default
        this.clearCanvas();
    }

    resize() {
        // Save content to restore after resize? 
        // For simplicity in MVP, we might lose local generic buffer or rely on server history.
        // We will rely on server history re-render for perfect resize handling.
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.clearCanvas(); // Resize clears canvas
    }

    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // --- Drawing primitives ---

    // Draw a single line segment
    drawLine(x0, y0, x1, y1, color, size, isEraser = false) {
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.strokeStyle = isEraser ? '#ffffff' : color;
        this.ctx.lineWidth = size;
        this.ctx.stroke();
    }

    // --- Interaction ---

    startDrawing(x, y) {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
        // Emit start point (optional, but good for single dots)
        this.draw(x, y, true);
    }

    draw(x, y, force = false) {
        if (!this.isDrawing && !force) return;

        // Optimization: Don't draw if distance is too small
        // const dist = Math.hypot(x - this.lastX, y - this.lastY);
        // if (dist < 2) return;

        this.drawLine(this.lastX, this.lastY, x, y, this.color, this.size, this.tool === 'eraser');

        // Callback to app (send to server)
        // DECISION: We normalize coordinates (0 to 1) so drawings scale correctly
        // across devices with different screen sizes (e.g. Mobile vs Desktop).
        if (this.onDraw) {
            this.onDraw({
                x0: this.lastX / this.canvas.width,
                y0: this.lastY / this.canvas.height,
                x1: x / this.canvas.width,
                y1: y / this.canvas.height,
                color: this.color,
                size: this.size,
                tool: this.tool
            });
        }

        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    // --- Rendering Remote Events ---

    drawRemote(data) {
        // data has normalized coords 0-1
        const x0 = data.x0 * this.canvas.width;
        const y0 = data.y0 * this.canvas.height;
        const x1 = data.x1 * this.canvas.width;
        const y1 = data.y1 * this.canvas.height;

        this.drawLine(x0, y0, x1, y1, data.color, data.size, data.tool === 'eraser');
    }
}
