import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080
  },
  build: {
    outDir: '../team_project_eduMS1/src/main/resources/static', // 将构建后的文件输出到Spring Boot静态资源目录
    emptyOutDir: true,
  }
})
