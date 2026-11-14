import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function copyRootFilesPlugin() {
  return {
    name: 'copy-root-files',
    closeBundle() {
      ['data.js', 'app.js'].forEach((file) => {
        const srcPath = path.resolve(file);
        const destPath = path.resolve('dist', file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyRootFilesPlugin()],
  server: {
    port: 3000,
    open: false,
  },
});
