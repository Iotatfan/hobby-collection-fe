import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react'
import * as path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';


// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: [{ find: '@', replacement: path.resolve(__dirname, './src') }],
    },
    plugins: [
        react(),
        visualizer() as PluginOption,
    ],
});