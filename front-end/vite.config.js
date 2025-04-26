import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import inject from '@rollup/plugin-inject';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5173,
    },
    plugins: [
        tailwindcss(),
        react(),
        inject({
            Buffer: ['buffer', 'Buffer'],
            process: 'process',
        }),
    ],
    resolve: {
        alias: {
            stream: 'stream-browserify',
            buffer: 'buffer/',
            process: 'process/browser',
        },
    },
    worker: {
        format: 'es'
    },
});