<template>
  <div class="notification-list">
    <div v-loading="loading">
      <template v-if="notifications.length">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
          @click="$emit('notification-click', notification)"
        >
          <div class="notification-icon">
            <el-icon :class="getNotificationIcon(notification.type)"></el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-text">{{ notification.content }}</div>
            <div class="notification-time">{{ formatTime(notification.createTime) }}</div>
          </div>
        </div>
      </template>
      <div v-else class="empty-text">
        暂无通知
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'

export default {
  name: 'NotificationListContent',
  props: {
    notifications: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['notification-click'],
  setup() {
    const getNotificationIcon = (type) => {
      const iconMap = {
        POST_COMMENT: 'el-icon-chat-dot-round',
        POST_LIKE: 'el-icon-star-off',
        USER_FOLLOW: 'el-icon-user',
        SYSTEM: 'el-icon-bell'
      }
      return iconMap[type] || 'el-icon-bell'
    }

    const formatTime = (time) => {
      return dayjs(time).format('YYYY-MM-DD HH:mm')
    }

    return {
      getNotificationIcon,
      formatTime
    }
  }
}
</script>

<style scoped>
.notification-list {
  min-height: 200px;
}

.notification-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-icon {
  margin-right: 15px;
  font-size: 24px;
  color: #409EFF;
}

.notification-content {
  flex: 1;
}

.notification-text {
  font-size: 14px;
  margin-bottom: 5px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.empty-text {
  text-align: center;
  color: #999;
  padding: 40px 0;
}
</style> 