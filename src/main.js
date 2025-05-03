import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Element Plus 完整引入
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 图标自动导入（必须安装 @element-plus/icons-vue）
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// axios 全局配置（非必须）
import axios from 'axios'

import { initWebSocket, connectionStatus } from './services/websocket/websocket'

const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 登录状态恢复后初始化WebSocket
if (store.state.token) {
  console.log('检测到有效Token，初始化WebSocket连接');
  initWebSocket();
}

// 可选：监听网络状态变化
window.addEventListener('online', () => {
  console.log('网络恢复连接，尝试重新连接WebSocket');
  if (store.state.token && connectionStatus.value !== 'connected') {
    initWebSocket();
  }
});

window.addEventListener('offline', () => {
  console.log('网络断开连接');
  // 网络断开时WebSocket会自动关闭，这里可以添加一些UI通知
});

import Particles from 'particles.vue3'
app.use(Particles)

app.use(store)
app.use(router)
app.use(ElementPlus)
app.config.globalProperties.$axios = axios  // 推荐改为按需引入

app.mount('#app')
//