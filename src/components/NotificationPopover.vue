<template>
  <el-popover
    placement="bottom"
    :width="300"
    trigger="click"
    @show="handleShow"
  >
    <template #reference>
      <el-badge :value="state.unreadCount" class="item">
        <el-button size="small">私信</el-button>
      </el-badge>
    </template>

    <div class="notification-container">
      <div class="notification-header">
        <span>通知</span>
        <el-button
          type="text"
          size="small"
          @click="markAllAsRead"
          :disabled="!state.notifications.length"
        >
          全部标为已读
        </el-button>
      </div>

      <el-scrollbar max-height="400px">
        <template v-if="state.notifications.length">
          <div
            v-for="notification in state.notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            @click="handleNotificationClick(notification)"
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
      </el-scrollbar>

      <div v-if="state.notifications.length" class="notification-footer">
        <el-button
          type="text"
          size="small"
          @click="viewAllNotifications"
        >
          查看全部
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<script>
import { reactive, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/services/api'

// 提取图标映射为常量，避免重复创建
const ICON_MAP = {
  POST_COMMENT: 'el-icon-chat-dot-round',
  POST_LIKE: 'el-icon-star-off',
  USER_FOLLOW: 'el-icon-user',
  SYSTEM: 'el-icon-bell'
}

export default {
  name: 'NotificationPopover',
  setup() {
    const router = useRouter()
    // 合并状态到一个 reactive 对象中
    const state = reactive({
      notifications: [],
      unreadCount: 0,
      loading: false
    })

    // 防抖标志，避免频繁请求
    const isRefreshing = ref(false)

    // 合并获取通知和未读数量请求
    const updateNotifications = async () => {
      state.loading = true
      try {
        const [notifRes, unreadRes] = await Promise.all([
          api.get('/notifications', { params: { page: 0, size: 5 } }),
          api.get('/notifications/unread-count')
        ])
        state.notifications = notifRes.data.content
        state.unreadCount = unreadRes.data
      } catch (error) {
        ElMessage.error('获取通知失败')
        console.error('Error fetching notifications:', error)
      } finally {
        state.loading = false
      }
    }

    // 标记单个通知为已读，并更新本地状态
    const markAsRead = async (notificationId) => {
      try {
        await api.post(`/notifications/${notificationId}/read`)
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      } catch (error) {
        console.error('标记已读失败', error)
      }
    }

    // 全部标为已读
    const markAllAsRead = async () => {
      try {
        await api.post('/notifications/read-all')
        state.notifications.forEach(notification => {
          notification.read = true
        })
        state.unreadCount = 0
        ElMessage.success('已全部标为已读')
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }

    // 处理通知点击
    const handleNotificationClick = async (notification) => {
      if (!notification.read) {
        await markAsRead(notification.id)
        notification.read = true
      }
      // 根据通知类型跳转页面
      switch (notification.type) {
        case 'POST_COMMENT':
        case 'POST_LIKE':
          await router.push(`/posts/${notification.targetId}`)
          break
        case 'USER_FOLLOW':
          await router.push(`/users/${notification.targetId}`)
          break
        default:
          console.warn('未知的通知类型:', notification.type)
      }
    }

    // 查看全部通知
    const viewAllNotifications = () => {
      router.push('/notifications')
    }

    // 获取通知图标
    const getNotificationIcon = (type) => {
      return ICON_MAP[type] || ICON_MAP.SYSTEM
    }

    // 格式化时间
    const formatTime = (time) => {
      const now = dayjs()
      const notificationTime = dayjs(time)
      const diff = now.diff(notificationTime, 'hour')
      if (diff < 1) {
        return '刚刚'
      } else if (diff < 24) {
        return `${diff}小时前`
      } else {
        return notificationTime.format('MM-DD HH:mm')
      }
    }

    // 弹出通知框时刷新数据，简单防抖避免重复调用
    const handleShow = async () => {
      if (isRefreshing.value) return
      isRefreshing.value = true
      await updateNotifications()
      isRefreshing.value = false
    }

    onMounted(() => {
      // 初始加载未读数量
      updateNotifications()
    })

    return {
      state,
      handleShow,
      handleNotificationClick,
      markAllAsRead,
      viewAllNotifications,
      getNotificationIcon,
      formatTime
    }
  }
}
</script>

<style scoped>
.notification-container {
  padding: 10px 0;
}
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px 10px;
  border-bottom: 1px solid #eee;
}
.notification-item {
  display: flex;
  padding: 10px 15px;
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
  margin-right: 12px;
  font-size: 20px;
  color: #409EFF;
}
.notification-content {
  flex: 1;
}
.notification-text {
  font-size: 14px;
  margin-bottom: 4px;
}
.notification-time {
  font-size: 12px;
  color: #999;
}
.notification-footer {
  text-align: center;
  padding: 10px 0 0;
  border-top: 1px solid #eee;
}
.empty-text {
  text-align: center;
  color: #999;
  padding: 20px 0;
}
</style>
