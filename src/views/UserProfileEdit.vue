<template>
  <div class="user-profile-edit">
    <h2>编辑个人资料</h2>
    <el-form :model="userInfo" :rules="rules" ref="userForm" label-width="120px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="userInfo.username" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="userInfo.email" />
      </el-form-item>
      <el-form-item label="个人简介" prop="bio">
        <el-input type="textarea" v-model="userInfo.bio" />
      </el-form-item>
      <el-form-item label="头像" prop="avatar">
        <el-upload
          class="upload-demo"
          action=""
          :show-file-list="false"
          :on-change="handleAvatarChange"
          :before-upload="beforeUpload"
        >
          <el-button size="small" type="primary">上传头像</el-button>
          <div v-if="userInfo.avatar" class="avatar-preview">
            <el-image :src="userInfo.avatar" fit="cover" />
          </div>
        </el-upload>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="updateProfile">保存修改</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import api from '@/services/api'

export default {
  name: 'UserProfileEdit',
  setup() {
    const store = useStore()
    const userInfo = ref({
      username: '',
      email: '',
      bio: '',
      avatar: ''
    })
    const rules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }]
    }

    const fetchUserInfo = async () => {
      try {
        const data = await api.get('/users/profile')
        userInfo.value = data
      } catch (error) {
        ElMessage.error('获取用户信息失败')
      }
    }

    const updateProfile = async () => {
      try {
        await api.put('/users/profile', userInfo.value)
        ElMessage.success('个人资料已更新')
      } catch (error) {
        ElMessage.error('更新资料失败')
      }
    }

    const handleAvatarChange = (file) => {
      userInfo.value.avatar = file.raw ? URL.createObjectURL(file.raw) : ''
    }

    const beforeUpload = (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        ElMessage.error('上传图片格式不正确')
      }
      return isImage
    }

    onMounted(() => {
      fetchUserInfo()
    })

    return {
      userInfo,
      rules,
      updateProfile,
      handleAvatarChange,
      beforeUpload
    }
  }
}
</script>

<style scoped>
.user-profile-edit {
  padding: 20px;
}

.avatar-preview {
  margin-top: 10px;
}
</style> 