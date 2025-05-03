<template>
  <el-header class="navbar">
    <div class="navbar-container">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <img src="@/assets/logo.png" alt="TastySphere" />
        <span class="logo-text">TastySphere</span>
      </router-link>

      <!-- 主导航 -->
      <div class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/posts" class="nav-link">美食圈</router-link>
        <router-link to="/restaurants" class="nav-link">餐厅</router-link>
        <router-link to="/activities" class="nav-link">活动</router-link>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
            v-model="searchKeyword"
            placeholder="搜索美食、餐厅、用户..."
            clearable
            @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon class="el-input__icon">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>

      <!-- 右侧功能区 -->
      <div class="nav-right">
        <!-- 发布按钮 -->
        <el-button type="primary" @click="handlePublish" v-if="isLoggedIn">
          发布
        </el-button>

        <!-- 私信提醒 -->
        <el-badge
            :value="unreadCount"
            :hidden="unreadCount === 0"
            class="msg-badge"
            v-if="isLoggedIn"
        >
          <el-button type="text" @click="goToMessages">
            <el-icon><ChatDotRound /></el-icon>
          </el-button>
        </el-badge>

        <!-- 通知组件 -->
        <notification-popover v-if="isLoggedIn" />

        <!-- 用户菜单 -->
        <template v-if="isLoggedIn">
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-menu">
              <el-avatar :size="32" :src="currentUser.avatar" />
              <span class="username">{{ currentUser.username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人主页
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item command="admin" v-if="isAdmin" divided>
                  <el-icon><Operation /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <!-- 登录注册按钮 -->
        <template v-else>
          <el-button @click="$router.push('/login')">登录</el-button>
          <el-button type="primary" @click="$router.push('/register')">注册</el-button>
        </template>
      </div>
    </div>

    <!-- 发布对话框 -->
    <el-dialog v-model="publishDialog.visible" title="发布内容" width="400px">
      <div class="publish-options">
        <div class="publish-option" @click="handlePublishOption('post')">
          <el-icon><Document /></el-icon>
          <span>发布美食帖子</span>
        </div>
        <div class="publish-option" @click="handlePublishOption('restaurant')">
          <el-icon><Location /></el-icon>
          <span>推荐餐厅</span>
        </div>
        <div class="publish-option" @click="handlePublishOption('activity')">
          <el-icon><Calendar /></el-icon>
          <span>发布活动</span>
        </div>
      </div>
    </el-dialog>
  </el-header>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue'
import {useStore} from 'vuex'
import {useRouter} from 'vue-router'
import {ElMessageBox} from 'element-plus'
import NotificationPopover from './NotificationPopover.vue'
import api from '@/services/api'

import {
  Calendar,
  ChatDotRound,
  Document,
  Location,
  Operation,
  Search,
  Setting,
  SwitchButton,
  User
} from '@element-plus/icons-vue'

// 路由映射（不包含 profile，profile 特别处理）
const PUBLISH_ROUTES = {
  post: '/posts/create',
  restaurant: '/restaurants/create',
  activity: '/activities/create'
}

const COMMAND_ROUTES = {
  settings: '/settings',
  admin: '/admin'
}

const store = useStore()
const router = useRouter()
const searchKeyword = ref('')
const publishDialog = ref({ visible: false })

const isLoggedIn = computed(() => !!store.state.user)
const currentUser = computed(() => store.state.user || {})
const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

const unreadCount = ref(0)

const fetchUnreadCount = async () => {
  try {
    unreadCount.value = await api.get('/messages/unread')
  } catch (e) {
    console.warn('未读消息获取失败', e)
  }
}

const goToMessages = () => {
  router.push('/chat-list')
}

onMounted(() => {
  if (isLoggedIn.value) {
    fetchUnreadCount()
  }
})

watch(isLoggedIn, (val) => {
  if (val) fetchUnreadCount()
})

const handleSearch = () => {
  const keyword = searchKeyword.value.trim()
  if (keyword) {
    router.push({ path: '/search', query: { keyword } })
  }
}

const handlePublish = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
  } else {
    publishDialog.value.visible = true
  }
}

const handlePublishOption = (type) => {
  publishDialog.value.visible = false
  const route = PUBLISH_ROUTES[type]
  if (route) {
    router.push(route)
  }
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await store.dispatch('logout')
      await router.push('/login')
    } catch {
      // 用户取消操作
    }
  } else if (command === 'profile') {
    const id = store.state.user?.id
    if (id) {
      await router.push(`/profile/${id}`)
    }
  } else if (COMMAND_ROUTES[command]) {
    await router.push(COMMAND_ROUTES[command])
  }
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  margin-right: 40px;
}

.logo img {
  height: 32px;
  margin-right: 8px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.nav-links {
  display: flex;
  gap: 24px;
  margin-right: 40px;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  transition: color 0.2s;
}

.search-box {
  flex: 1;
  max-width: 400px;
  margin: 0 20px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #333;
}

.publish-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
}

.publish-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.publish-option:hover {
  background-color: #f5f7fa;
}

.publish-option .el-icon {
  font-size: 24px;
  color: #409EFF;
}

.publish-option span {
  font-size: 14px;
  color: #333;
}
</style>
