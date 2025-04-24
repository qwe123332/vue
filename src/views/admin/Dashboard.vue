<template>
  <div class="admin-dashboard">
    <!-- Welcome Banner -->
    <el-card class="welcome-card" shadow="hover">
      <div class="welcome-content">
        <img src="@/assets/admin-avatar.png" class="admin-avatar" alt="Admin Avatar">
        <div class="welcome-text">
          <h2>欢迎回来, {{ adminName }}</h2>
          <p>上次登录时间: {{ lastLoginTime }}</p>
        </div>
        <div class="quick-actions">
          <el-button-group>
            <el-button type="primary" icon="el-icon-plus" @click="handleAddUser">添加用户</el-button>
            <el-button type="success" icon="el-icon-document" @click="handleNewAnnouncement">新建公告</el-button>
            <el-button type="warning" icon="el-icon-setting" @click="handleSystemSettings">系统设置</el-button>
          </el-button-group>
        </div>
      </div>
    </el-card>

    <!-- Statistics Cards with Trend Indicators -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in enhancedStatistics" :key="stat.label">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <el-icon :class="stat.icon" class="stat-icon"></el-icon>
            <div class="stat-info">
              <div class="stat-value">
                {{ stat.value }}
                <el-tag :type="stat.trend > 0 ? 'success' : 'danger'" size="small">
                  {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
                </el-tag>
              </div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-sub">较上周</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Main Content Area -->
    <el-row :gutter="20" class="dashboard-main">
      <el-col :span="16">
        <!-- Data Visualization -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>数据趋势</span>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
                <el-radio-button label="year">年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <!-- 在此处插入图表组件 -->
        </el-card>

        <!-- Enhanced Pending Posts Table -->
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>待审核帖子</span>
            </div>
          </template>
          <el-table :data="pendingPosts" style="width: 100%">
            <el-table-column prop="id" label="帖子ID" width="80"></el-table-column>
            <el-table-column prop="title" label="标题"></el-table-column>
            <el-table-column prop="author" label="作者"></el-table-column>
            <el-table-column prop="createdTime" label="发布时间"></el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button size="small" type="success" @click="handleAuditPost(scope.row, true)">通过</el-button>
                <el-button size="small" type="danger" @click="handleAuditPost(scope.row, false)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination 
            background 
            layout="prev, pager, next" 
            :page-size="pendingPostsPagination.pageSize" 
            :total="pendingPostsPagination.total" 
            @current-change="handlePageChange">
          </el-pagination>
        </el-card>
      </el-col>

      <el-col :span="8">
        <!-- System Health -->
        <el-card class="health-card">
          <template #header>
            <div class="card-header">
              <span>系统健康</span>
              <el-tag :type="systemHealth.status">{{ systemHealth.message }}</el-tag>
            </div>
          </template>
          <el-progress 
            :percentage="systemHealth.cpu"
            :color="cpuColorHandler"
            :format="percentFormat"
            type="dashboard"
            class="health-metric"
          >
            <template #default="{ percentage }">
              <span class="metric-label">CPU</span>
              <span class="percentage">{{ percentage }}%</span>
            </template>
          </el-progress>
          <el-progress 
            :percentage="systemHealth.memory"
            :color="memoryColorHandler"
            :format="percentFormat"
            type="dashboard"
            class="health-metric"
          >
            <template #default="{ percentage }">
              <span class="metric-label">内存</span>
              <span class="percentage">{{ percentage }}%</span>
            </template>
          </el-progress>
        </el-card>
        <!-- 其他指标、用户、日志等组件可继续完善 -->
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
/* 新增和原有样式 */
.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.admin-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}

.welcome-text {
  flex: 1;
}

.welcome-text h2 {
  margin: 0;
  font-size: 24px;
}

.welcome-text p {
  margin: 5px 0 0;
  color: #666;
}

.quick-actions {
  margin-left: auto;
}

.chart-card,
.health-card,
.content-card {
  margin-bottom: 20px;
}

.health-metric {
  margin: 20px 0;
  text-align: center;
}

.metric-label {
  font-size: 14px;
  color: #666;
  display: block;
}

.percentage {
  font-size: 20px;
  font-weight: bold;
  display: block;
}

/* 其他样式 */
.admin-dashboard {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  font-size: 48px;
  color: #409EFF;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
}

.dashboard-main {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from "@/services/api";

const router = useRouter()

// 基本信息
const adminName = ref('Admin')
const lastLoginTime = ref('2024-01-01 12:00:00')
const chartPeriod = ref('week')

// 系统健康数据
const systemHealth = ref({
  status: 'success',
  message: '正常',
  cpu: 45,
  memory: 60
})

// 统计数据（待替换为接口返回数据）
const enhancedStatistics = ref([
  { label: '总用户数', value: 1234, trend: 5.2, icon: 'UserFilled' },
  { label: '今日访问', value: 423, trend: -2.1, icon: 'View' },
  { label: '新增帖子', value: 85, trend: 12.3, icon: 'Document' },
  { label: '系统消息', value: 12, trend: 0, icon: 'Bell' }
])

// 待审核帖子列表及分页数据
const pendingPosts = ref([])
const pendingPostsPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// 颜色处理函数
const cpuColorHandler = (percentage) => percentage < 70 ? '#67C23A' : '#F56C6C'
const memoryColorHandler = (percentage) => percentage < 70 ? '#67C23A' : '#F56C6C'
const percentFormat = (percentage) => `${percentage}%`

// 获取统计数据
const fetchStatistics = () => {
  api.get('/admin/statistics')
    .then(response => {
      const data = response.data
      // 根据接口返回的数据结构更新统计数据
      enhancedStatistics.value = [
        { label: '总用户数', value: data.totalUsers, trend: data.totalUsersTrend, icon: 'UserFilled' },
        { label: '今日访问', value: data.todayVisits, trend: data.todayVisitsTrend, icon: 'View' },
        { label: '新增帖子', value: data.newPosts, trend: data.newPostsTrend, icon: 'Document' },
        { label: '系统消息', value: data.systemMessages, trend: data.systemMessagesTrend, icon: 'Bell' }
      ]
    })
    .catch(error => {
      console.error('获取统计数据失败', error)
    })
}

// 获取系统健康数据
const fetchSystemHealth = () => {
  api.get('/admin/metrics')
    .then(response => {
      const data = response.data
      systemHealth.value = {
        status: data.healthStatus,   // 如 'success' 或 'danger'
        message: data.healthMessage, // 如 '正常' 或 '异常'
        cpu: data.cpuUsage,
        memory: data.memoryUsage
      }
    })
    .catch(error => {
      console.error('获取系统健康数据失败', error)
    })
}

// 获取待审核帖子数据
const fetchPendingPosts = (page = 0) => {
  api.get('/admin/posts/pending', { params: { page, size: pendingPostsPagination.value.pageSize } })
    .then(response => {
      const data = response.data
      // 根据接口返回的数据结构更新帖子列表及分页信息
      pendingPosts.value = data.content
      pendingPostsPagination.value.total = data.totalElements
      pendingPostsPagination.value.page = data.number + 1
    })
    .catch(error => {
      console.error('获取待审核帖子失败', error)
    })
}

// 分页切换
const handlePageChange = (newPage) => {
  fetchPendingPosts(newPage - 1)
}

// 审核帖子
const handleAuditPost = (post, approved) => {
  if (!approved) {
    // 若拒绝，需输入拒绝原因
    const reason = window.prompt('请输入拒绝原因:')
    if (!reason) return
    api.post(`/admin/posts/${post.id}/audit`, null, { params: { approved, reason } })
      .then(() => {
        fetchPendingPosts(pendingPostsPagination.value.page - 1)
      })
      .catch(error => {
        console.error('审核帖子失败', error)
      })
  } else {
    api.post(`/admin/posts/${post.id}/audit`, null, { params: { approved, reason: '' } })
      .then(() => {
        fetchPendingPosts(pendingPostsPagination.value.page - 1)
      })
      .catch(error => {
        console.error('审核帖子失败', error)
      })
  }
}

// 快捷操作按钮处理（页面跳转）
const handleAddUser = () => router.push('/admin/users/add')
const handleNewAnnouncement = () =>router.push('/admin/announcements/new')
const handleSystemSettings = () => router.push('/admin/settings')

onMounted(() => {
  fetchStatistics()
  fetchSystemHealth()
  fetchPendingPosts()
})
</script>
