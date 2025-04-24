<template>
  <div class="profile-container">
    <el-row justify="center">
      <el-col :span="16">
        <!-- 用户信息卡片 -->
        <el-card class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar">
              <el-avatar
                  :size="100"
                  :src="userInfo.avatar"
                  @click="triggerAvatarUpload"
              />
              <input
                  type="file"
                  ref="avatarInput"
                  style="display: none"
                  accept="image/*"
                  @change="handleAvatarChange"
              />
            </div>
            <div class="profile-info">
              <h2>{{ userInfo.username }}</h2>
              <p class="bio">{{ userInfo.bio || '这个人很懒，什么都没写~' }}</p>
              <div class="stats">
                <div class="stat-item">
                  <span class="number">{{ userInfo.postCount || 0 }}</span>
                  <span class="label">帖子</span>
                </div>
                <div class="stat-item">
                  <span class="number">{{ userInfo.followingCount || 0 }}</span>
                  <span class="label">关注</span>
                </div>
                <div class="stat-item">
                  <span class="number">{{ userInfo.followerCount || 0 }}</span>
                  <span class="label">粉丝</span>
                </div>
              </div>
            </div>

            <!-- 他人视图操作 -->
            <div class="profile-actions" v-if="!isCurrentUser">
              <el-button
                  :type="userInfo.isFollowed ? 'default' : 'primary'"
                  @click="toggleFollow"
              >
                {{ userInfo.isFollowed ? '已关注' : '关注' }}
              </el-button>
              <el-button type="success" @click="startChat">私信</el-button>
            </div>
          </div>
        </el-card>

        <!-- 当前用户才显示编辑表单 -->
        <el-card v-if="isCurrentUser" class="edit-form">
          <template #header>
            <div class="card-header">
              <span>编辑资料</span>
            </div>
          </template>

          <el-form :model="profileForm" :rules="rules" ref="profileFormRef" label-width="100px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="profileForm.username" />
            </el-form-item>
            <el-form-item label="个人简介" prop="bio">
              <el-input v-model="profileForm.bio" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateProfile" :loading="updating">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 帖子列表 -->
        <el-card class="posts-section">
          <template #header>
            <div class="card-header">
              <span>发布的帖子</span>
            </div>
          </template>

          <div class="posts-grid">
            <el-card
                v-for="post in posts"
                :key="post.id"
                class="post-card"
                @click="viewPost(post.id)"
            >
              <el-image :src="post.images[0]" fit="cover" class="post-image" />
              <h3>{{ post.title }}</h3>
              <div class="post-meta">
                <span>{{ formatTime(post.createTime) }}</span>
                <div class="post-stats">
                  <span><i class="el-icon-star-off"></i>{{ post.likeCount }}</span>
                  <span><i class="el-icon-chat-dot-round"></i>{{ post.commentCount }}</span>
                </div>
              </div>
            </el-card>
          </div>

          <el-pagination
              v-if="total > 0"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="total"
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
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import dayjs from 'dayjs'

const store = useStore()
const route = useRoute()
const router = useRouter()

const userInfo = ref({})
const posts = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(9)
const updating = ref(false)

const viewedUserId = computed(() => route.params.userId || store.state.user?.id)
const isCurrentUser = computed(() => String(viewedUserId.value) === String(store.state.user?.id))

const profileFormRef = ref(null)
const avatarInput = ref(null)
const profileForm = ref({
  username: '',
  bio: '',
  email: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const fetchUserInfo = async () => {
  try {
    const { data } = await api.get(`/users/${viewedUserId.value}`)
    userInfo.value = data
    if (isCurrentUser.value) {
      profileForm.value.username = data.username
      profileForm.value.bio = data.bio
      profileForm.value.email = data.email
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}

const fetchUserPosts = async (page = 1) => {
  try {
    const { data } = await api.get(`/posts/user/${viewedUserId.value}`, {
      params: { page: page - 1, size: pageSize.value }
    })
    posts.value = data.content
    total.value = data.totalElements
  } catch (error) {
    ElMessage.error('获取帖子失败')
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchUserPosts(page)
}

const updateProfile = async () => {
  if (!profileFormRef.value) return
  try {
    await profileFormRef.value.validate()
    updating.value = true
    await api.put('/users/profile', {
      username: profileForm.value.username,
      bio: profileForm.value.bio || '这个人很懒，什么都没写~',
      email: profileForm.value.email
    })
    ElMessage.success('更新成功')
    await fetchUserInfo()
  } catch {
    ElMessage.error('更新失败')
  } finally {
    updating.value = false
  }
}

const toggleFollow = async () => {
  if (!store.state.user) return router.push('/login')
  try {
    if (userInfo.value.isFollowed) {
      await api.delete(`/social/users/${userInfo.value.id}/follow`)
      userInfo.value.followerCount--
    } else {
      await api.post(`/social/users/${userInfo.value.id}/follow`)
      userInfo.value.followerCount++
    }
    userInfo.value.isFollowed = !userInfo.value.isFollowed
  } catch {
    ElMessage.error('操作失败')
  }
}

const triggerAvatarUpload = () => {
  if (isCurrentUser.value) avatarInput.value.click()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('avatar', file)
  try {
    await api.post('/users/avatar', formData)
    ElMessage.success('头像更新成功')
    await fetchUserInfo()
  } catch {
    ElMessage.error('头像更新失败')
  }
}

const viewPost = (id) => {
  router.push(`/posts/${id}`)
}

const formatTime = (t) => dayjs(t).format('YYYY-MM-DD HH:mm')

const startChat = () => {
  router.push(`/chat/${userInfo.value.id}`)
}

onMounted(() => {
  fetchUserInfo()
  fetchUserPosts()
})

watch(() => route.params.userId, () => {
  fetchUserInfo()
  fetchUserPosts()
})
</script>

<style scoped>
  /* 基础容器优化 */
  .profile-container {
    padding: 20px 0;
    min-height: 100vh;
    background: #f5f7fa;
  }

  /* 卡片通用样式 */
  .el-card {
    margin-bottom: 20px;
    transition: box-shadow 0.3s;
    border-radius: 12px;
  }

  .el-card:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  }

  /* 用户信息头部布局 */
  .profile-header {
    display: flex;
    gap: 30px;
    padding: 20px;
    align-items: flex-start;
    position: relative;
  }

  .profile-avatar {
    position: relative;
    cursor: pointer;
  }

  .profile-avatar:hover::after {
    content: "点击修改";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    text-align: center;
    font-size: 12px;
    padding: 4px;
    border-radius: 0 0 12px 12px;
  }

  /* 用户信息排版 */
  .profile-info {
    flex: 1;
  }

  .profile-info h2 {
    margin: 0 0 8px;
    font-size: 28px;
    color: #303133;
    font-weight: 600;
  }

  .bio {
    color: #606266;
    margin: 0 0 16px;
    line-height: 1.6;
    max-width: 600px;
  }

  /* 统计数字样式 */
  .stats {
    display: flex;
    gap: 30px;
    margin-top: 15px;
  }

  .stat-item {
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .stat-item:hover {
    transform: translateY(-2px);
}

.number {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
}

.label {
  font-size: 14px;
  color: #909399;
}

/* 操作按钮组 */
.profile-actions {
  display: flex;
  gap: 12px;
  margin-left: auto;
  flex-shrink: 0;
}

.profile-actions .el-button {
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.profile-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

/* 帖子网格布局 */
.posts-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.post-card {
  cursor: pointer;
  transition: transform 0.3s;
  overflow: hidden;
}

.post-card:hover {
  transform: translateY(-5px);
}

.post-image {
  height: 200px;
  width: 100%;
  border-radius: 8px 8px 0 0;
  transition: transform 0.3s;
}

.post-card:hover .post-image {
  transform: scale(1.05);
}

.post-meta {
  padding: 12px;
  font-size: 14px;
  color: #909399;
}

.post-stats {
  display: flex;
  gap: 15px;
  margin-top: 8px;
}

.post-stats i {
  margin-right: 4px;
}

/* 分页样式 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-actions {
    margin-left: 0;
    justify-content: center;
    width: 100%;
  }

  .stats {
    flex-direction: column;
    gap: 15px;
  }

  .el-col {
    width: 100%;
    max-width: 100%;
    padding: 0 10px;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}

/* 编辑表单优化 */
.edit-form {
  .el-form-item {
    margin-bottom: 22px;
  }

}

/* 加载状态动画 */

  /* 空状态提示 */
.empty-state {
  padding: 40px 0;
  text-align: center;
}
</style>