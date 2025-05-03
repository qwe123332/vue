<template>
  <div class="chat-list-page">
    <el-card class="chat-card">
      <!-- 页面头部 -->
      <template #header>
        <div class="chat-header">
          我的私信
          <span class="connection-status" :class="connectionStatusClass">
            {{ connectionStatusText }}
          </span>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading">
        <el-skeleton :rows="3" animated :count="3" />
      </div>

      <!-- 会话列表 -->
      <div v-else-if="conversations.length > 0">
        <div
          v-for="item in sortedConversations"
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
              <el-badge v-if="item.unreadCount > 0" :value="item.unreadCount" class="unread" />
            </div>
          </div>
          
          <div class="chat-actions">
            <el-popconfirm
              title="确认删除该会话？"
              confirm-button-text="确认"
              cancel-button-text="取消"
              @confirm="deleteConversation(item.userId)"
            >
              <template #reference>
                <el-button type="danger" icon="Delete" size="small" text />
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无私信会话" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import api from '@/services/api';
import { 
  initWebSocket, 
  connectionStatus, 
  addMessageHandler, 
  removeMessageHandler,
  sendMarkRead 
} from '@/services/websocket';

// 路由
const router = useRouter();

// 组件状态
const loading = ref(false);
const conversations = ref([]);

// ===== 计算属性 =====

// 连接状态样式类
const connectionStatusClass = computed(() => `status-${connectionStatus.value}`);

// 连接状态文本
const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return '在线';
    case 'connecting': return '连接中...';
    case 'initializing': return '初始化中...';
    default: return '离线';
  }
});

// 排序会话列表（最新消息在上方）
const sortedConversations = computed(() => {
  return [...conversations.value].sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
});

// ===== 数据加载方法 =====

// 加载会话列表
const fetchConversations = async () => {
  loading.value = true;
  try {
    const  data  = await api.get('/messages/conversations');
    if (Array.isArray(data)) {
      conversations.value = data;
    }
  } catch (err) {
    console.error('获取会话列表失败', err);
    ElMessage.error('无法加载会话列表');
  } finally {
    loading.value = false;
  }
};

// 更新或新增会话
const updateConversation = (message) => {
  const { senderId, content, timestamp } = message;
  const userId = senderId;

  // 查找是否已有该会话
  const existing = conversations.value.find(c => c.userId === userId);
  
  if (existing) {
    // 更新已有会话的最新消息和未读数
    existing.lastMessage = content;
    existing.lastTime = timestamp;
    existing.unreadCount += 1;
  } else {
    // 添加新会话
    fetchUserInfo(userId).then(userInfo => {
      conversations.value.push({
        userId,
        username: userInfo.username,
        avatar: userInfo.avatar,
        lastMessage: content,
        lastTime: timestamp,
        unreadCount: 1
      });
    });
  }
};

// 获取用户信息
const fetchUserInfo = async (userId) => {
  try {
    const { data } = await api.get(`/users/${userId}`);
    return {
      username: data.username || '未知用户',
      avatar: data.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    };
  } catch (err) {
    console.error('获取用户信息失败', err);
    return {
      username: '未知用户',
      avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    };
  }
};

// ===== 会话操作方法 =====

// 删除会话
const deleteConversation = async (userId) => {
  try {
    await api.delete(`/messages/conversations/${userId}`);
    conversations.value = conversations.value.filter(c => c.userId !== userId);
    ElMessage.success('会话已删除');
  } catch (err) {
    ElMessage.error('删除失败，请稍后重试');
    console.error('删除会话失败', err);
  }
};

// 标记会话为已读
const markConversationAsRead = (userId) => {
  const conversation = conversations.value.find(c => c.userId === Number(userId));
  if (conversation) {
    conversation.unreadCount = 0;
  }
  sendMarkRead(userId);
};

// 点击跳转到聊天页
const goToChat = (userId) => {
  markConversationAsRead(userId);
  router.push(`/chat/${userId}`);
};

// ===== WebSocket消息处理 =====

// 处理聊天消息
const handleChatMessage = (data) => {
  if (data.receiverId !== data.senderId) {
    updateConversation(data);
  }
};

// 处理已读回执
const handleReadReceipt = (data) => {
  const { senderId } = data;
  const conversation = conversations.value.find(c => c.userId === senderId);
  if (conversation) {
    conversation.unreadCount = 0;
  }
};

// ===== 工具方法 =====

// 格式化时间
const formatTime = (t) => {
  if (!t) return '';
  
  const date = dayjs(t);
  const now = dayjs();
  
  if (date.isSame(now, 'day')) return date.format('HH:mm');
  if (date.isSame(now.subtract(1, 'day'), 'day')) return '昨天';
  if (date.isSame(now, 'year')) return date.format('MM-DD');
  
  return date.format('YYYY-MM-DD');
};

// ===== 生命周期钩子 =====

onMounted(() => {
  // 初始化WebSocket
  initWebSocket();
  
  // 注册消息处理程序
  addMessageHandler('CHAT', handleChatMessage);
  addMessageHandler('READ_RECEIPT', handleReadReceipt);
  
  // 加载会话列表
  fetchConversations();
});

onUnmounted(() => {
  // 移除消息处理程序
  removeMessageHandler('CHAT');
  removeMessageHandler('READ_RECEIPT');
});
</script>

<style scoped>
.chat-list-page { max-width: 800px; margin: 20px auto; padding: 20px; }
.chat-card { min-height: 600px; }
.chat-header { display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: bold; }
.connection-status { font-size: 14px; padding: 4px 8px; border-radius: 12px; margin-left: 10px; }
.status-connected { color: #67c23a; }
.status-connecting { color: #e6a23c; }
.status-disconnected { color: #f56c6c; }
.status-initializing { color: #909399; }

.chat-item { display: flex; align-items: center; gap: 16px; padding: 16px 12px; border-bottom: 1px solid #eee; transition: background-color 0.2s; }
.chat-item:hover { background-color: #f9f9f9; }
.avatar { width: 48px; height: 48px; cursor: pointer; }
.chat-info { flex: 1; cursor: pointer; }
.chat-title { display: flex; justify-content: space-between; font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.username { color: #333; }
.time { color: #999; font-size: 13px; }
.chat-snippet { display: flex; justify-content: space-between; align-items: center; color: #666; font-size: 14px; }
.last-message { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.unread { margin-left: 8px; }
.chat-actions { align-self: flex-start; }
</style>
