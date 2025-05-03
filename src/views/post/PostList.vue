<template>
  <div class="moments-list">
    <!-- 顶部背景和用户头像 -->
    <div class="moments-header">
      <div class="header-bg"></div>
      <div class="user-profile">
        <el-avatar :size="70" :src="userAvatar" class="profile-avatar" />
        <div class="profile-name">{{ userName }}</div>
      </div>
    </div>

    <!-- 标签筛选栏 -->
    <div class="tag-filter-bar">
      <el-scrollbar>
        <div class="tag-list">
          <el-tag
            :type="!route.query.tagId ? 'success' : 'info'"
            class="tag-item"
            @click="clearTagFilter"
          >全部</el-tag>
          <el-tag
            v-for="tag in tagList"
            :key="tag.id"
            :type="tag.id == route.query.tagId ? 'success' : 'info'"
            class="tag-item"
            @click="selectTag(tag)"
          >{{ tag.name }}</el-tag>
        </div>
      </el-scrollbar>
    </div>

    <!-- 当前筛选提示 -->
    <template v-if="route.query.tagName">
      <div class="tag-filter-banner">
        当前筛选：
        <el-tag type="success">{{ route.query.tagName }}</el-tag>
        <el-button text size="small" @click="clearTagFilter">清除筛选</el-button>
      </div>
    </template>

    <!-- 帖子列表主体 -->
    <div class="moments-content">
      <div v-if="loading" class="loading-container">
        <el-skeleton v-for="n in 2" :key="n" :rows="3" animated style="margin-bottom: 10px;" />
      </div>
      <el-empty v-else-if="posts.length === 0" description="暂无动态" />

      <div v-else class="moments-items">
        <div v-for="post in posts" :key="post.id" class="moment-item" @click="viewPost(post.id)">
          <div class="item-header">
            <el-avatar :size="40" :src="post.userAvatar" />
            <div class="user-info">
              <div class="user-name">{{ post.username }}</div>
              <div class="post-time">{{ formatTime(post.createdTime) }}</div>
            </div>
          </div>
          <h1>{{ post.title }}</h1>
          <div class="item-content">
            <p class="content-text">{{ post.content }}</p>
            <div v-if="post.images && post.images.length" class="image-grid">
              <el-image
                v-for="(img, index) in post.images.slice(0, 9)"
                :key="index"
                :src="img"
                fit="cover"
                class="moment-image"
                :class="getImageClass(post.images.length)"
                lazy
                :preview-src-list="post.images"
              />
            </div>
          </div>
          <div v-if="post.location" class="item-location">
            <el-icon><Location /></el-icon>
            <span>{{ post.location }}</span>
          </div>
          <div class="item-footer">
            <div class="interactions">
              <el-button text :type="post.isLiked ? 'danger' : ''" @click.stop="toggleLike(post)">
                <el-icon><Star /></el-icon>
                <span>赞</span>
                <span v-if="post.likeCount > 0" class="count">({{ formatCount(post.likeCount) }})</span>
              </el-button>
              <el-button text @click.stop="viewPost(post.id)">
                <el-icon><ChatDotRound /></el-icon>
                <span>评论</span>
                <span v-if="post.commentCount > 0" class="count">({{ formatCount(post.commentCount) }})</span>
              </el-button>
            </div>
          </div>
          <div v-if="post.likeCount > 0" class="likes-section">
            <el-icon class="like-icon"><Star /></el-icon>
            <div class="likes-list">{{ getLikesText(post) }}</div>
          </div>
          <div v-if="post.commentCount > 0" class="comments-preview">
            <div v-for="(comment, idx) in post.commentDTOs || []" :key="idx" class="comment-item">
              <span class="comment-user">{{ comment.username }}：</span>
              <span class="comment-content">{{ comment.content }}</span>
            </div>
            <div v-if="post.commentCount > (post.commentDTOs?.length || 0)" class="view-more">
              查看全部{{ post.commentCount }}条评论
            </div>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
        background
        hide-on-single-page
        class="pagination"
      />

      <div v-if="posts.length && !loading" class="load-more" @click="loadMore">
        {{ hasMore ? '点击加载更多' : '没有更多内容了' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, ChatDotRound, Location } from '@element-plus/icons-vue'
import api from '@/services/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 初始化 dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 基础数据
const store = useStore()
const router = useRouter()
const route = useRoute()

const posts = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const postsCache = new Map()
const tagList = ref([]) // ✅ 补上tagList
const isLoggedIn = computed(() => !!store.state.user)
const userAvatar = computed(() => store.state.user?.avatar || '')
const userName = computed(() => store.state.user?.username || '游客')

// 缓存分页数据
const hasMore = computed(() => total.value > posts.value.length)
// ✅ 这里补上 selectTag 方法！
const selectTag = (tag) => {
  router.push({ path: '/posts', query: { tagId: tag.id, tagName: tag.name } })
}

// 拉取帖子列表
const fetchPosts = async (page = 1, append = false) => {
  loading.value = true
  const cacheKey = `${route.query.tagId || 'all'}_${page}`

  if (postsCache.has(cacheKey)) {
    const cached = postsCache.get(cacheKey)
    posts.value = append ? [...posts.value, ...cached.posts] : cached.posts
    total.value = cached.total
    loading.value = false
    return
  }

  try {
    const data = await api.get('/posts', {
      params: {
        page: page - 1,
        size: pageSize.value,
        tagId: route.query.tagId || undefined
      }
    })
    const postList = data.records || []
    total.value = data.total || 0

    posts.value = append ? [...posts.value, ...postList] : postList
    postsCache.set(cacheKey, { posts: postList, total: total.value })
  } catch (err) {
    ElMessage.error('获取动态失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 拉取标签列表
const fetchTags = async () => {
  try {
    const data = await api.get('/tags')
    tagList.value = data
    console.log('拉取到Tag列表:', data)
  } catch (error) {
    console.error('获取标签失败:', error)
  }
}

// // 清除标签筛选
// const clearTagFilter = () => {
//   router.push({ path: '/posts', query: { tagId: undefined, tagName: undefined } })
// }


// 监听tag变化刷新
console.log('Tag ID:', route.query.tagId)
watch(() => route.query.tagId, () => {
  postsCache.clear()
  posts.value = []
  currentPage.value = 1
  fetchPosts(1)
})

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
  fetchPosts(page)
}

// 加载更多
const loadMore = () => {
  if (loading.value || !hasMore.value) return
  currentPage.value += 1
  fetchPosts(currentPage.value, true)
}

// 点赞
const toggleLike = async (post) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  try {
    if (post.isLiked) {
      await api.delete(`/posts/${post.id}/like`)
      post.likeCount--
    } else {
      await api.post(`/posts/${post.id}/like`)
      post.likeCount++
    }
    post.isLiked = !post.isLiked
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 进入帖子详情
const viewPost = (id) => {
  router.push(`/posts/${id}`)
}

// 清除标签筛选
const clearTagFilter = () => {
  router.push('/posts')
}

// 时间格式化
const formatTime = (time) => {
  if (!time) return ''
  const date = dayjs(time)
  if (date.isAfter(dayjs().subtract(1, 'minute'))) return '刚刚'
  if (date.isAfter(dayjs().subtract(1, 'hour'))) return date.fromNow()
  if (date.isAfter(dayjs().startOf('day'))) return date.format('HH:mm')
  if (date.isAfter(dayjs().subtract(1, 'day').startOf('day'))) return '昨天 ' + date.format('HH:mm')
  if (date.isAfter(dayjs().subtract(2, 'day').startOf('day'))) return '前天 ' + date.format('HH:mm')
  if (date.isAfter(dayjs().startOf('year'))) return date.format('MM-DD HH:mm')
  return date.format('YYYY-MM-DD HH:mm')
}

// 数字格式化
const formatCount = (count) => {
  if (count >= 10000) return (count / 10000).toFixed(1) + '万'
  if (count >= 1000) return (count / 1000).toFixed(1) + '千'
  return count
}

// 图片展示样式
const getImageClass = (count) => {
  if (count === 1) return 'single-image'
  if (count === 4) return 'four-images'
  return ''
}

// 点赞文本
const getLikesText = (post) => {
  if (!post.likeCount) return ''
  return post.likeCount + '人点赞'
}

// 页面挂载时加载
onMounted(() => {
  fetchPosts()
  fetchTags() 
})
</script>
<style scoped>
.moments-list {
  background-color: #f2f2f2;
  min-height: 100vh;
}

.moments-header {
  position: relative;
  height: 240px;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, #3eb575, #8dd2a8);
  z-index: 1;
}

.user-profile {
  position: absolute;
  bottom: -30px;
  right: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.profile-avatar {
  border: 4px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-name {
  margin-top: 5px;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.moments-content {
  padding: 10px;
}

.loading-container {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.moments-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.moment-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;
  cursor: pointer;
}

.moment-item:active {
  background-color: #f9f9f9;
}

.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  margin-left: 12px;
}

.user-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.post-time {
  color: #999;
  font-size: 12px;
  margin-top: 2px;
}

.item-content {
  margin-bottom: 12px;
}

.content-text {
  margin: 0 0 12px 0;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  word-break: break-word;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.moment-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  object-fit: cover;
}

.item-location {
  display: flex;
  align-items: center;
  color: #42b983;
  font-size: 12px;
  margin-bottom: 12px;
}

.item-location .el-icon {
  margin-right: 4px;
  font-size: 14px;
}

.item-footer {
  margin-top: 10px;
}

.interactions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  border-bottom: 1px solid #f2f2f2;
  padding-bottom: 10px;
}

.interactions .el-button {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.interactions .el-icon {
  margin-right: 2px;
}

.count {
  font-size: 13px;
  color: #999;
}

.likes-section {
  display: flex;
  padding: 8px 0;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-top: 10px;
}

.like-icon {
  color: #f56c6c;
  margin: 0 10px;
}

.likes-list {
  flex: 1;
  font-size: 13px;
  color: #42b983;
}

.comments-preview {
  margin-top: 8px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.comment-item {
  font-size: 13px;
  margin-bottom: 6px;
  line-height: 1.4;
}

.comment-user {
  color: #42b983;
  font-weight: bold;
}

.comment-content {
  color: #333;
  word-break: break-word;
}

.view-more {
  font-size: 13px;
  color: #999;
  margin-top: 6px;
  cursor: pointer;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.load-more {
  text-align: center;
  padding: 15px;
  color: #999;
  font-size: 14px;
  margin-top: 10px;
  cursor: pointer;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .moments-header {
    height: 180px;
  }
  
  .user-profile {
    right: 10px;
    bottom: -25px;
  }
  
  .profile-avatar {
    width: 60px;
    height: 60px;
  }
  
  .moments-content {
    padding: 5px;
  }
}

@media (min-width: 769px) {
  .moments-content {
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
