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
      <el-form-item label="内容" prop="content">
        <el-input type="textarea" v-model="post.content" rows="10" />
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
import { ElMessage } from 'element-plus'
import api from '@/services/api'

export default {
  name: 'PostEditor',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const isEditMode = !!route.params.id
    const post = ref({
      title: '',
      coverImage: '',
      content: ''
    })
    const rules = {
      title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
      coverImage: [{ required: true, message: '请上传封面图', trigger: 'change' }],
      content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
    }

    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/posts/${route.params.id}`)
        console.log(data)
        post.value = data
      } catch (error) {
        ElMessage.error('获取帖子失败')
      }
    }

    const submitPost = async () => {
      try {
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
      isEditMode
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