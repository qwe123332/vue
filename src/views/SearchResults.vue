<template>
  <div class="search-results">
    <h2>搜索结果</h2>
    <el-input
      v-model="searchKeyword"
      placeholder="搜索美食、餐厅、用户..."
      clearable
      @keyup.enter="handleSearch"
    >
      <template #prefix>
        <el-icon class="el-input__icon">
          <search />
        </el-icon>
      </template>
    </el-input>

    <el-row :gutter="20" class="results-container">
      <el-col v-for="post in posts" :key="post.id" :span="8">
        <el-card class="result-card" @click="viewPost(post.id)">
          <el-image :src="post.coverImage" fit="cover" class="result-image" />
          <div class="result-info">
            <h4>{{ post.title }}</h4>
            <p>{{ post.description }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-pagination
      v-if="total > 0"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="handlePageChange"
      class="pagination"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'

export default {
  name: 'SearchResults',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const searchKeyword = ref(route.query.keyword || '')
    const posts = ref([])
    const total = ref(0)
    const currentPage = ref(1)
    const pageSize = ref(10)

    const fetchSearchResults = async (page = 1) => {
      try {
        const  data = await api.get('/posts/search', {
          params: {
            keyword: searchKeyword.value,
            page: page - 1,
            size: pageSize.value
          }
        })
        posts.value = data.content
        total.value = data.totalElements
        currentPage.value = page
      } catch (error) {
        ElMessage.error('获取搜索结果失败')
      }
    }

    const handleSearch = () => {
      fetchSearchResults()
    }

    const handlePageChange = (page) => {
      fetchSearchResults(page)
    }

    onMounted(() => {
      fetchSearchResults()
    })

    return {
      searchKeyword,
      posts,
      total,
      currentPage,
      pageSize,
      handleSearch,
      handlePageChange,
      viewPost: (id) => router.push(`/posts/${id}`)
    }
  }
}
</script>

<style scoped>
.search-results {
  padding: 20px;
}

.results-container {
  margin-top: 20px;
}

.result-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.result-card:hover {
  transform: translateY(-5px);
}

.result-image {
  width: 100%;
  height: 200px;
  border-radius: 4px;
}

.result-info {
  padding: 10px 0;
}

.result-info h4 {
  margin: 0 0 8px;
}

.result-info p {
  margin: 0;
  color: #666;
}
</style> 