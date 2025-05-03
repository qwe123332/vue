<template>
  <el-header class="app-header">
    <!-- 其他导航元素 -->
    <div class="nav-actions">
      <!-- 消息提醒图标按钮 -->
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
        <el-button type="text" @click="goToMessages">
          <el-icon><ChatDotRound /></el-icon>
        </el-button>
      </el-badge>
    </div>
  </el-header>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {ChatDotRound} from '@element-plus/icons-vue'
import api from '@/services/api'

const unreadCount = ref(0)
const router = useRouter()

const fetchUnreadCount = async () => {
  try {
    unreadCount.value = await api.get('/messages/unread-count')
  } catch (e) {
    console.warn('获取未读消息失败')
  }
}

const goToMessages = () => {
  router.push('/chat/1') // 👈 示例跳转：可替换为最近联系人或聊天列表页
}

onMounted(() => {
  fetchUnreadCount()
})
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.message-badge {
  margin-left: 20px;
}
</style>
