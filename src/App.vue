<template>
  <el-container class="layout">
    <el-aside class="sidebar">
      <h2>信息管理子系统</h2>
      <el-menu
        active-text-color="#fff"
        background-color="transparent"
        text-color="#fff"
        :default-active="$route.path"
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
            <el-avatar :size="36" src="https://i.pravatar.cc/40" />
            <span class="username">{{ username }}</span>
            <el-icon :class="['arrow', { 'rotate-180': dropdownVisible }]">
              <arrow-down />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item   @click="openEditDialog(form)">编辑个人信息</el-dropdown-item>
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
          <el-input v-model="form.id" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限" required>
          <el-select v-model="form.role">
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
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
import { ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'



interface User {
  id: string
  name: string
  type: 'student' | 'teacher'
  role: string
  avatar: string // 头像地址
}

const form = ref<User>(
  //后续改为从后端获取
  { id: 'S001', name: '张三', type: 'student', role: 'student', avatar: '' },
)


const username = ref('zz')
const dropdownVisible = ref(false)
const dialogVisible = ref(false)

const handleDropdown = (visible: boolean) => {
  dropdownVisible.value = visible
}

const openEditDialog = (item: User) => {
  form.value = { ...item }
  dialogVisible.value = true
}



const saveUser = () => {
  // 保存用户信息的逻辑
  dialogVisible.value = false
  alert('保存成功')
}

const logout = () => {
  alert('退出登录')
}







</script>

<style scoped>
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