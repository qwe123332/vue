<template>
  <div class="moments-list">
    <!-- 顶部背景和用户头像区域 -->
    <div class="moments-header">
      <div class="header-bg"></div>
      <div class="user-profile">
        <el-avatar :size="70" :src="userAvatar" class="profile-avatar" />
        <div class="profile-name">{{ userName }}</div>
      </div>
    </div>
    
    <!-- 帖子列表 -->
    <div class="moments-content">
      <!-- 骨架屏（loading状态） -->
      <div v-if="loading" class="loading-container">
        <el-skeleton
          v-for="n in 2"
          :key="n"
          :rows="3"
          animated
          style="margin-bottom: 10px;"
        />
      </div>
      
      <!-- 空数据提示 -->
      <el-empty v-else-if="posts.length === 0" description="暂无动态" />
      
      <!-- 动态列表 -->
      <div v-else class="moments-items">
        <div 
          v-for="post in posts" 
          :key="post.id" 
          class="moment-item"
          @click="viewPost(post.id)"
        >
          <!-- 用户信息 -->
          <div class="item-header">
            <el-avatar :size="40" :src="post.avatar" />
            <div class="user-info">
              <div class="user-name">{{ post.username }}</div>
              <div class="post-time">{{ formatTime(post.createdAt) }}</div>
            </div>
          </div>

          <!-- 标题 -->
          <h1>{{ post.title }}</h1>

          <!-- 帖子内容 -->
          <div class="item-content">
            <p class="content-text">{{ post.description }}</p>
            <div class="posts-grid">
            <!-- 图片展示 -->
            <div v-if="post.images && post.images.length > 0" class="image-grid">
              <el-image 
                v-for="(img, index) in post.images.slice(0, 9)" 
                :key="index"
                :src="img"
                fit="cover"
                class="moment-image"
                :class="getImageClass(post.images.length)"
                lazy
                :preview-src-list="[]"
              />
            </div>
            </div>
          </div>
          
          <!-- 位置信息 -->
          <div v-if="post.location" class="item-location">
            <el-icon><Location /></el-icon>
            <span>{{ post.location }}</span>
          </div>
          
          <!-- 互动区域：点赞/评论 -->
          <div class="item-footer">
            <div class="interactions">
              <el-button
                text
                :type="post.liked ? 'danger' : ''"
                @click.stop="toggleLike(post)"
              >
                <el-icon><Star /></el-icon>
                <span>赞</span>
                <span v-if="post.likeCount > 0" class="count">({{ formatCount(post.likeCount) }})</span>
              </el-button>
              
              <el-button
                text
                @click.stop="viewPost(post.id)"
              >
                <el-icon><ChatDotRound /></el-icon>
                <span>评论</span>
                <span v-if="post.commentCount > 0" class="count">({{ formatCount(post.commentCount) }})</span>
              </el-button>
            </div>
          </div>
          
          <!-- 点赞列表 -->
          <div v-if="post.likeCount > 0" class="likes-section">
            <el-icon class="like-icon"><Star /></el-icon>
            <div class="likes-list">{{ getLikesText(post) }}</div>
          </div>
          
          <!-- 评论预览 -->
          <div v-if="post.commentCount > 0" class="comments-preview">
            <div
              v-for="(comment, idx) in post.topComments || []"
              :key="idx"
              class="comment-item"
            >
              <span class="comment-user">{{ comment.username }}：</span>
              <span class="comment-content">{{ comment.content }}</span>
            </div>
            <div v-if="post.commentCount > (post.topComments?.length || 0)" class="view-more">
              查看全部{{ post.commentCount }}条评论
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
        class="pagination"
        background
        hide-on-single-page
      />
      
      <!-- 加载更多 -->
      <div v-if="posts.length > 0 && !loading" class="load-more" @click="loadMore">
        {{ hasMore ? '点击加载更多' : '没有更多内容了' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Star, ChatDotRound, Location } from '@element-plus/icons-vue';
import api from '@/services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// dayjs配置
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// 组件状态
const store = useStore();
const router = useRouter();
const posts = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const loading = ref(false);
const isLoggedIn = computed(() => !!store.state.user);
const postsCache = new Map(); // 缓存分页数据

// 是否还有更多
const hasMore = computed(() => total.value > posts.value.length);

// 用户信息（假设从store获取）
const userAvatar = computed(() => store.state.user?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');
const userName = computed(() => store.state.user?.username || '当前用户');

/**
 * 获取帖子列表
 * @param {number} page - 当前页码
 * @param {boolean} append - 是否在列表尾部追加数据
 */
const fetchPosts = async (page = 1, append = false) => {
  loading.value = true;
  const keyword = searchKeyword.value.trim();
  const cacheKey = `${keyword}_${page}`;
  
  if (postsCache.has(cacheKey)) {
    // 缓存命中
    const cached = postsCache.get(cacheKey);
    if (append) {
      posts.value = [...posts.value, ...cached.posts];
    } else {
      posts.value = cached.posts;
    }
    total.value = cached.total;
    loading.value = false;
    return;
  }
  
  try {
    const { data } = await api.get('/posts', {
      params: {
        page: page - 1,
        size: pageSize.value,
        keyword
      },
    });
    // 模拟添加假的评论数据（实际应由后端提供）
    const enhancedPosts = data.content.map((post) => ({
      ...post,
      topComments: post.commentCount > 0 ? generateFakeComments(Math.min(post.commentCount, 2)) : []
    }));

    if (append) {
      posts.value = [...posts.value, ...enhancedPosts];
    } else {
      posts.value = enhancedPosts;
    }
    
    total.value = data.totalElements;
    // 缓存
    postsCache.set(cacheKey, {
      posts: enhancedPosts,
      total: data.totalElements
    });
  } catch (error) {
    ElMessage.error('获取动态列表失败');
    console.error('Error fetching posts:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 模拟生成假的评论数据
 */
const generateFakeComments = (count) => {
  const fakeUsers = ['小明', '小红', '小张', '小李', '小王', '小刘'];
  const fakeContents = ['不错哦！', '支持一下', '很精彩', '学习了', '赞一个'];
  
  return Array(count).fill().map(() => ({
    username: fakeUsers[Math.floor(Math.random() * fakeUsers.length)],
    content: fakeContents[Math.floor(Math.random() * fakeContents.length)]
  }));
};

/**
 * 分页切换
 */
const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  fetchPosts(page);
};

/**
 * 加载更多
 */
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  currentPage.value += 1;
  fetchPosts(currentPage.value, true);
};

/**
 * 搜索
 */
const handleSearch = () => {
  postsCache.clear();
  currentPage.value = 1;
  fetchPosts(1);
};

/**
 * 点赞/取消点赞
 */
const toggleLike = async (post) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
  
  try {
    if (post.liked) {
      await api.delete(`/posts/${post.id}/like`);
      post.likeCount--;
    } else {
      await api.post(`/posts/${post.id}/like`);
      post.likeCount++;
    }
    post.liked = !post.liked;
  } catch (error) {
    ElMessage.error('操作失败');
    console.error('Error toggling like:', error);
  }
};

/**
 * 查看帖子详情
 */
const viewPost = (id) => {
  router.push(`/posts/${id}`);
};

/**
 * 时间格式化
 */
const formatTime = (time) => {
  if (!time) return '';
  const date = dayjs(time);
  
  // 模仿朋友圈风格
  if (date.isAfter(dayjs().subtract(1, 'minute'))) {
    return '刚刚';
  } else if (date.isAfter(dayjs().subtract(1, 'hour'))) {
    return date.fromNow();
  } else if (date.isAfter(dayjs().startOf('day'))) {
    return date.format('HH:mm');
  } else if (date.isAfter(dayjs().subtract(1, 'day').startOf('day'))) {
    return '昨天 ' + date.format('HH:mm');
  } else if (date.isAfter(dayjs().subtract(2, 'day').startOf('day'))) {
    return '前天 ' + date.format('HH:mm');
  } else if (date.isAfter(dayjs().startOf('year'))) {
    return date.format('MM-DD HH:mm');
  } else {
    return date.format('YYYY-MM-DD HH:mm');
  }
};

/**
 * 数字格式化
 */
const formatCount = (count) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + '千';
  }
  return count;
};

/**
 * 获取图片样式类
 */
const getImageClass = (count) => {
  if (count === 1) return 'single-image';
  if (count === 4) return 'four-images';
  return '';
};

/**
 * 获取点赞列表文本
 */
const getLikesText = (post) => {
  // 实际应从后端获取用户列表
  const fakeUsers = ['小明', '小红', '小张', '小李', '小王', '小刘'];
  const likeUsers = [];
  
  // 如果当前用户已点赞，优先显示自己
  if (post.liked && isLoggedIn.value) {
    likeUsers.push(userName.value);
  }
  const remainingCount = post.likeCount - (post.liked ? 1 : 0);

  // 填充一些假用户
  for (let i = 0; i < Math.min(remainingCount, 5); i++) {
    likeUsers.push(fakeUsers[i % fakeUsers.length]);
  }
  
  // 如果总点赞数超过6人，用“等X人”结尾
  if (post.likeCount > 6) {
    likeUsers.push(`等${post.likeCount}人`);
  }
  
  return likeUsers.join('、');
};

// 组件挂载
onMounted(() => {
  fetchPosts();
});
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
