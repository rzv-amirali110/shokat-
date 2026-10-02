import { defineConfig } from 'vite';
import { resolve } from 'path';
import viteObfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig({
    root: 'public',
    base: './', // این خط باعث می‌شود مسیر فایل‌های js و css به صورت نسبی و درست در کنار HTML ساخته شوند
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'public/index.html'),
                admin: resolve(__dirname, 'public/admin/index.html'),
                privacy: resolve(__dirname, 'public/privacy-policy/index.html'),
                terms: resolve(__dirname, 'public/terms/index.html')
            }
        }
    },
    plugins: [
        viteObfuscator({
            include: ['**/*.js'], // اضافه کردن این خط ضروری است
            exclude: [/node_modules/, /\.html$/], // مستثنی کردن فایل‌های HTML
            options: {
                compact: true,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                disableConsoleOutput: true
            }
        })
    ]
});