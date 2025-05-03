import { ref, reactive } from 'vue';
import store from '@/store';
import api from '@/services/api';

// WebSocket服务地址可能需要调整
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/chat';

// WebSocket连接状态
export const connectionStatus = ref('initializing'); // 可能的状态: initializing, connected, connecting, disconnected
export const messageHandlers = reactive(new Map());

// WebSocket实例
let socket = null;
let reconnectTimer = null;
let heartbeatTimer = null;
const MAX_RECONNECT_DELAY = 5000;
let reconnectDelay = 1000;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

// 是否具备WebSocket环境
export const isWebSocketAvailable = 'WebSocket' in window;

// 初始化WebSocket连接
export function initWebSocket() {
  // 如果已经连接或正在连接，不要重复连接
  if (socket !== null && (
    socket.readyState === WebSocket.OPEN || 
    socket.readyState === WebSocket.CONNECTING
  )) {
    return;
  }
  
  // 如果环境不支持WebSocket，直接设置为不可用状态
  if (!isWebSocketAvailable) {
    connectionStatus.value = 'disconnected';
    console.warn('当前环境不支持WebSocket');
    return;
  }

  // 获取用户Token用于认证
  const token = localStorage.getItem('token') || store.state.token;
  // 如果没有Token，直接设置为断开状态

  if (!token) {
    connectionStatus.value = 'disconnected';
    console.warn('未登录状态，不建立WebSocket连接');
    return;
  }

  // 重置之前的连接
  if (socket) {
    try {
      socket.close();
    } catch (e) {
      console.error('关闭旧WebSocket连接失败:', e);
    }
    socket = null;
  }

  connectionStatus.value = 'connecting';
  connectionAttempts++;

  try {
    // 带上token作为认证信息
    socket = new WebSocket(`${WS_URL}?token=${token}`);
    console.log("当前token:", token)

    // 设置30秒的连接超时
    const connectionTimeout = setTimeout(() => {
      if (socket && socket.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket连接超时');
        socket.close();
        connectionStatus.value = 'disconnected';
      }
    }, 30000);

    socket.onopen = () => {
      connectionStatus.value = 'connected';
      console.log('WebSocket 连接已建立');
      connectionAttempts = 0; // 重置连接尝试次数
      reconnectDelay = 1000; // 重置重连延迟
      
      // 清除连接超时定时器
      clearTimeout(connectionTimeout);
      
      // 连接成功后立即发送PING以验证连接
      sendPing();
      
      // 开始定期心跳
      startHeartbeat();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('收到WebSocket消息:', data);

        // 心跳响应不做特殊处理
        if (data.type === 'PONG') {
          return;
        }

        // 根据消息类型调用对应的处理函数
        if (data.type && messageHandlers.has(data.type)) {
          messageHandlers.get(data.type)(data);
        } else if (messageHandlers.has('default')) {
          messageHandlers.get('default')(data);
        }
      } catch (e) {
        console.error('处理WebSocket消息失败:', e);
      }
    };

    socket.onclose = (event) => {
      clearTimeout(connectionTimeout);
      console.log('WebSocket 连接已关闭:', event.code, event.reason);
      
      // 清理心跳定时器
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      // 判断是否是正常关闭
      const wasClean = event.wasClean || event.code === 1000;
      
      if (!wasClean && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
        // 非正常关闭且未超过最大尝试次数，尝试重连
        connectionStatus.value = 'disconnected';
        scheduleReconnect();
      } else if (!wasClean) {
        // 超过重试次数，设置为断开状态
        connectionStatus.value = 'disconnected';
        console.warn(`WebSocket连接失败，已尝试${MAX_CONNECTION_ATTEMPTS}次`);
      } else {
        // 正常关闭
        connectionStatus.value = 'disconnected';
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      // 错误时不主动关闭，让onclose处理
      connectionStatus.value = 'disconnected';
    };
  } catch (error) {
    console.error('建立WebSocket连接失败:', error);
    connectionStatus.value = 'disconnected';
    
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      scheduleReconnect();
    }
  }
}

// 发送PING心跳包
function sendPing() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
    } catch (e) {
      console.error('发送PING失败', e);
    }
  }
}
function buildMessagePayload(message) {
  const user = store.state.user;
  if (!user || !user.id) {
    console.warn('当前用户信息缺失，无法发送消息');
    return null;
  }

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
        to: message.data.senderId, // ✅ 一律取 senderId
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
  
    // 优先 WebSocket 发送
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(payload));
        return { success: true, mode: 'ws' };
      } catch (e) {
        console.warn('WebSocket发送失败，尝试HTTP降级', e);
        console.log('当前WebSocket状态:', socket.readyState)

      }
    } else if (socket && socket.readyState === WebSocket.CONNECTING) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(payload));
          return { success: true, mode: 'ws' };
        }
      } catch (e) {
        console.warn('WebSocket重试发送失败，降级到HTTP', e);
        console.log('当前WebSocket状态:', socket.readyState)
      }
    }
  
    // HTTP 降级部分保留原逻辑
    try {
        console.log('WebSocket发送失败，尝试HTTP降级', payload);
        console.log('当前WebSocket状态:', socket.readyState)
      // 这里可以根据消息类型选择不同的API接口进行发送
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
  

// 检查WebSocket是否处于已连接状态
export function isConnected() {
  return socket && socket.readyState === WebSocket.OPEN;
}

// 添加消息处理器
export function addMessageHandler(type, handler) {
  messageHandlers.set(type, handler);
}

// 移除消息处理器
export function removeMessageHandler(type) {
  messageHandlers.delete(type);
}

// 关闭WebSocket连接
export function closeConnection() {
  if (socket) {
    socket.close(1000, "User logout");
    socket = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  
  connectionStatus.value = 'disconnected';
}

// 安排重连
function scheduleReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  // 使用指数退避策略
  const delay = Math.min(reconnectDelay * Math.pow(1.5, connectionAttempts - 1), MAX_RECONNECT_DELAY);
  
  console.log(`将在${delay}ms后尝试重新连接WebSocket...`);
  
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initWebSocket();
  }, delay);
}

// 心跳检测 - 更强健的实现
function startHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  
  heartbeatTimer = setInterval(() => {
    // 检查连接状态
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket连接已断开，尝试重连');
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      connectionStatus.value = 'disconnected';
      initWebSocket(); // 尝试重连
      return;
    }
    
    // 发送心跳
    sendPing();
  }, 30000); // 30秒发送一次心跳
}

// 轮询新消息（作为WebSocket的备用方案）
export async function pollNewMessages() {
  if (connectionStatus.value === 'connected') {
    // 如果WebSocket连接正常，不需要轮询
    return;
  }
  
  try {
    // 获取所有未读消息数
    const { data: unreadCount } = await api.get('/messages/unread');
    
    if (unreadCount > 0) {
      // 获取会话预览列表，查看有哪些未读会话
      const { data: conversations } = await api.get('/messages/conversations');
      
      // 有未读消息的对话
      const unreadConversations = conversations.filter(conv => conv.unreadCount > 0);
      
      // 通知处理器
      if (unreadConversations.length > 0 && messageHandlers.has('NEW_MESSAGES')) {
        messageHandlers.get('NEW_MESSAGES')(unreadConversations);
      }
    }
  } catch (error) {
    console.error('轮询新消息失败:', error);
  }
}

// 自动重连机制
store.watch(
  (state) => state.token,
  (newToken) => {
    if (newToken) {
      // 用户登录时连接
      if (connectionStatus.value === 'disconnected') {
        initWebSocket();
      }
    } else {
      // 用户登出时断开
      closeConnection();
    }
  }
);