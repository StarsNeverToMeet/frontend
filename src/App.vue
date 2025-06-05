<template>
  <el-container class="layout">
    <el-aside class="sidebar">
      <h2>信息管理子系统</h2>
      <el-menu
          active-text-color="#fff"
          background-color="transparent"
          text-color="#fff"
          :default-active="route.path"
      >
        <el-menu-item index="1">
          <router-link to="/information-manage">用户信息管理</router-link>
        </el-menu-item>
        <el-menu-item index="2">
          <router-link to="/course-manage">课程基本信息管理</router-link>
        </el-menu-item>
        <el-sub-menu index = "3" proper-offset = "0">
          <template #title>成绩管理</template>
          <el-menu-item index="3-1">
            <router-link to="/grade-query">成绩查询</router-link>
          </el-menu-item>
          <el-menu-item index="3-2">
            <router-link to="/grade-modify">成绩修改</router-link>
          </el-menu-item>
          <el-menu-item index="3-3">
            <router-link to ="/grade-analyze">成绩分析</router-link>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="top-bar">
        <el-dropdown trigger="click" @visible-change="handleDropdown">
          <div class="user-area">
            <el-avatar :size="36" :src="form.picture || 'https://i.pravatar.cc/40'" />
            <span class="username">{{ username }}</span>
            <el-icon :class="['arrow', { 'rotate-180': dropdownVisible }]">
              <arrow-down />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openEditDialog(form)">编辑个人信息</el-dropdown-item>
              <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="page-container">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- 编辑个人信息对话框 -->
  <el-dialog title="编辑个人信息" v-model="dialogVisible" width="30%">
    <el-form :model="form" label-width="80px">
      <el-form-item label="用户ID" required>
        <el-input v-model="form.userId" disabled />
      </el-form-item>
      <el-form-item label="姓名" required>
        <el-input v-model="form.name" disabled/>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" disabled>
          <el-option label="学生" value="student" />
          <el-option label="教师" value="teacher" />
          <el-option label="管理员" value="administrator" />
        </el-select>
      </el-form-item>
      <el-form-item label="电话" required>
        <el-input v-model="form.phoneNumber"/>
      </el-form-item>
      <el-form-item label="头像">
        <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit=1
        >
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveUser">保存</el-button>
    </template>
  </el-dialog>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { useUserStore } from "./store/user.ts";

// 导入用户DTO
interface UserDTO {
  userId: number;
  accountNumber: string;
  personalInforId: number;
  type: 'student' | 'teacher' | 'administrator';
  name: string;
  phoneNumber: string;
  picture: string;
}

// 个人信息DTO
interface PersonalInfoDTO {
  personalInforId: number;
  name: string;
  phoneNumber: string;
  picture: string;
}

const form = ref<UserDTO>({
  userId: 0,
  accountNumber: '',
  personalInforId: 0,
  type: 'student',
  name: '',
  phoneNumber: '',
  picture: ''
})

const route = useRoute();
const username = ref('')
const dropdownVisible = ref(false)
const dialogVisible = ref(false)

// 页面加载时获取当前用户信息
onMounted(async () => {
  try {
    // 实际项目中，应该从session或localStorage获取当前用户ID，
    // 或者调用专门的getCurrentUser API
    const response = await axios.get('/api/user/current')
    const userData = response.data
    form.value = userData
    username.value = userData.name
  } catch (error) {
    console.error('获取用户信息失败', error)
    // 使用默认数据以演示目的
    form.value = {
      userId: 1,
      accountNumber: 'S001',
      personalInforId: 1,
      type: 'student',
      name: '张三',
      phoneNumber: '13800138000',
      picture: ''
    }
    username.value = '张三'
  }
})

const handleDropdown = (visible: boolean) => {
  dropdownVisible.value = visible
}

const openEditDialog = (item: UserDTO) => {
  form.value = { ...item }
  dialogVisible.value = true
}

const saveUser = async () => {
  try {
    // 准备个人信息数据
    const personalInfo: PersonalInfoDTO = {
      personalInforId: form.value.personalInforId,
      name: form.value.name,
      phoneNumber: form.value.phoneNumber,
      picture: form.value.picture
    }

    // 发送更新请求
    await axios.put(`/api/personal-information/${form.value.personalInforId}`, personalInfo)

    dialogVisible.value = false
    alert('保存成功')
  } catch (error) {
    console.error('保存失败', error)
    alert('保存失败，请重试')
  }
}

const logout = () => {
  alert('退出登录');
  useUserStore().logout();
}
</script>

<style scoped>
/* 样式保持不变 */
.layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar {
  width: 240px !important;
  background: linear-gradient(180deg, #0d47a1, #1565c0);
  box-shadow: 2px 0 8px #00000026;
}

.sidebar h2 {
  color: white;
  padding: 20px;
  margin: 0;
  font-size: 20px;
}

.top-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background: white;
  border-bottom: 1px solid #ddd;
  height: 60px;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 15px;
  color: #333;
}

.arrow {
  transition: transform 0.2s;
}

.rotate-180 {
  transform: rotate(180deg);
}

.page-container {
  background-color: #f5f5f5;
  padding: 20px;
}

.el-menu-item a {
  color: inherit;
  text-decoration: none;
  display: block;
  /*width: 100%;*/
}

body .el-table th.gutter{
  display: table-cell!important;
}
</style>