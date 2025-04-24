<template>
    <div class="create-post">
        <el-row justify="center">
            <el-col :span="16">
                <el-card class="post-form">
                    <h2>{{ isEdit ? '编辑帖子' : '创建新帖子' }}</h2>
                    
                    <el-form :model="postForm" :rules="rules" ref="formRef">
                        <el-form-item prop="title">
                            <el-input
                                v-model="postForm.title"
                                placeholder="请输入标题"
                                maxlength="100"
                                show-word-limit
                            />
                        </el-form-item>

                        <el-form-item prop="content">
                            <el-input
                                v-model="postForm.content"
                                type="textarea"
                                :rows="6"
                                placeholder="请输入内容"
                                maxlength="2000"
                                show-word-limit
                            />
                        </el-form-item>

                        <el-form-item label="上传图片">
                            <el-upload
                                v-model:file-list="fileList"
                                action="/api/upload"
                                list-type="picture-card"
                                :on-success="handleUploadSuccess"
                                :on-remove="handleRemove"
                                :before-upload="beforeUpload"
                            >
                                <el-icon><Plus /></el-icon>
                            </el-upload>
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" @click="submitForm">发布</el-button>
                          <el-button @click="saveDraft">保存草稿</el-button>
                          <el-button @click="cancel">取消</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import { Plus } from '@element-plus/icons-vue'

export default {
    name: 'CreatePost',
    components: { Plus },
    setup() {
        const store = useStore()
        const router = useRouter()
        const route = useRoute()
        const formRef = ref(null)
        const fileList = ref([])

        const isEdit = computed(() => route.params.id !== undefined)

        const postForm = reactive({
            title: '',
            content: '',
            images: []
        })

        const rules = {
            title: [
                { required: true, message: '请输入标题', trigger: 'blur' },
                { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
            ],
            content: [
                { required: true, message: '请输入内容', trigger: 'blur' },
                { min: 10, max: 2000, message: '内容长度在 10 到 2000 个字符', trigger: 'blur' }
            ]
        }

        // 如果是编辑模式，获取帖子数据
        const fetchPost = async () => {
            if (isEdit.value) {
                try {
                    const { data } = await api.get(`/posts/${route.params.id}`)
                    postForm.title = data.title
                    postForm.content = data.content
                    postForm.images = data.images
                    if (data.images) {
                        fileList.value = data.images.map((url, index) => ({
                            name: `image-${index}`,
                            url
                        }))
                    }
                } catch (error) {
                    ElMessage.error('获取帖子数据失败')
                    await router.push('/posts')
                }
            }
        }
      const saveDraft = async () => {
        try {
          await api.post('/posts/drafts', {
            title: postForm.title,
            content: postForm.content,
            images: postForm.images
          })
          ElMessage.success('草稿保存成功')
        } catch (e) {
          ElMessage.error('草稿保存失败')
        }
      }

      const handleUploadSuccess = (response) => {
            postForm.images.push(response.url)
        }

        const handleRemove = (file) => {
            const index = fileList.value.indexOf(file)
            if (index !== -1) {
                postForm.images.splice(index, 1)
            }
        }

        const beforeUpload = (file) => {
            const isImage = file.type.startsWith('image/')
            const isLt5M = file.size / 1024 / 1024 < 5

            if (!isImage) {
                ElMessage.error('只能上传图片文件！')
                return false
            }
            if (!isLt5M) {
                ElMessage.error('图片大小不能超过 5MB！')
                return false
            }
            return true
        }

        const submitForm = async () => {
            if (!formRef.value) return

            await formRef.value.validate(async (valid) => {
                if (valid) {
                    try {
                        if (isEdit.value) {
                            await api.put(`/posts/${route.params.id}`, postForm)
                            ElMessage.success('更新成功')
                        } else {
                            await api.post('/posts', postForm)
                            ElMessage.success('发布成功')
                        }
                        await router.push('/posts')
                    } catch (error) {
                        ElMessage.error(isEdit.value ? '更新失败' : '发布失败')
                    }
                }
            })
        }

        const cancel = () => {
            router.back()
        }

        onMounted(() => {
            if (!store.state.user) {
                ElMessage.warning('请先登录')
                router.push('/login')
                return
            }
            fetchPost()
        })

        return {
            formRef,
            postForm,
            rules,
            fileList,
            isEdit,
            handleUploadSuccess,
            handleRemove,
            beforeUpload,
            submitForm,
            cancel
        }
    }
}
</script>

<style scoped>
.create-post {
    padding: 20px;
}

.post-form {
    margin-bottom: 40px;
}

h2 {
    margin-bottom: 20px;
    color: #333;
}

.el-form-item {
    margin-bottom: 20px;
}
</style>