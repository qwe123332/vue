<template>
  <div class="post-card" @click="goToDetail">
    <el-card>
      <div class="post-content">
        <div class="post-image" v-if="post.coverImage">
          <img :src="post.coverImage" :alt="post.title">
        </div>
        <div class="post-info">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-excerpt">{{ post.content }}</p>
          <div class="post-meta">
            <span class="author">
              <el-avatar :size="24" :src="post.author.avatar" />
              {{ post.author.username }}
            </span>
            <span class="stats">
              <el-icon><View /></el-icon> {{ post.views }}
              <el-icon><Star /></el-icon> {{ post.likes }}
              <el-icon><ChatSquare /></el-icon> {{ post.comments }}
            </span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { View, Star, ChatSquare } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

export default {
  name: 'PostCard',
  components: { View, Star, ChatSquare },
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()

    const goToDetail = () => {
      router.push(`/posts/${props.post.id}`)
    }

    return { goToDetail }
  }
}
</script>

<style scoped>
.post-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.post-card:hover {
  transform: translateY(-2px);
}

.post-content {
  display: flex;
  gap: 16px;
}

.post-image {
  width: 200px;
  height: 150px;
  overflow: hidden;
  border-radius: 8px;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-info {
  flex: 1;
}

.post-title {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
}

.post-excerpt {
  margin: 0 0 12px;
  color: #666;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #999;
  font-size: 13px;
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats .el-icon {
  margin-right: 4px;
}
</style>
