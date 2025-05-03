<template>
  <div class="post-editor">
    <h2>{{ isEditMode ? '编辑帖子' : '创建新帖子' }}</h2>
    <el-form :model="post" :rules="rules" ref="postForm" label-width="120px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="post.title" />
      </el-form-item>

      <el-form-item label="封面图" prop="coverImage">
        <el-upload
          class="upload-demo"
          action=""
          :show-file-list="false"
          :on-change="handleImageChange"
          :before-upload="beforeUpload"
        >
          <el-button size="small" type="primary">上传封面图</el-button>
          <div v-if="post.coverImage" class="image-preview">
            <el-image :src="post.coverImage" fit="cover" />
          </div>
        </el-upload>
      </el-form-item>

      <el-form-item label="标签" prop="tagIds">
        <el-select v-model="post.tagIds" multiple filterable placeholder="请选择标签" style="width: 100%;">
          <el-option v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="内容" prop="content">
        <el-input type="textarea" v-model="post.content" rows="10" />
      </el-form-item>

      <el-form-item label="可见性" prop="visibility">
        <el-select v-model="post.visibility" placeholder="请选择可见性">
          <el-option label="公开" value="PUBLIC" />
          <el-option label="仅好友" value="FRIENDS_ONLY" />
          <el-option label="私密" value="PRIVATE" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitPost">{{ isEditMode ? '保存修改' : '发布' }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import api from '@/services/api'

export default {
  name: 'PostEditor',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const isEditMode = !!route.params.id

    const post = ref({
      title: '',
      coverImage: '',
      content: '',
      tagIds: [],
      visibility: 'PUBLIC'
    })

    const tagList = ref([])

    const rules = {
      title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
      coverImage: [{ required: true, message: '请上传封面图', trigger: 'change' }],
      content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
      tagIds: [{ required: true, message: '请至少选择一个标签', trigger: 'change' }],
      visibility: [{ required: true, message: '请选择可见性', trigger: 'change' }]
    }

    const fetchPost = async () => {
      try {
        const data = await api.get(`/posts/${route.params.id}`);
        post.value.title = data.title;
        post.value.coverImage = data.coverImage;
        post.value.content = data.content;
        post.value.tagIds = data.tags.map(tag => tag.id);
        post.value.visibility = data.visibility || 'PUBLIC';
      } catch (error) {
        ElMessage.error('获取帖子失败');
      }
    };

    const fetchTags = async () => {
      try {
        const data = await api.get('/tags');
        tagList.value = data;
      } catch (error) {
        ElMessage.error('获取标签失败');
      }
    };


    const submitPost = async () => {
      try {
        const user = store.state.user
        if (!user) {
          ElMessage.warning('请先登录')
          router.push('/login')
          return
        }

        post.value.userId = user.id

        if (isEditMode) {
          await api.put(`/posts/${route.params.id}`, post.value)
          ElMessage.success('帖子已更新')
        } else {
          await api.post('/posts', post.value)
          ElMessage.success('帖子已发布')
        }
        router.push('/posts')
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }

    const handleImageChange = (file) => {
      post.value.coverImage = file.raw ? URL.createObjectURL(file.raw) : ''
    }

    const beforeUpload = (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        ElMessage.error('上传图片格式不正确')
      }
      return isImage
    }

    onMounted(() => {
      fetchTags()
      if (isEditMode) {
        fetchPost()
      }
    })

    return {
      post,
      rules,
      submitPost,
      handleImageChange,
      beforeUpload,
      isEditMode,
      tagList
    }
  }
}
</script>

<style scoped>
.post-editor {
  padding: 20px;
}

.image-preview {
  margin-top: 10px;
}
</style>
