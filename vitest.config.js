// Config separata da vite.config.js: i test girano in Node, senza i plugin
// della build (PWA, ecc.).
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.js'],
        testTimeout: 60000
    }
});
