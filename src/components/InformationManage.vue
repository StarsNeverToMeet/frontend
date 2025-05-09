<template>
  <div>
    <div class="header">
      <h1>用户信息管理</h1>
      <div class="actions">
        <el-button type="primary" @click="openAddDialog">添加用户</el-button>
        <el-input v-model="searchKeyword" placeholder="搜索姓名或ID" />
      </div>
    </div>
      
    <el-card>
      <el-table :data="filteredUserList" border style="width: 100%;">
        <el-table-column prop="id" label="用户ID" width="120" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="type" label="类型" width="100" >
          <template #default="scope">
            {{ scope.row.type === 'student' ? '学生' : '教师' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="权限" width="100" >
          <template #default="scope">
            {{ scope.row.role === 'admin' ? '管理员' : (scope.row.role === 'teacher' ? '教师' : '学生') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteUser(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    </div>

    <!-- 添加/编辑用户弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑用户' : '添加用户'" width="600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户ID" required>
          <el-input v-model="form.id" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型" required>
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
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">确认</el-button>
      </template>
    </el-dialog>
  
</template>
  
<script setup lang="ts">
import "../assets/pages_styles.css";
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
  role: string;
  avatar: string;//头像地址
}

const userList = ref<User[]>([
  { id: 'S001', name: '张三', type: 'student', role: 'student', avatar: '' },
  { id: 'T001', name: '李老师', type: 'teacher', role: 'admin', avatar: '' },
]);

const searchKeyword = ref('');
const dialogVisible = ref(false);
const isEditing = ref(false);
const form = ref<User>({ id: '', name: '', type: 'student', role: 'student', avatar: '' });

const filteredUserList = computed(() => {
  if (!searchKeyword.value) return userList.value;
  const keyword = searchKeyword.value.toLowerCase();
  return userList.value.filter(user => 
    user.id.toLowerCase().includes(keyword) || 
    user.name.toLowerCase().includes(keyword)
  );
});

const openAddDialog = () => {
  isEditing.value = false;
  form.value = { id: '', name: '', type: 'student', role: 'student', avatar: '' };
  dialogVisible.value = true;
};

const openEditDialog = (item: User) => {
  isEditing.value = true;
  form.value = { ...item };
  dialogVisible.value = true;
};

const saveUser = () => {
  if (!form.value.id || !form.value.name || !form.value.type || !form.value.role) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  
  if (isEditing.value) {
    const index = userList.value.findIndex(item => item.id === form.value.id);
    if (index !== -1) {
      userList.value[index] = { ...form.value };
      ElMessage.success('修改成功');
    }
  } else {
    const exists = userList.value.some(item => item.id === form.value.id);
    if (exists) {
      ElMessage.error('用户ID已存在');
      return;
    }
    userList.value.push({ ...form.value });
    ElMessage.success('添加成功');
  }
  dialogVisible.value = false;
};

const deleteUser = (item: User) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${item.name}" 吗？`,
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    userList.value = userList.value.filter(u => u.id !== item.id);
    ElMessage.success('删除成功');
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};


</script>
  
