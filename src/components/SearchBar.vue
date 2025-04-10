<template>
  <div class="search-bar">
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
    <el-button type="primary" @click="handleSearch">搜索</el-button>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

export default {
  name: 'SearchBar',
  components: {
    Search
  },
  setup() {
    const router = useRouter()
    const searchKeyword = ref('')

    const handleSearch = () => {
      if (searchKeyword.value.trim()) {
        router.push({
          path: '/search',
          query: { keyword: searchKeyword.value }
        })
      }
    }

    return {
      searchKeyword,
      handleSearch
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-input {
  flex: 1;
}
</style> 