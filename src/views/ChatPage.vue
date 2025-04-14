<template>
  <div class="chat-page">
    <el-card class="chat-card">
      <template #header>
        <div class="chat-header">
          与 <strong>{{ partnerUsername }}</strong> 的对话
        </div>
      </template>

      <PrivateChatContent
          :messages="messages"
          :current-user-id="currentUserId"
      />

      <PrivateChatInput
          :receiver-id="receiverId"
          :on-send="fetchMessages"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PrivateChatContent from '@/components/PrivateChatContent.vue'
import PrivateChatInput from '@/components/PrivateChatInput.vue'

const route = useRoute()
const receiverId = Number(route.params.userId) // 假设路由为 /chat/:userId

const messages = ref([])
const currentUserId = ref(null)
const partnerUsername = ref('对方')

const fetchMessages = async () => {
  try {
    const { data } = await api.get(`/messages/conversation/${receiverId}`)
    messages.value = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    console.log('消息列表', data)
  } catch (err) {
    console.error('加载消息失败', err)
  }
}

const fetchUserProfile = async () => {
  const res = await api.get('/users/profile')
  currentUserId.value = res.data.id
}

const fetchPartnerInfo = async () => {
  try {
    const { data } = await api.get(`/users/${receiverId}`)
    partnerUsername.value = data.username || '对方'
  } catch (err) {
    console.warn('无法获取用户名，使用默认')
  }
}

onMounted(() => {
  fetchUserProfile()
  fetchMessages()
  fetchPartnerInfo()
})
</script>

<style scoped>
.chat-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  height: 800px;
}

.chat-card {
  min-height: 600px;
  display: flex;
  max-height: 800px;
  flex-direction: column;
  justify-content: space-between;
}

.chat-header {
  font-size: 18px;
  font-weight: bold;
}
</style>
