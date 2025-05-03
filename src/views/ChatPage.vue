<template>
  <div class="chat-page">
    <el-card class="chat-card">
      <!-- 页面头部 -->
      <template #header>
        <div class="chat-header">
          与 <strong>{{ partnerUsername }}</strong> 的对话
          <span 
            class="connection-status" 
            :class="connectionStatusClass" 
            :title="connectionStatusTitle"
          >
            {{ connectionStatusText }}
          </span>
        </div>
      </template>

      <!-- 聊天内容区域 -->
      <PrivateChatContent
        ref="chatContent"
        :messages="messages"
        :current-user-id="currentUserId"
        :loading="loading"
        :typing="partnerIsTyping"
        :new-message-ids="newMessageIds"
        @scrolled-to-bottom="tryMarkMessagesAsRead"
        @message-visible="handleMessageVisible"
      />

      <!-- 消息输入区域 -->
      <PrivateChatInput
        :receiver-id="receiverId"
        :on-send="handleMessageSent"
        :disabled="!isReadyToSend"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import api from '@/services/api';
import { 
  initWebSocket, 
  connectionStatus, 
  addMessageHandler, 
  removeMessageHandler, 
  sendMessage,
  pollNewMessages,
  isWebSocketAvailable,
  sendMarkRead
} from '@/services/websocket';
import PrivateChatContent from '@/components/PrivateChatContent.vue';
import PrivateChatInput from '@/components/PrivateChatInput.vue';

// 路由和状态
const route = useRoute();
const store = useStore();
const receiverId = Number(route.params.userId);

// 组件状态
const messages = ref([]);
const currentUserId = ref(null);
const partnerUsername = ref('对方');
const partnerIsTyping = ref(false);
const chatContent = ref(null);
const loading = ref(false);
const newMessageIds = ref([]);
let pollInterval = null;
let typingTimer = null;

// ===== 计算属性 =====

// 是否可发送消息（已登录）
const isReadyToSend = computed(() => !!store.state.user);

// 连接状态展示
const connectionStatusClass = computed(() => `status-${connectionStatus.value}`);

// 连接状态文本
const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return '实时通信';
    case 'connecting': return '连接中...';
    case 'initializing': return '初始化中...';
    default: return isWebSocketAvailable ? '离线模式' : 'HTTP模式';
  }
});

// 连接状态提示
const connectionStatusTitle = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return '已建立实时连接，消息会立即发送和接收';
    case 'connecting': return '正在连接到聊天服务器...';
    case 'initializing': return '正在初始化聊天服务...';
    default: return isWebSocketAvailable 
      ? '目前使用离线模式，消息将在重新连接后同步'
      : '当前环境不支持实时通信，使用常规HTTP请求';
  }
});

// ===== 数据加载方法 =====

// 拉取历史消息
const fetchHistoryMessages = async () => {
  loading.value = true;
  try {
    const data = await api.get(`/messages/conversation/${receiverId}`, {
      params: { page: 0, size: 50 } 
    });
    
    if (Array.isArray(data)) {
      messages.value = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      await nextTick();
      tryMarkMessagesAsRead();
    }
  } catch (err) {
    console.error('加载历史消息失败', err);
    ElMessage.error('无法加载历史消息');
  } finally {
    loading.value = false;
  }
};

// 拉取当前用户信息
const fetchUserProfile = async () => {
  try {
    const res = await api.get('/users/profile');
    console.log('当前用户信息:', res);
    currentUserId.value = res.id;
    console.log('当前用户ID:', currentUserId.value);
  } catch (err) {
    console.error('获取用户信息失败', err);
    ElMessage.error('无法获取用户信息');
  }
};

// 拉取对方信息
const fetchPartnerInfo = async () => {
  try {
    const data  = await api.get(`/users/${receiverId}`);
    partnerUsername.value = data.username || '对方';
  } catch (err) {
    console.warn('无法获取用户名，使用默认');
  }
};

// ===== 消息处理方法 =====

// 统一尝试标记为已读
const tryMarkMessagesAsRead = () => {
  // 更新本地状态
  messages.value.forEach(msg => {
    if (msg.senderId === receiverId && !msg.read) {
      msg.read = true;
    }
  });
  // 发送服务器标记
  sendMarkRead(receiverId);
};

// 处理消息可见性变化
const handleMessageVisible = (messageId) => {
  // 如果可见消息是新消息且未读，标记已读
  const message = messages.value.find(m => m.id === messageId);
  if (message && !message.read && message.senderId === receiverId) {
    message.read = true;
    sendMarkRead(receiverId);
  }
};

// 处理新消息（WebSocket接收）
const handleNewMessage = (data) => {
  if (data.senderId === receiverId || data.receiverId === receiverId) {
    if (!messages.value.some(m => m.id === data.id)) {
      messages.value.push(data);
      
      // 如果是收到的新消息，添加到高亮列表
      if (data.senderId === receiverId) {
        newMessageIds.value.push(data.id);
        // 5秒后移除高亮效果
        setTimeout(() => {
          newMessageIds.value = newMessageIds.value.filter(id => id !== data.id);
        }, 5000);
      }
      
      nextTick(() => {
        chatContent.value?.scrollToBottom();
        
        // 如果是对方发送的消息且在可视区域中，标记已读
        if (data.senderId === receiverId && chatContent.value?.checkIfAtBottom()) {
          tryMarkMessagesAsRead();
        }
      });
    }
  }
};

// 处理对方正在输入状态
const handleTypingStatus = (data) => {
  if (data.senderId === receiverId) {
    partnerIsTyping.value = !!data.status;
    
    // 15秒后自动清除输入状态（防止卡住）
    if (partnerIsTyping.value) {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        partnerIsTyping.value = false;
      }, 15000);
    }
  }
};

// 发送消息后处理
const handleMessageSent = async (content) => {
  const tempId = `temp-${Date.now()}`;
  // 创建临时消息对象
  const newMessage = {
    id: tempId,
    senderId: currentUserId.value,
    receiverId: receiverId,
    content,
    timestamp: new Date().toISOString(),
    read: false,
    sending: true
  };
  
  // 添加到消息列表
  messages.value.push(newMessage);
  await nextTick();
  chatContent.value?.scrollToBottom();

  // 发送消息
  const result = await sendMessage({
    type: 'CHAT',
    data: { receiverId, content }
  });

  // 更新消息状态
  const msgIndex = messages.value.findIndex(m => m.id === tempId);
  if (msgIndex >= 0) {
    if (result.success) {
      messages.value[msgIndex].sending = false;
      if (result.mode === 'http') {
        // HTTP模式下可能需要重新获取消息列表
        setTimeout(fetchHistoryMessages, 1000);
      }
    } else {
      messages.value[msgIndex].sending = false;
      messages.value[msgIndex].failed = true;
      ElMessage.error('发送失败，请重试');
    }
  }
};

// ===== 轮询机制 =====

// 启动轮询（当WebSocket连接不可用时）
const startPolling = () => {
  if (pollInterval) return;
  
  pollInterval = setInterval(async () => {
    if (connectionStatus.value !== 'connected') {
      await pollNewMessages();
      try {
        const { data: unreadCount } = await api.get('/messages/unread');
        if (unreadCount > 0) fetchHistoryMessages();
      } catch (error) {
        console.error('轮询失败:', error);
      }
    }
  }, 10000); // 每10秒轮询一次
  
  console.log('已启动消息轮询');
};

// 停止轮询
const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('已停止消息轮询');
  }
};

// ===== 监视器 =====

// 监视连接状态变化
watch(() => connectionStatus.value, (newStatus) => {
  if (newStatus === 'connected') {
    stopPolling();
  } else {
    startPolling();
  }
});

// ===== 生命周期钩子 =====

// 组件挂载
onMounted(() => {
  // 初始化WebSocket
  initWebSocket();
  
  // 注册消息处理程序
  addMessageHandler('CHAT', handleNewMessage);
  addMessageHandler('TYPING', handleTypingStatus);
  
  // 加载数据
  fetchUserProfile();
  fetchPartnerInfo();
  fetchHistoryMessages();
  
  // 如果WebSocket未连接，启动轮询
  if (connectionStatus.value !== 'connected') {
    startPolling();
  }
});

// 组件卸载
onUnmounted(() => {
  // 移除消息处理程序
  removeMessageHandler('CHAT');
  removeMessageHandler('TYPING');
  
  // 清理定时器
  stopPolling();
  
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }
});
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
  max-height: 800px; 
  display: flex; 
  flex-direction: column; 
  justify-content: space-between; 
}

.chat-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  font-size: 18px; 
  font-weight: bold; 
}

.connection-status { 
  font-size: 14px; 
  padding: 4px 8px; 
  border-radius: 12px; 
  margin-left: 10px; 
  cursor: help; 
}

.status-connected { color: #67c23a; }
.status-connecting { color: #e6a23c; }
.status-disconnected { color: #f56c6c; }
.status-initializing { color: #909399; }
</style>
