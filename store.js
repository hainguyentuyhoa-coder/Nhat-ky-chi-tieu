'use strict';

class Store {
    constructor() {
        this.items = {};
    }

    addItem(key, value) {
        this.items[key] = value;
    }

    getItem(key) {
        return this.items[key];
    }

    removeItem(key) {
        delete this.items[key];
    }

    clear() {
        this.items = {};
    }
}

module.exports = Store;