<template>
  <div class="search-page">
    <div class="search-filters">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="美食帖子" name="posts" />
        <el-tab-pane label="餐厅" name="restaurants" />
        <el-tab-pane label="用户" name="users" />
      </el-tabs>
    </div>

    <div class="search-results" v-loading="loading">
      <div v-if="!loading && results.length === 0" class="no-results">
        未找到与"{{ keyword }}"相关的{{ getTabName }}
      </div>

      <template v-else>
        <!-- 帖子结果 -->
        <div v-if="activeTab === 'all' || activeTab === 'posts'" class="result-section">
          <post-card v-for="item in postResults" :key="item.id" :post="item" />
        </div>

        <!-- 餐厅结果 -->
        <div v-if="activeTab === 'all' || activeTab === 'restaurants'" class="result-section">
          <restaurant-card v-for="item in restaurantResults" :key="item.id" :restaurant="item" />
        </div>

        <!-- 用户结果 -->
        <div v-if="activeTab === 'all' || activeTab === 'users'" class="result-section">
          <user-card v-for="item in userResults" :key="item.id" :user="item" />
        </div>
      </template>

      <el-pagination
        v-if="total > pageSize"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        layout="prev, pager, next"
        background
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import PostCard from '@/components/PostCard.vue'
import RestaurantCard from '@/components/RestaurantCard.vue'
import UserCard from '@/components/UserCard.vue'
import api from '@/services/api'
import { ElMessage } from 'element-plus'

export default {
  name: 'SearchView',
  components: {
    PostCard,
    RestaurantCard,
    UserCard
  },
  setup() {
    const route = useRoute()
    const loading = ref(false)
    const keyword = ref('')
    const activeTab = ref('all')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const results = ref([])

    const getTabName = computed(() => {
      const tabNames = {
        all: '内容',
        posts: '美食帖子',
        restaurants: '餐厅',
        users: '用户'
      }
      return tabNames[activeTab.value]
    })

    const postResults = computed(() => 
      results.value.filter(item => item.type === 'post'))
    const restaurantResults = computed(() => 
      results.value.filter(item => item.type === 'restaurant'))
    const userResults = computed(() => 
      results.value.filter(item => item.type === 'user'))

    const fetchSearchResults = async () => {
      if (!keyword.value) return
      
      loading.value = true
      try {
        const response = await api.get('/posts/search', {
          params: {
            keyword: keyword.value,
            type: activeTab.value,
            page: currentPage.value,
            pageSize: pageSize.value
          }

        })
        console.log('搜索结果：', response.data)

        if (response.data.code === 200) {
          results.value = response.data.data.items || []
          total.value = response.data.data.total || 0
        } else {
          throw new Error(response.data.message || '搜索失败')
        }
      } catch (error) {
        console.error('搜索失败：', error)
        ElMessage.error(error.message || '搜索请求失败，请稍后重试')
        results.value = []
        total.value = 0
      } finally {
        loading.value = false
      }
    }

    const handleTabChange = () => {
      currentPage.value = 1
      fetchSearchResults()
    }

    const handlePageChange = (page) => {
      currentPage.value = page
      fetchSearchResults()
    }

    watch(
      () => route.query.keyword,
      (newKeyword) => {
        if (newKeyword) {
          keyword.value = newKeyword
          activeTab.value = 'all'
          currentPage.value = 1
          fetchSearchResults()
        }
      },
      { immediate: true }
    )

    return {
      loading,
      keyword,
      activeTab,
      results,
      total,
      currentPage,
      pageSize,
      postResults,
      restaurantResults,
      userResults,
      getTabName,
      handleTabChange,
      handlePageChange
    }
  }
}
</script>

<style scoped>
.search-page {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

.search-filters {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.search-results {
  min-height: 400px;
}

.result-section {
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
}

.no-results {
  text-align: center;
  color: #909399;
  font-size: 16px;
  margin: 100px 0;
}

:deep(.el-pagination) {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>
