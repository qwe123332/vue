import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // SVG 图标插件（可选）
    createSvgIconsPlugin({
      // 指定要缓存的图标文件夹
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      // 指定symbolId格式
      symbolId: 'icon-[name]',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // 设置 @ 为 src 目录的别名
    },
  },
  server: {
    port: 5700, // 设置开发服务器端口
    open: true, // 启动时自动打开浏览器
  },
  build: {
    outDir: 'dist', // 构建输出目录
    sourcemap: true, // 生成 source map
  },
})