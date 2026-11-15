import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
export default defineConfig({plugins:[react()],build:{rollupOptions:{input:{home:resolve('index.html'),explore:resolve('explore/index.html'),compare:resolve('compare/index.html'),simulator:resolve('simulator/index.html'),chat:resolve('chat/index.html')}}},server:{port:3000,open:false}});
