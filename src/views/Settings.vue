<template>
  <div class="settings">
    <h2>账户设置</h2>
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
      <el-form-item label="新密码" prop="newPassword">
        <el-input type="password" v-model="newPassword" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input type="password" v-model="confirmPassword" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="updateSettings">保存修改</el-button>
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
  name: 'Settings',
  setup() {
    const store = useStore()
    const userInfo = ref({
      username: '',
      email: '',
      bio: ''
    })
    const newPassword = ref('')
    const confirmPassword = ref('')
    const rules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
      newPassword: [{ required: false }],
      confirmPassword: [{ required: false }]
    }

    const fetchUserInfo = async () => {
      try {
        const { data } = await api.get('/users/profile')
        userInfo.value = data
      } catch (error) {
        ElMessage.error('获取用户信息失败')
      }
    }

    const updateSettings = async () => {
      try {
        if (newPassword.value && newPassword.value !== confirmPassword.value) {
          ElMessage.error('两次输入的密码不一致')
          return
        }

        await api.put('/users/profile', {
          ...userInfo.value,
          newPassword: newPassword.value || undefined
        })
        ElMessage.success('设置已更新')
      } catch (error) {
        ElMessage.error('更新设置失败')
      }
    }

    onMounted(() => {
      fetchUserInfo()
    })

    return {
      userInfo,
      newPassword,
      confirmPassword,
      rules,
      updateSettings
    }
  }
}
</script>

<style scoped>
.settings {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
}
</style> 