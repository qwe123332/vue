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
                  <span class="number">{{ userInfo.postCount||0 }}</span>
                  <span class="label">帖子</span>
                </div>
                <div class="stat-item">
                  <span class="number">{{ userInfo.followingCount||0 }}</span>
                  <span class="label">关注</span>
                </div>
                <div class="stat-item">
                  <span class="number">{{ userInfo.followerCount||0 }}</span>
                  <span class="label">粉丝</span>
                </div>
              </div>
            </div>
            <div class="profile-actions" v-if="!isCurrentUser">
              <el-button 
                :type="userInfo.isFollowed ? 'default' : 'primary'"
                @click="toggleFollow"
              >
                {{ userInfo.isFollowed ? '已关注' : '关注' }}
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 编辑资料表单 -->
        <el-card v-if="isCurrentUser" class="edit-form">
          <template #header>
            <div class="card-header">
              <span>编辑资料</span>
            </div>
          </template>
          
          <el-form 
            :model="profileForm" 
            :rules="rules"
            ref="profileFormRef"
            label-width="100px"
          >
            <el-form-item label="用户名" prop="username">
              <el-input v-model="profileForm.username" />
            </el-form-item>
            <el-form-item label="个人简介" prop="bio">
              <el-input 
                v-model="profileForm.bio" 
                type="textarea" 
                :rows="3"
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                @click="updateProfile"
                :loading="updating"
              >
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 用户帖子列表 -->
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
              <el-image 
                :src="post.images[0]" 
                fit="cover"
                class="post-image"
              />
              <h3>{{ post.title }}</h3>
              <div class="post-meta">
                <span>{{ formatTime(post.createTime) }}</span>
                <div class="post-stats">
                  <span>
                    <i class="el-icon-star-off"></i>
                    {{ post.likeCount }}
                  </span>
                  <span>
                    <i class="el-icon-chat-dot-round"></i>
                    {{ post.commentCount }}
                  </span>
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

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import dayjs from 'dayjs'

export default {
  name: 'Profile',
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const profileFormRef = ref(null)
    const avatarInput = ref(null)

    const userInfo = computed(() => store.state.user)
    const posts = ref([])
    const total = ref(0)
    const currentPage = ref(1)
    const pageSize = ref(9)
    const updating = ref(false)
    
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

    const isCurrentUser = computed(() => {
      return store.state.user?.id === userInfo.value.id
    })

    const fetchUserInfo = async () => {
      try {
        console.log("打印")
       store.dispatch("fetchUserProfile")
       userInfo.value = store.state.user
      } catch (error) {
        ElMessage.error('获取用户信息失败')
      }
    }

    const fetchUserPosts = async (page = 1) => {
      try {
        console.log("store.user.value",store.state.user.id)
        console.log("获取帖子列表")
        const { data } = await api.get(`/posts/user/${store.state.user.id}`, {
          params: { page: page - 1, size: pageSize.value }
        })
        posts.value = data.content
        console.log("posts",data)
        total.value = data.totalElements
      } catch (error) {
        ElMessage.error('获取帖子列表失败')
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
        store.state.user.username = profileForm.value.username
        store.state.user.bio = profileForm.value.bio?profileForm.value.bio:"这个人很懒，什么都没写~"
        store.state.user.email = profileForm.value.email
        await api.put('/users/profile', store.state.user)
        ElMessage.success('更新成功')
        await fetchUserInfo()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('更新失败')
        }
      } finally {
        updating.value = false
      }
    }

    const toggleFollow = async () => {
      if (!store.state.user) {
        router.push('/login')
        return
      }

      try {
        if (userInfo.value.isFollowed) {
          await api.delete(`/social/users/${userInfo.value.id}/follow`)
          userInfo.value.followerCount--
        } else {
          await api.post(`/social/users/${userInfo.value.id}/follow`)
          userInfo.value.followerCount++
        }
        userInfo.value.isFollowed = !userInfo.value.isFollowed
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }

    const triggerAvatarUpload = () => {
      if (isCurrentUser.value) {
        avatarInput.value.click()
      }
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
      } catch (error) {
        ElMessage.error('头像更新失败')
      }
    }

    const viewPost = (postId) => {
      router.push(`/posts/${postId}`)
    }

    const formatTime = (time) => {
      return dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  
    onMounted(() => {
      
      fetchUserInfo()
      fetchUserPosts()
    })

    return {
      userInfo,
      posts,
      total,
      currentPage,
      pageSize,
      profileForm,
      profileFormRef,
      avatarInput,
      rules,
      updating,
      isCurrentUser,
      handlePageChange,
      updateProfile,
      toggleFollow,
      triggerAvatarUpload,
      handleAvatarChange,
      viewPost,
      formatTime
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 30px;
}

.profile-avatar {
  cursor: pointer;
}

.profile-info {
  flex: 1;
}

.bio {
  color: #666;
  margin: 10px 0;
}

.stats {
  display: flex;
  gap: 30px;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.number {
  font-size: 20px;
  font-weight: bold;
}

.label {
  color: #666;
  font-size: 14px;
}

.edit-form {
  margin-bottom: 20px;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.post-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.post-card:hover {
  transform: translateY(-5px);
}

.post-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}

.post-stats {
  display: flex;
  gap: 15px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}
</style> 