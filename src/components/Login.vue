<template>
  <div class="login-page-container">
    <el-card class="login-form-card">
      <template #header>
        <div class="card-header-title">
          <h1>登录页面</h1>
        </div>
      </template>
      <el-form
          ref="loginFormRef"
          :model="credentials"
          :rules="loginRules"
          label-width="80px"
          @submit.prevent="handleLogin"
      >
        <el-form-item label="账号" prop="accountNumber">
          <el-input v-model="credentials.accountNumber" placeholder="请输入账号"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
              v-model="credentials.password"
              type="password"
              placeholder="请输入密码"
              show-password
              @keyup.enter="handleLogin"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%;">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { userStore } from '../store/user.ts';
import { useRoute, useRouter } from "vue-router";

const credentials = ref({
  accountNumber: '',
  password: '',
});
const loading = ref(false);
const loginFormRef = ref<FormInstance>();

const UserStore = userStore();
const router = useRouter(); // 获取 router 实例
const route = useRoute(); // 获取当前路由信息


const loginRules: FormRules = {
  accountNumber: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  try {
    await loginFormRef.value.validate();
    loading.value = true;
    const success = await UserStore.login(credentials.value);
    if (success) {
      ElMessage.success('登录成功！');
      const redirectPath = route.query.redirect as string;
      if (redirectPath && redirectPath !== '/login' && redirectPath !== '/') {
        router.push(redirectPath);
      } else {
        router.push('/');
      }
    } else {
      ElMessage.error('登录失败，请检查您的账号和密码。');
    }
  } catch (validationError) {
    console.log('Form validation failed:', validationError);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw; /* 设置宽度为100%视口宽度 */
  min-height: 100vh; /* 设置最小高度为100%视口高度 */
  background-color: #f0f2f5;
  padding: 20px; /* 内边距，确保内容不会紧贴屏幕边缘 */
  box-sizing: border-box; /* padding 和 border 不会增加元素的总宽度和高度 */
}

.login-form-card {
  width: 100%;
  max-width: 400px;
}

</style>