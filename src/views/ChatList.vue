<template>
  <div class="chat-list-page">
    <el-card class="chat-card">
      <template #header>
        <div class="chat-header">
          我的私信
        </div>
      </template>

      <div v-if="conversations.length > 0">
        <div
            v-for="item in conversations"
            :key="item.userId"
            class="chat-item"
        >
          <el-avatar :src="item.avatar" class="avatar" @click="goToChat(item.userId)" />

          <div class="chat-info" @click="goToChat(item.userId)">
            <div class="chat-title">
              <span class="username">{{ item.username }}</span>
              <span class="time">{{ formatTime(item.lastTime) }}</span>
            </div>
            <div class="chat-snippet">
              <span class="last-message">{{ item.lastMessage }}</span>
              <el-badge
                  v-if="item.unreadCount > 0"
                  :value="item.unreadCount"
                  class="unread"
              />
            </div>
          </div>

          <!-- 删除按钮（带确认） -->
          <div class="chat-actions">
            <el-popconfirm
                title="确认删除该会话？"
                confirm-button-text="确认"
                cancel-button-text="取消"
                @confirm="deleteConversation(item.userId)"
            >
              <template #reference>
                <el-button type="danger" icon="el-icon-delete" size="small" text />
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无私信会话" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import api from '@/services/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const conversations = ref([])

const fetchConversations = async () => {
  try {
    const { data } = await api.get('/messages/conversations')
    conversations.value = data
    console.log('会话列表', data)
  } catch (err) {
    console.error('获取会话失败', err)
  }
}

const deleteConversation = async (userId) => {
  try {
    await api.delete(`/messages/conversations/${userId}`)
    ElMessage.success('会话已删除')
    await fetchConversations()
  } catch (err) {
    ElMessage.error('删除失败，请稍后重试')
    console.error('删除会话失败', err)
  }
}


const formatTime = (t) => {
  return t ? dayjs(t).format('MM-DD HH:mm') : ''
}

const goToChat = (userId) => {
  router.push(`/chat/${userId}`)
}

onMounted(() => {
  fetchConversations()
})
</script>

<style scoped>
.chat-list-page {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.chat-card {
  min-height: 600px;
}

.chat-header {
  font-size: 18px;
  font-weight: bold;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 12px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.chat-item:hover {
  background-color: #f9f9f9;
}

.avatar {
  width: 48px;
  height: 48px;
  cursor: pointer;
}

.chat-info {
  flex: 1;
  cursor: pointer;
}

.chat-title {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.username {
  color: #333;
}

.time {
  color: #999;
  font-size: 13px;
}

.chat-snippet {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.last-message {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread {
  margin-left: 8px;
}

.chat-actions {
  align-self: flex-start;
}
</style>
