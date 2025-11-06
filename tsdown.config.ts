import { defineConfig } from 'tsdown'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  entry: ['./src/index.ts'],
  outDir: './dist',
  format: ['esm'],
  dts: true,
  external: [
    ...Object.keys(pkg.dependencies),
    ...Object.keys(pkg.devDependencies),
  ],
})
