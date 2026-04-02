var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
var base = process.env.DEPLOY_TARGET === "github-pages" ? "/hobby-collection/" : "/";
var isAnalyze = process.env.ANALYZE === "true";
// https://vitejs.dev/config/
export default defineConfig({
    base: base,
    resolve: {
        alias: [
            { find: '@', replacement: path.resolve(__dirname, './src') }
        ],
    },
    plugins: __spreadArray([
        react()
    ], (isAnalyze ? [visualizer()] : []), true),
});
