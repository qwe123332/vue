<template>
  <div class="chat-window" ref="chatContainer" @scroll="handleScroll">
    <!-- 加载指示器 -->
    <div v-if="loading" class="loading-spinner">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
    
    <!-- 未读消息分隔线 -->
    <div v-if="unreadSeparatorIndex !== -1" class="unread-separator">
      <span>以下是新消息</span>
    </div>
    
    <!-- 消息列表 -->
    <div
        v-for="(msg, index) in messages"
        :key="msg.id"
        class="chat-bubble"
        :class="{ 
          'mine': msg.senderId === currentUserId,
          'unread': !msg.read && msg.senderId !== currentUserId,
          'sending': msg.sending,
          'failed': msg.failed,
          'highlight': isNewMessage(msg)
        }"
    >
      <div class="text-content" v-html="formatText(msg.content)"></div>
      
      <!-- 发送状态和时间戳 -->
      <div class="message-status" v-if="msg.senderId === currentUserId">
        <span v-if="msg.sending">发送中...</span>
        <span v-else-if="msg.failed" class="failed-status">发送失败</span>
        <span v-else class="timestamp">{{ formatTime(msg.timestamp) }}</span>
      </div>
      <div v-else class="timestamp">{{ formatTime(msg.timestamp) }}</div>
    </div>
    
    <!-- 对方输入状态 -->
    <div v-if="isAtBottom && typing" class="typing-indicator">
      <span>对方正在输入...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, nextTick, onMounted, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const props = defineProps({
  messages: Array,
  currentUserId: Number,
  loading: {
    type: Boolean,
    default: false
  },
  typing: {
    type: Boolean,
    default: false
  },
  // 新增属性，标记哪些消息是新接收的
  newMessageIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['scrolled-to-bottom', 'message-visible'])

// 状态管理
const chatContainer = ref(null)
const isAtBottom = ref(true)
const lastScrollPosition = ref(0)

// ===== 计算属性 =====

// 计算第一条未读消息的索引，用于显示分隔线
const unreadSeparatorIndex = computed(() => {
  if (!props.messages || props.messages.length === 0) return -1
  
  // 找到第一条对方发的未读消息
  return props.messages.findIndex(
    msg => msg.senderId !== props.currentUserId && !msg.read
  )
})

// ===== 工具方法 =====

// 判断消息是否为新收到的消息
const isNewMessage = (msg) => {
  return props.newMessageIds && props.newMessageIds.includes(msg.id)
}

// 处理文本格式化
const formatText = (text) => {
  if (!text) return ''
  
  // 处理换行符
  const withLineBreaks = text.replace(/\n/g, '<br/>')
  
  // 链接识别和处理 (将URL转为可点击链接)
  return withLineBreaks.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  )
}

// 格式化时间显示
const formatTime = (ts) => {
  if (!ts) return ''
  const date = dayjs(ts)
  const today = dayjs().startOf('day')
  
  // 如果是今天的消息，只显示时间
  if (date.isAfter(today)) {
    return date.format('HH:mm')
  } 
  // 如果是昨天的消息，显示"昨天"和时间
  else if (date.isAfter(today.subtract(1, 'day'))) {
    return `昨天 ${date.format('HH:mm')}`
  }
  // 其他情况显示完整日期时间
  else {
    return date.format('YYYY-MM-DD HH:mm')
  }
}

// ===== 滚动处理 =====

// 检查是否滚动到底部
const checkIfAtBottom = () => {
  const container = chatContainer.value
  if (!container) return false
  
  const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 20
  isAtBottom.value = atBottom
  
  // 如果在底部，触发事件
  if (atBottom) {
    emit('scrolled-to-bottom')
  }
  
  return atBottom
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const container = chatContainer.value
    if (container) {
      lastScrollPosition.value = container.scrollHeight
      container.scrollTop = container.scrollHeight
      isAtBottom.value = true
      emit('scrolled-to-bottom')
    }
  })
}

// 监听滚动事件，检测可见消息
const handleScroll = () => {
  const container = chatContainer.value
  if (!container) return
  
  // 检测可见消息并发出事件
  const messageElements = container.querySelectorAll('.chat-bubble')
  const containerRect = container.getBoundingClientRect()
  
  messageElements.forEach((el, index) => {
    const rect = el.getBoundingClientRect()
    // 如果消息元素在可视区域内
    if (rect.top >= containerRect.top && rect.bottom <= containerRect.bottom) {
      const msgId = props.messages[index]?.id
      if (msgId) {
        emit('message-visible', msgId)
      }
    }
  })
  
  checkIfAtBottom()
}

// ===== 监视器 =====

// 当消息列表变化时，处理滚动逻辑
watch(() => props.messages, (newMessages, oldMessages) => {
  nextTick(() => {
    const container = chatContainer.value
    if (!container) return
    
    // 如果之前在底部，或者有新消息添加，则滚动到底部
    if (
      isAtBottom.value || 
      (oldMessages && newMessages && newMessages.length > oldMessages.length) || 
      (unreadSeparatorIndex.value !== -1)
    ) {
      scrollToBottom()
    } else {
      // 保持当前滚动位置（处理消息状态更新的情况）
      container.scrollTop = lastScrollPosition.value
    }
    
    lastScrollPosition.value = container.scrollTop
  })
}, { deep: true })

// ===== 生命周期钩子 =====
onMounted(() => {
  scrollToBottom()
})

// 暴露方法给父组件
defineExpose({
  scrollToBottom,
  checkIfAtBottom
})
</script>

<style scoped>
.chat-window {
  height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: #fafafa;
  scroll-behavior: smooth;
}

.chat-bubble {
  max-width: 70%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 8px;
  background-color: #f2f2f2;
  word-break: break-word;
  white-space: pre-wrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}

.chat-bubble.mine {
  align-self: flex-end;
  background-color: #d3f4ff;
}

.chat-bubble.unread {
  border-left: 3px solid #e6a23c;
}

.chat-bubble.sending {
  opacity: 0.8;
}

.chat-bubble.failed {
  border: 1px dashed #f56c6c;
}

/* 新消息高亮效果 */
.chat-bubble.highlight {
  animation: highlight-fade 2s ease-in-out;
}

@keyframes highlight-fade {
  0% { background-color: rgba(103, 194, 58, 0.2); }
  100% { background-color: inherit; }
}

.timestamp {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  text-align: right;
}

.message-status {
  font-size: 12px;
  margin-top: 4px;
  text-align: right;
}

.failed-status {
  color: #f56c6c;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 20px;
  color: #409EFF;
  font-size: 24px;
}

.typing-indicator {
  align-self: flex-start;
  padding: 5px 10px;
  color: #909399;
  font-size: 12px;
  margin: 5px 0;
}

/* 未读消息分隔线样式 */
.unread-separator {
  position: relative;
  text-align: center;
  margin: 15px 0;
  user-select: none;
}

.unread-separator::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background-color: #e6a23c;
  z-index: 0;
}

.unread-separator span {
  position: relative;
  background-color: #fafafa;
  padding: 0 10px;
  color: #e6a23c;
  font-size: 12px;
  z-index: 1;
}
</style>
