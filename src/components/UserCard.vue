<template>
  <div class="user-card" @click="goToProfile">
    <el-card>
      <div class="user-content">
        <el-avatar :size="64" :src="user.avatar || defaultAvatar" />
        <div class="user-info">
          <h3 class="username">{{ user.username || '未知用户' }}</h3>
          <p class="bio">{{ user.bio || '这个用户很懒，还没有填写简介' }}</p>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-value">{{ user.followers || 0 }}</span>
              <span class="stat-label">关注者</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ user.posts || 0 }}</span>
              <span class="stat-label">美食帖</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ user.reviews || 0 }}</span>
              <span class="stat-label">点评</span>
            </div>
          </div>
        </div>
        <el-button
            v-if="!isCurrentUser"
            :type="user.isFollowing ? 'success' : 'primary'"
            @click.stop="handleFollow"
            :loading="followLoading"
        >
          {{ user.isFollowing ? '已关注' : '关注' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'UserCard',
  props: {
    user: {
      type: Object,
      required: true,
      validator(value) {
        // Basic validation to ensure required fields exist
        return value && value.id;
      }
    }
  },
  setup(props) {
    const router = useRouter()
    const store = useStore()
    const followLoading = ref(false)
    const defaultAvatar = '/path/to/default/avatar.png' // Add a default avatar path

    const isCurrentUser = computed(() => {
      return store.state.user?.id === props.user.id
    })

    const goToProfile = () => {
      if (props.user && props.user.id) {
        router.push(`/profile/${props.user.id}`)
      }
    }

    const handleFollow = async () => {
      try {
        followLoading.value = true

        // Implement follow/unfollow logic
        const action = props.user.isFollowing ? 'unfollowUser' : 'followUser'

        await store.dispatch(action, props.user.id)

        // You might want to update the local user state or emit an event
        // to notify parent components about the change
      } catch (error) {
        console.error('Failed to toggle follow status:', error)
        // Consider adding error handling or user feedback here
      } finally {
        followLoading.value = false
      }
    }

    return {
      isCurrentUser,
      goToProfile,
      handleFollow,
      followLoading,
      defaultAvatar
    }
  }
}
</script>

<style scoped>
.user-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.user-card:hover {
  transform: translateY(-2px);
}

.user-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  flex: 1;
}

.username {
  margin: 0 0 4px;
  font-size: 16px;
  color: #333;
}

.bio {
  margin: 0 0 8px;
  font-size: 14px;
  color: #666;
}

.stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
}
</style>