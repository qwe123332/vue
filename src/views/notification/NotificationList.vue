<template>
  <div class="notification-page">
    <el-row justify="center">
      <el-col :xs="24" :sm="20" :md="16">
        <el-card class="notification-card" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="title">我的通知</span>
              <el-button
                  type="primary"
                  size="small"
                  @click="markAllAsRead"
                  :disabled="!hasUnread || loading"
              >
                全部标为已读
              </el-button>
            </div>
          </template>

          <el-tabs v-model="activeTab" @tab-click="handleTabChange">
            <el-tab-pane label="全部" name="all">
              <notification-list-content
                  v-if="!loading"
                  :notifications="visibleNotifications"
                  @notification-click="handleNotificationClick"
              />
            </el-tab-pane>
            <el-tab-pane label="未读" name="unread">
              <notification-list-content
                  v-if="!loading"
                  :notifications="visibleNotifications"
                  @notification-click="handleNotificationClick"
              />
            </el-tab-pane>
          </el-tabs>

          <div v-if="!loading && visibleNotifications.length === 0" class="empty-state">
            <el-empty description="暂无通知" />
          </div>

          <el-pagination
              v-if="total > pageSize"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              :pager-count="5"
              layout="prev, pager, next"
              @current-change="handlePageChange"
              class="pagination"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import NotificationListContent from './NotificationListContent.vue'

// 响应式状态
const router = useRouter()
const activeTab = ref('all')
const allNotifications = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 计算属性
const visibleNotifications = computed(() => {
  return activeTab.value === 'all'
      ? allNotifications.value
      : allNotifications.value.filter(n => !n.read)
})

const hasUnread = computed(() => {
  return allNotifications.value.some(n => !n.read)
})

// 获取通知数据
const fetchNotifications = async (page = 1, tab = activeTab.value) => {
  if (loading.value) return

  try {
    loading.value = true
    const params = {
      page: page - 1,
      size: pageSize.value
    }

    if (tab === 'unread') {
      params.unreadOnly = true
    }

    const  data  = await api.get('/notifications', { params })
    allNotifications.value = data.content || []
    total.value = data.totalElements || 0
    currentPage.value = page
  } catch (error) {
    console.error('获取通知失败', error)

    ElMessage.error('获取通知失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 标记所有通知为已读
const markAllAsRead = async () => {
  if (!hasUnread.value || loading.value) return

  try {
    await api.post('/notifications/read-all')
    allNotifications.value = allNotifications.value.map(notification => ({
      ...notification,
      read: true
    }))
    ElMessage.success('已全部标为已读')
  } catch (error) {
    console.error('标记已读失败', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 标记单个通知为已读并处理点击事件
const handleNotificationClick = async (notification) => {
  if (!notification.read) {
    try {
      await api.post(`/notifications/${notification.id}/read`)
      const index = allNotifications.value.findIndex(n => n.id === notification.id)
      if (index !== -1) {
        allNotifications.value[index] = { ...allNotifications.value[index], read: true }
      }
    } catch (error) {
      console.error('标记已读失败', error)
    }
  }

  // 路由导航
  navigateToTarget(notification)
}

// 根据通知类型导航到相应页面
const navigateToTarget = (notification) => {
  switch (notification.type) {
    case 'POST_COMMENT':
    case 'POST_LIKE':
      router.push(`/posts/${notification.targetId}`)
      break
    case 'USER_FOLLOW':
      router.push(`/users/${notification.targetId}`)
      break
    default:
      // 对于未知类型，可以添加默认行为或日志
      console.log('未知的通知类型:', notification.type)
  }
}

// 处理标签页变化
const handleTabChange = () => {
  currentPage.value = 1
  fetchNotifications(1, activeTab.value)
}

// 处理分页变化
const handlePageChange = (page) => {
  fetchNotifications(page, activeTab.value)
}

// 监听标签页变化
watch(activeTab, (newTab) => {
  currentPage.value = 1
  fetchNotifications(1, newTab)
})

// 组件挂载时获取数据
onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notification-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.notification-card {
  min-height: 500px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  text-align: center;
  padding: 10px 0;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .notification-page {
    padding: 10px;
  }

  .notification-card {
    min-height: 400px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .card-header .el-button {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>
