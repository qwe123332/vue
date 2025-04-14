<template>
  <div class="chat-input">
    <el-input
        type="textarea"
        v-model="message"
        :autosize="{ minRows: 2, maxRows: 4 }"
        placeholder="输入消息，支持 Emoji 😄"
        @keyup.enter.exact.prevent="sendMessage"
    />
    <el-button
        type="primary"
        :disabled="!message.trim()"
        @click="sendMessage"
    >
      发送
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/services/api'

const props = defineProps({
  receiverId: Number,
  onSend: Function // 发送成功后调用，用于刷新列表
})

const message = ref('')

const sendMessage = async () => {
  const content = message.value.trim()
  if (!content) return

  try {
    await api.post('/messages/send', {
      receiverId: props.receiverId,
      content,
      messageType: 'TEXT'
    })
    ElMessage.success('发送成功')
    message.value = ''
    props.onSend?.()
  } catch (e) {
    console.error('发送失败', e)
    ElMessage.error('发送失败，请稍后重试')
  }
}
</script>

<style scoped>
.chat-input {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #eee;
}
</style>
