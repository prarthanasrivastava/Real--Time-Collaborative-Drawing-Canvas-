class DrawingState {
    constructor() {
        this.history = []; // Array of drawing actions
    }

    addAction(action) {
        this.history.push(action);
        return action;
    }

    getHistory() {
        return this.history;
    }

    undo() {
        if (this.history.length === 0) return null;
        const lastAction = this.history.pop();
        return lastAction;
    }

    clear() {
        this.history = [];
        return true;
    }
}

module.exports = { DrawingState };
