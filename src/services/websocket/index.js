import { ref, reactive } from 'vue';
import store from '@/store';
import api from '@/services/api';
import { debounce } from 'lodash-es';

// 状态管理
export const connectionStatus = ref('initializing');
export const messageHandlers = reactive(new Map());

// WebSocket 配置
let socket = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 5000;
const MAX_CONNECTION_ATTEMPTS = 5;
let connectionAttempts = 0;

// 环境检测
export const isWebSocketAvailable = typeof WebSocket !== 'undefined';

// WebSocket服务地址
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/chat';

// ===== WebSocket连接管理 =====
export function initWebSocket() {
  // 检查是否已连接或正在连接
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  
  // 检查环境支持
  if (!isWebSocketAvailable) {
    connectionStatus.value = 'disconnected';
    console.warn('当前环境不支持WebSocket');
    return;
  }

  // 获取认证信息
  const token = localStorage.getItem('token') || store.state.token;
  if (!token) {
    connectionStatus.value = 'disconnected';
    console.warn('未登录状态，不建立WebSocket连接');
    return;
  }

  // 清理旧连接
  if (socket) {
    try { socket.close(); } catch (_) {}
    socket = null;
  }

  // 开始连接
  connectionStatus.value = 'connecting';
  connectionAttempts++;

  try {
    socket = new WebSocket(`${WS_URL}?token=${token}`);
    
    // 设置连接超时
    const connectionTimeout = setTimeout(() => {
      if (socket && socket.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket连接超时');
        socket.close();
        connectionStatus.value = 'disconnected';
      }
    }, 30000);

    // 连接成功
    socket.onopen = () => {
      clearTimeout(connectionTimeout);
      connectionStatus.value = 'connected';
      console.log('WebSocket 连接已建立');
      connectionAttempts = 0;
      reconnectDelay = 1000;
      startHeartbeat();
    };

    // 接收消息
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PONG') return;
        (messageHandlers.get(data.type) || messageHandlers.get('default'))?.(data);
      } catch (e) {
        console.error('WebSocket消息解析失败:', e);
      }
    };

    // 连接关闭
    socket.onclose = (event) => {
      clearTimeout(connectionTimeout);
      stopHeartbeat();
      connectionStatus.value = 'disconnected';
      
      // 非正常关闭且未超过重试次数，尝试重连
      if (!event.wasClean && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
        scheduleReconnect();
      }
    };

    // 连接出错
    socket.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      connectionStatus.value = 'disconnected';
    };
  } catch (err) {
    console.error('WebSocket连接异常:', err);
    connectionStatus.value = 'disconnected';
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      scheduleReconnect();
    }
  }
}

// ===== 消息发送 =====
function buildMessagePayload(message) {
  const user = store.state.user;
  if (!user?.id) return null;

  const basePayload = {
    from: user.id,
    timestamp: Date.now(),
  };

  switch (message.type) {
    case 'CHAT':
    case 'NEW_MESSAGES':
      return {
        ...basePayload,
        type: message.type,
        to: message.data.receiverId,
        content: message.data.content,
      };
    case 'TYPING':
      return {
        ...basePayload,
        type: 'TYPING',
        to: message.data.receiverId,
        content: 'typing',
      };
    case 'MARK_READ':
      return {
        ...basePayload,
        type: 'MARK_READ',
        to: message.data.senderId,
      };
    default:
      console.warn('未知消息类型:', message.type);
      return null;
  }
}

export async function sendMessage(message) {
  const payload = buildMessagePayload(message);
  if (!payload) {
    return { success: false, mode: 'invalid' };
  }

  // WebSocket发送尝试
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(payload));
      return { success: true, mode: 'ws' };
    } catch (e) {
      console.warn('WebSocket发送失败，尝试HTTP降级', e);
    }
  } else if (socket && socket.readyState === WebSocket.CONNECTING) {
    try {
      // 尝试等待连接完成
      await new Promise(resolve => setTimeout(resolve, 500));
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
        return { success: true, mode: 'ws' };
      }
    } catch (e) {
      console.warn('WebSocket重试发送失败，降级到HTTP', e);
    }
  }

  // HTTP降级处理
  try {
    switch (message.type) {
      case 'CHAT':
        await api.post('/messages/send', {
          receiverId: message.data.receiverId,
          content: message.data.content
        });
        break;
      case 'MARK_READ':
        await api.post(`/messages/read/${message.data.senderId}`);
        break;
      case 'TYPING':
        // 打字状态在HTTP模式下忽略
        return { success: true, mode: 'ignored' };
      default:
        console.warn('未知消息类型，无法通过HTTP降级发送', message.type);
        return { success: false, mode: 'none' };
    }
    return { success: true, mode: 'http' };
  } catch (error) {
    console.error('HTTP降级发送也失败:', error);
    return { success: false, mode: 'failed' };
  }
}

// ===== 工具函数 =====
function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  
  heartbeatTimer = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
      } catch (e) {
        console.error('发送心跳失败', e);
        stopHeartbeat();
        connectionStatus.value = 'disconnected';
        initWebSocket();
      }
    } else {
      stopHeartbeat();
      connectionStatus.value = 'disconnected';
      initWebSocket();
    }
  }, 30000);
}

function stopHeartbeat() {
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  
  const delay = Math.min(reconnectDelay * Math.pow(1.5, connectionAttempts - 1), MAX_RECONNECT_DELAY);
  console.log(`将在${delay}ms后尝试重新连接WebSocket...`);
  
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initWebSocket();
  }, delay);
}

// ===== 公开API =====
export function addMessageHandler(type, handler) {
  messageHandlers.set(type, handler);
}

export function removeMessageHandler(type) {
  messageHandlers.delete(type);
}

export function closeConnection() {
  if (socket) {
    socket.close(1000, "User logout");
    socket = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  stopHeartbeat();
  connectionStatus.value = 'disconnected';
}

export function isConnected() {
  return socket?.readyState === WebSocket.OPEN;
}

// ===== 备用方案：轮询 =====
export async function pollNewMessages() {
  if (connectionStatus.value === 'connected') return;
  
  try {
    const { data: unreadCount } = await api.get('/messages/unread');
    
    if (unreadCount > 0) {
      const { data: conversations } = await api.get('/messages/conversations');
      const unreadConversations = conversations.filter(conv => conv.unreadCount > 0);
      
      if (unreadConversations.length > 0 && messageHandlers.has('NEW_MESSAGES')) {
        messageHandlers.get('NEW_MESSAGES')(unreadConversations);
      }
    }
  } catch (error) {
    console.error('轮询新消息失败:', error);
  }
}

// ===== 工具函数导出 =====
export const sendMarkRead = debounce((senderId) => {
  if (!senderId) {
    console.warn('sendMarkRead: senderId为空，取消发送');
    return;
  }

  console.log('[MARK_READ] 正在发送已读标记 => senderId:', senderId);

  sendMessage({
    type: 'MARK_READ',
    data: { senderId: senderId.toString() }
  });
}, 300, { leading: true, trailing: false });

// 自动重连机制
if (store && store.watch) {
  store.watch(
    (state) => state.token,
    (newToken) => {
      if (newToken) {
        if (connectionStatus.value === 'disconnected') {
          initWebSocket();
        }
      } else {
        closeConnection();
      }
    }
  );
}
