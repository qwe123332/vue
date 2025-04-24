<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>登录 TastySphere</h2>
      <el-form ref="loginFormRef" :model="loginForm" :rules="rules">
        <el-form-item prop="email">
          <el-input
              v-model="loginForm.email"
              placeholder="用户名"
              prefix-icon="el-icon-user"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              prefix-icon="el-icon-lock"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" block>
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

export default {
  name: "Login",
  setup() {
    const store = useStore();
    const router = useRouter();
    const loginFormRef = ref(null);
    const loginForm = reactive({
      email: "",
      password: "",
    });
    const loading = ref(false);

    const rules = {
      email: [{ required: true, message: "请输入用户名", trigger: "blur" }],
      password: [{ required: true, message: "请输入密码", trigger: "blur" }],
    };

    const handleLogin = () => {
      // 调用表单验证
      loginFormRef.value.validate(async (valid) => {
        if (!valid) return;
        loading.value = true;
        try {
          await store.dispatch("login", loginForm);
          router.push("/");
        } catch (error) {
          // 处理登录失败的情况
          if (error.response?.status === 401) {
            ElMessage.error("用户名或密码错误");
          } else if (error.response?.status === 403) {
            ElMessage.error("没有权限访问该资源");
          } else if (error.response?.status === 500) {
            ElMessage.error("服务器错误，请稍后再试");
          } else {
            ElMessage.error("登录失败，请检查网络连接");
          }
          ElMessage.error(error.response?.data?.message || "登录失败");
        } finally {
          loading.value = false;
        }
      });
    };

    return {
      loginFormRef,
      loginForm,
      rules,
      loading,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
}
</style>