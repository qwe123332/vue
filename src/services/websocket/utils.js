import { sendMessage } from '@/services/websocket'
import { debounce } from 'lodash-es'

/**
 * 发送MARK_READ消息（防抖版）
 * @param {string|number} senderId 对方用户ID
 */
export const sendMarkRead = debounce((senderId) => {
  if (!senderId) {
    console.warn('sendMarkRead: senderId为空，取消发送');
    return;
  }

  console.log('[MARK_READ] 正在发送已读标记 => senderId:', senderId);

  sendMessage({
    type: 'MARK_READ',
    data: {
      senderId: senderId.toString()
    }
  });
}, 300, { leading: true, trailing: false }); 
// 300ms防抖，快速操作只发一次
