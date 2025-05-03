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
      <div v-if="!keyword" class="no-results">
        请输入搜索关键词
      </div>
      <div v-else-if="!loading && total === 0" class="no-results">
        未找到与"{{ keyword }}"相关的{{ getTabName }}
      </div>

      <template v-else-if="keyword">
        <!-- 帖子结果 -->
        <div v-if="activeTab === 'all' || activeTab === 'posts'" class="result-section">
          <h2 v-if="activeTab === 'all' && postResults.length > 0">美食帖子</h2>
          <post-card v-for="item in postResults" :key="item.id" :post="item" />
          <div v-if="activeTab === 'all' && postResults.length === 0 && !loading" class="no-type-results">
            未找到相关美食帖子
          </div>
        </div>

        <!-- 餐厅结果 -->
        <div v-if="activeTab === 'all' || activeTab === 'restaurants'" class="result-section">
          <h2 v-if="activeTab === 'all' && restaurantResults.length > 0">餐厅</h2>
          <restaurant-card v-for="item in restaurantResults" :key="item.id" :restaurant="item" />
          <div v-if="activeTab === 'all' && restaurantResults.length === 0 && !loading" class="no-type-results">
            未找到相关餐厅
          </div>
        </div>

        <!-- 用户结果 -->
        <div v-if="activeTab === 'all' || activeTab === 'users'" class="result-section">
          <h2 v-if="activeTab === 'all' && userResults.length > 0">用户</h2>
          <user-card v-for="item in userResults" :key="item.id" :user="item" />
          <div v-if="activeTab === 'all' && userResults.length === 0 && !loading" class="no-type-results">
            未找到相关用户
          </div>
        </div>
      </template>

      <el-pagination
          v-if="total > pageSize && keyword"
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
    const router = useRouter()
    const loading = ref(false)
    const keyword = ref('')
    const activeTab = ref('all')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    // 保存最后一次成功的搜索结果，防止闪烁问题
    const responseData = ref({ data: {} })
    const lastSearchKeyword = ref('')
    const searchTimeout = ref(null)

    const getTabName = computed(() => {
      const tabNames = {
        all: '内容',
        posts: '美食帖子',
        restaurants: '餐厅',
        users: '用户'
      }
      return tabNames[activeTab.value]
    })

    // 简化数据结构处理
    const extractItems = (data) => {
      if (!data) return []
      if (data.items?.items) return data.items.items
      if (data.items) return data.items
      return []
    }

    const postResults = computed(() => {
      return extractItems(responseData.value.data?.posts)
    })

    const restaurantResults = computed(() => {
      return extractItems(responseData.value.data?.restaurants)
    })

    const userResults = computed(() => {
      return extractItems(responseData.value.data?.users)
    })

    // 计算当前标签页的总数
    const calculateTotal = (data, type) => {
      if (!data) return 0

      if (type === 'all') {
        // 在"全部"标签下，根据当前显示的类型计算总数
        const u = data.users?.total || 0
        const r = data.restaurants?.total || 0
        const p = data.posts?.total || 0

        // 取最大值作为分页总数，这样确保可以浏览所有类型的内容
        return Math.max(u, r, p)
      } else if (type === 'posts') {
        return data.posts?.total || 0
      } else if (type === 'restaurants') {
        return data.restaurants?.total || 0
      } else if (type === 'users') {
        return data.users?.total || 0
      }

      return 0
    }

    // 使用防抖函数避免快速连续搜索
    const debouncedSearch = (fn, delay) => {
      if (searchTimeout.value) clearTimeout(searchTimeout.value)
      searchTimeout.value = setTimeout(() => {
        fn()
        searchTimeout.value = null
      }, delay)
    }

    const fetchSearchResults = async () => {
      // 检查关键词是否存在
      if (!keyword.value) {
        // 仍然保留上一次搜索结果，但不进行新的搜索
        console.log("搜索关键词为空，不执行搜索")
        return
      }

      // 记录此次搜索的关键词
      lastSearchKeyword.value = keyword.value

      loading.value = true

      try {
        const data = await api.get('/search', {
          params: {
            keyword: keyword.value,
            type: activeTab.value,
            page: currentPage.value,
            pageSize: pageSize.value
          }
        })

        console.log('搜索结果：', data)

        // 确保当前关键词与搜索时的关键词一致，避免结果错乱
        if (keyword.value !== lastSearchKeyword.value) {
          console.log("搜索关键词已变更，忽略此次结果")
          return
        }

        if (data.code === 200) {
          // 保存完整响应数据
          responseData.value = data

          // 计算总数
          const resData = data.data
          total.value = calculateTotal(resData, activeTab.value)
        } else {
          throw new Error(data.message || '搜索失败')
        }
      } catch (error) {
        console.error('搜索失败：', error)
        ElMessage.error(error.message || '搜索请求失败，请稍后重试')
        // 不清空已有数据，只在首次搜索失败时设置空数据
        if (!responseData.value.data.posts && !responseData.value.data.restaurants && !responseData.value.data.users) {
          responseData.value = {data: {}}
        }
        total.value = 0
      } finally {
        loading.value = false
      }
    }


    const handleTabChange = () => {
      // 切换标签页时重置页码，但保留关键词
      currentPage.value = 1

      // 重新计算总数
      if (responseData.value.data) {
        total.value = calculateTotal(responseData.value.data, activeTab.value)
      }

      // 使用防抖搜索，避免频繁请求
      debouncedSearch(fetchSearchResults, 300)
    }

    const handlePageChange = (page) => {
      currentPage.value = page
      // 更新路由以便保持状态
      router.push({
        query: {
          ...route.query,
          page: page !== 1 ? page : undefined
        }
      })
      fetchSearchResults()
    }

    // 处理URL参数变化
    watch(
        () => route.query,
        (newQuery) => {
          const newKeyword = newQuery.keyword
          const newPage = parseInt(newQuery.page) || 1
          const newTab = newQuery.tab || 'all'

          // 处理关键词变化
          if (newKeyword !== keyword.value) {
            keyword.value = newKeyword || ''
            currentPage.value = 1  // 关键词变化时重置页码
          }

          // 处理页码变化
          if (newPage !== currentPage.value) {
            currentPage.value = newPage
          }

          // 处理标签页变化
          if (newTab !== activeTab.value) {
            activeTab.value = newTab
          }

          // 只有当有关键词时才执行搜索
          if (keyword.value) {
            debouncedSearch(fetchSearchResults, 300)
          } else {
            // 当关键词为空时，可以选择清空结果或保留上次结果
            // 这里选择不清空，让用户仍能看到上次搜索结果
            console.log("URL中没有关键词，保留当前结果状态")
          }
        },
        { immediate: true, deep: true }
    )

    // 组件卸载前清除定时器
    onBeforeUnmount(() => {
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
    })

    // 组件挂载后，如果URL有参数但没有触发搜索，手动执行一次搜索
    onMounted(() => {
      if (route.query.keyword && !responseData.value.data.posts && !responseData.value.data.restaurants && !responseData.value.data.users) {
        console.log("组件挂载，发现URL有关键词但无搜索结果，执行搜索")
        fetchSearchResults()
      }
    })

    return {
      loading,
      keyword,
      activeTab,
      currentPage,
      pageSize,
      total,
      responseData,
      getTabName,
      postResults,
      restaurantResults,
      userResults,
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

.result-section h2 {
  grid-column: 1 / -1;
  margin-bottom: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
}

.no-results {
  text-align: center;
  color: #909399;
  font-size: 16px;
  margin: 100px 0;
}

.no-type-results {
  grid-column: 1 / -1;
  color: #909399;
  font-size: 14px;
  padding: 20px 0;
}

:deep(.el-pagination) {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>