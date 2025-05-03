<template>
  <div class="chat-input">
    <div class="input-container">
      <el-input
          type="textarea"
          v-model="message"
          :autosize="{ minRows: 2, maxRows: 4 }"
          placeholder="输入消息，支持 Emoji 😄，按 Shift+Enter 换行"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.stop
          :disabled="disabled"
          @input="handleTyping"
          ref="messageInput"
      />
      
      <div class="input-tools">
        <div class="character-count" :class="{ 'near-limit': isNearLimit }">
          {{ message.length }}/500
        </div>
      </div>
    </div>
    
    <el-tooltip
      :content="getSendButtonTooltip()"
      placement="top"
      :disabled="canSend"
    >
      <div class="send-button-wrapper">
        <el-button
            type="primary"
            :disabled="!canSend"
            @click="sendMessage"
            :loading="sending"
            class="send-button"
        >
          <el-icon v-if="!sending"><Position /></el-icon>
          发送
        </el-button>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Position } from '@element-plus/icons-vue'
import { connectionStatus, sendMessage as sendWebSocketMessage } from '@/services/websocket'

// 属性定义
const props = defineProps({
  receiverId: {
    type: Number,
    required: true
  },
  onSend: {
    type: Function,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// 状态管理
const message = ref('')
const sending = ref(false)
const messageInput = ref(null)
const typingTimeout = ref(null)
const isTyping = ref(false)

// 常量
const MAX_LENGTH = 500

// ===== 计算属性 =====

// 是否接近字数限制
const isNearLimit = computed(() => {
  return message.value.length > MAX_LENGTH * 0.8
})

// 是否可以发送消息
const canSend = computed(() => {
  return !props.disabled && 
         message.value.trim().length > 0 && 
         message.value.length <= MAX_LENGTH &&
         !sending.value
})

// ===== 工具方法 =====

// 获取发送按钮的提示文本
const getSendButtonTooltip = () => {
  if (props.disabled) return '聊天功能不可用'
  if (sending.value) return '正在发送...'
  if (!message.value.trim()) return '请输入消息'
  if (message.value.length > MAX_LENGTH) return `消息超出最大长度 (${MAX_LENGTH})`
  return ''
}

// ===== 发送消息 =====
const sendMessage = async () => {
  if (!canSend.value) return
  
  try {
    const content = message.value.trim()
    sending.value = true
    
    // 清除打字状态
    clearTypingStatus()
    
    // 调用父组件提供的发送函数
    await props.onSend(content)
    
    // 成功后清空输入框
    message.value = ''
    
    // 聚焦回输入框，方便继续聊天
    setTimeout(() => {
      messageInput.value?.focus()
    }, 100)
  } catch (error) {
    console.error('消息发送失败', error)
    ElMessage.error('发送失败，请稍后重试')
  } finally {
    sending.value = false
  }
}

// ===== 打字状态管理 =====

// 处理正在输入状态
const handleTyping = () => {
  // 限制字数
  if (message.value.length > MAX_LENGTH) {
    message.value = message.value.substring(0, MAX_LENGTH)
  }
  
  // 只有在WebSocket连接时才发送打字状态
  if (connectionStatus.value !== 'connected') return
  
  // 如果状态没变化，只重置超时计时器
  if (isTyping.value) {
    clearTimeout(typingTimeout.value)
  } else {
    // 发送正在输入状态
    isTyping.value = true
    sendWebSocketMessage({
      type: 'TYPING',
      data: { receiverId: props.receiverId, status: true }
    }).catch(err => console.warn('发送打字状态失败', err))
  }
  
  // 3秒无操作后清除打字状态
  typingTimeout.value = setTimeout(() => {
    clearTypingStatus()
  }, 3000)
}

// 清除打字状态
const clearTypingStatus = () => {
  if (!isTyping.value) return
  
  isTyping.value = false
  clearTimeout(typingTimeout.value)
  
  if (connectionStatus.value === 'connected') {
    sendWebSocketMessage({
      type: 'TYPING',
      data: { receiverId: props.receiverId, status: false }
    }).catch(err => console.warn('清除打字状态失败', err))
  }
}

// ===== 监视器 =====

// 当禁用状态改变时，清除打字状态
watch(() => props.disabled, (newVal) => {
  if (newVal) clearTypingStatus()
})

// ===== 生命周期钩子 =====
onMounted(() => {
  // 组件加载完成后自动聚焦到输入框
  setTimeout(() => {
    messageInput.value?.focus()
  }, 500)
})

onBeforeUnmount(() => {
  // 组件卸载前清除打字状态
  clearTypingStatus()
  clearTimeout(typingTimeout.value)
})
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

.input-container {
  flex-grow: 1;
  position: relative;
}

.input-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 2px;
  color: #909399;
}

.character-count {
  font-size: 12px;
  color: #909399;
  transition: color 0.3s ease;
}

.character-count.near-limit {
  color: #e6a23c;
}

.send-button {
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.send-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 使输入框样式更友好 */
:deep(.el-textarea__inner) {
  border-radius: 8px;
  border-color: #dcdfe6;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

:deep(.el-textarea__inner:focus) {
  border-color: #409EFF;
  box-shadow: 0 1px 5px rgba(64, 158, 255, 0.2);
}
</style>