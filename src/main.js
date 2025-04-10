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

const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(store)
app.use(router)
app.use(ElementPlus)
app.config.globalProperties.$axios = axios  // 推荐改为按需引入

app.mount('#app')
//