class DrawingState {
    constructor() {
        this.history = []; // Array of drawing actions
        this.undoStack = []; // For future redo functionality (if we implement redo)
        // We could store snapshots here if history gets too long
    }

    addAction(action) {
        this.history.push(action);
        // Clear redo stack on new action
        this.undoStack = [];
        return action;
    }

    getHistory() {
        return this.history;
    }

    undo() {
        if (this.history.length === 0) return null;
        const lastAction = this.history.pop();
        this.undoStack.push(lastAction);
        return lastAction;
    }

    redo() {
        if (this.undoStack.length === 0) return null;
        const actionToRedo = this.undoStack.pop();
        this.history.push(actionToRedo);
        return actionToRedo;
    }

    clear() {
        this.history = [];
        this.undoStack = [];
        return true;
    }
}

module.exports = { DrawingState };
