<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2>注册 TastySphere</h2>
      <el-form ref="registerFormRef" :model="registerForm" :rules="rules">
        <el-form-item prop="username">
          <el-input
              v-model="registerForm.username"
              placeholder="用户名"
              prefix-icon="el-icon-user"
              :aria-label="'Username input'"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="密码"
              prefix-icon="el-icon-lock"
              :aria-label="'Password input'"
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="确认密码"
              prefix-icon="el-icon-lock"
              :aria-label="'Confirm Password input'"
          />
        </el-form-item>
        <el-form-item prop="email">
          <el-input
              v-model="registerForm.email"
              placeholder="邮箱"
              prefix-icon="el-icon-message"
              :aria-label="'Email input'"
          />
        </el-form-item>
        <el-form-item prop="phone_number">
          <el-input
              v-model="registerForm.phone_number"
              placeholder="手机号"
              prefix-icon="el-icon-mobile-phone"
              :aria-label="'Phone Number input'"
          />
        </el-form-item>
        <el-form-item prop="agreement">
          <el-checkbox v-model="registerForm.agreement">
            我已阅读并同意
            <el-link type="primary" @click="showPrivacyDialog">《用户协议》</el-link>
            和
            <el-link type="primary" @click="showTermsDialog">《隐私政策》</el-link>
          </el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" :loading="loading" block>
            注册
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  name: 'Register',
  setup() {
    const store = useStore()
    const router = useRouter()
    const registerFormRef = ref(null)
    const registerForm = reactive({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      phone_number: '',
      agreement: false
    })
    const loading = ref(false)

    const rules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== registerForm.password) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
      ],
      phone_number: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
      ],
      agreement: [
        {
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('请阅读并同意用户协议'))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ]
    }

    const handleRegister = () => {
      // 先执行表单校验
      registerFormRef.value.validate(async (valid) => {
        if (!valid) return
        loading.value = true
        try {
          await store.dispatch('register', registerForm)
          ElMessage.success('注册成功')
          await router.push('/login')
        } catch (error) {
          ElMessage.error(error.response?.data?.message || '注册失败')
        } finally {
          loading.value = false
        }
      })
    }

    // 用户协议弹窗占位函数
    const showPrivacyDialog = () => {
      ElMessage.info('用户协议内容暂未实现')
    }
    const showTermsDialog = () => {
      ElMessage.info('隐私政策内容暂未实现')
    }

    return {
      registerFormRef,
      registerForm,
      rules,
      loading,
      handleRegister,
      showPrivacyDialog,
      showTermsDialog
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.register-card {
  width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
}
</style>
