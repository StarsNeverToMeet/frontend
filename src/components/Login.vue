<template>
  <div>
    <div class="header">
      <h1>登录页面</h1>
    </div>
    <el-card>
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

const credentials = ref({
  accountNumber: '',
  password: '',
});
const loading = ref(false);
const loginFormRef = ref<FormInstance>();

const UserStore = userStore();

const loginRules: FormRules = {
  accountNumber: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  // validate 方法本身会返回一个 Promise，可以直接 await 它
  try {
    await loginFormRef.value.validate(); // 等待校验结果
    // 如果校验通过，会继续执行下面的代码
    loading.value = true;
    const success = await UserStore.login(credentials.value);
    if (success) {
      ElMessage.success('登录成功！');
      // 登录成功后的页面跳转由 Pinia store中的 login action 处理
      // 它会跳转到 redirectPath 或者 '/' (然后由路由配置重定向到 /login，这里需要注意)
      // 建议在 userStore.login 中，如果 redirectPath 是 '/' 或 '/login'，则默认跳转到一个已登录的页面，例如 '/information-manage'
    } else {
      // 如果 store 的 login action 返回更详细的错误信息，可以在此处显示
      ElMessage.error('登录失败，请检查您的账号和密码。');
    }
  } catch (validationError) {
    // 校验不通过时，validate 方法会 reject 一个 Promise
    // 通常 Element Plus 会自动显示校验错误信息，这里可以不作处理，或者只记录日志
    console.log('Form validation failed:', validationError);
    // ElMessage.error('请完整填写登录信息。'); // 表单校验会自动提示
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>



/* 确保按钮宽度适应el-form-item */
.el-form-item .el-button {
  width: 100%;
}
</style>