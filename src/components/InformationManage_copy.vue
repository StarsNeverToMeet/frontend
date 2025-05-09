<template>
  <div>
    <div class="header">
      <h1>用户信息管理</h1>
      <el-button type="primary" @click="openAddDialog">
        添加用户
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table :data="classroomList" border style="width: 100%;">
        <el-table-column prop="id" label="教室编号" width="180" />
        <el-table-column prop="campus" label="校区" />
        <el-table-column prop="capacity" label="容量" />
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button size="small" type="primary" @click="openEditDialog(scope.row)">修改</el-button>
            <el-button size="small" type="danger" @click="deleteClassroom(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加 / 修改教室弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '修改教室' : '添加教室'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="教室编号">
          <el-input v-model="form.id" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="校区">
          <el-input v-model="form.campus" />
        </el-form-item>
        <el-form-item label="容量">
          <el-input v-model="form.capacity" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveClassroom">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  
  interface Classroom {
    id: string;
    campus: string;
    capacity: number;
  }
  
  const classroomList = ref<Classroom[]>([
    { id: '东二101', campus: '紫金港', capacity: 50 },
    { id: '东二202', campus: '紫金港', capacity: 80 },
  ]);
  
  const dialogVisible = ref(false);
  const isEditing = ref(false);
  const form = ref<Classroom>({ id: '', campus: '', capacity: 0 });
  
  // 打开添加弹窗
  const openAddDialog = () => {
    isEditing.value = false;
    form.value = { id: '', campus: '', capacity: 0 };
    dialogVisible.value = true;
  };
  
  // 打开修改弹窗
  const openEditDialog = (item: Classroom) => {
    isEditing.value = true;
    form.value = { ...item }; 
    dialogVisible.value = true;
  };
  
  // 保存教室（添加或修改）
  const saveClassroom = () => {
    if (!form.value.id || !form.value.campus || !form.value.capacity) {
      ElMessage.warning('请填写完整信息');
      return;
    }
    if (isEditing.value) {
      const index = classroomList.value.findIndex(item => item.id === form.value.id);
      if (index !== -1) {
        classroomList.value[index] = { ...form.value };
        ElMessage.success('修改成功');
      }
    } else {
      const exists = classroomList.value.some(item => item.id === form.value.id);
      if (exists) {
        ElMessage.error('教室编号已存在');
        return;
      }
      classroomList.value.push({ ...form.value });
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
  };
  
  // 删除教室
  const deleteClassroom = (item: Classroom) => {
  ElMessageBox.confirm(
    `确定要删除教室 "${item.id}" 吗？`, // 弹窗内容
    '提示', // 弹窗标题
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 用户点击了确认
    classroomList.value = classroomList.value.filter(c => c.id !== item.id);
    ElMessage.success('删除成功');
  }).catch(() => {
    // 用户点击了取消
    ElMessage.info('已取消删除');
  });
  };
  </script>
  
  <style scoped>
  .resource-manage {
    background-color: #f5f7fa;
    min-height: calc(100vh - 100px); /* 页面高度拉开，避免太空 */
    padding: 40px 60px;
    box-sizing: border-box;
  }
  
  /* 顶部：标题+按钮 */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  
  h1 {
    font-size: 28px;
    font-weight: bold;
    color: #0d47a1;
    margin: 0;
  }
  
  /* 表格外面的卡片 */
  .table-card {
    padding: 20px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  
  /* 表格行高调整，舒适一些 */
  .el-table th, .el-table td {
    height: 50px;
  }
  </style>  