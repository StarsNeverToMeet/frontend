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
        <el-table-column prop="userId" label="用户ID" width="120" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="type" label="类型" width="100" >
          <template #default="scope">
            {{ getUserTypeText(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="phoneNumber" label="电话" width="150" />
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
      <el-form-item label="用户ID" v-if="isEditing">
        <el-input v-model="form.userId" disabled />
      </el-form-item>
      <el-form-item label="账号" required>
        <el-input v-model="form.accountNumber" :disabled="isEditing" />
      </el-form-item>
      <el-form-item label="密码" required v-if="!isEditing">
        <el-input v-model="form.password" type="password" />
      </el-form-item>
      <el-form-item label="姓名" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="电话" required>
        <el-input v-model="form.phoneNumber" />
      </el-form-item>
      <el-form-item label="类型" required>
        <el-select v-model="form.type">
          <el-option label="学生" value="student" />
          <el-option label="教师" value="teacher" />
          <el-option label="管理员" value="administrator" />
        </el-select>
      </el-form-item>
      <el-form-item label="院系" required v-if="form.type === 'student' || form.type === 'teacher'">
        <el-select v-model="form.deptName">
          <el-option
              v-for="dept in departmentList"
              :key="dept.deptName"
              :label="dept.deptName"
              :value="dept.deptName"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="学分" required v-if="form.type === 'student'">
        <el-input-number v-model="form.totCred" :min="0" />
      </el-form-item>
      <el-form-item label="薪资" required v-if="form.type === 'teacher'">
        <el-input-number v-model="form.salary" :min="0" />
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
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

// 导入相关DTO
interface UserDTO {
  userId: number;
  accountNumber: string;
  personalInforId: number;
  type: 'student' | 'teacher' | 'administrator';
  name: string;
  phoneNumber: string;
  picture: string;
}
/*
interface StudentDTO extends UserDTO {
  deptName: string;
  totCred: number;
}

interface TeacherDTO extends UserDTO {
  deptName: string;
  salary: number;
}

interface AdministratorDTO extends UserDTO {
  // 仅继承UserDTO的属性
}
*/
interface DepartmentDTO {
  deptName: string;
  campus: string;
}

// 扩展表单类型以包含所有可能的字段
interface UserFormDTO extends UserDTO {
  deptName?: string;
  totCred?: number;
  salary?: number;
  password?: string;
}

// 状态定义
const userList = ref<UserDTO[]>([]);
const departmentList = ref<DepartmentDTO[]>([]);
const searchKeyword = ref('');
const dialogVisible = ref(false);
const isEditing = ref(false);
const form = ref<UserFormDTO>({
  userId: 0,
  accountNumber: '',
  personalInforId: 0,
  type: 'student',
  name: '',
  phoneNumber: '',
  picture: '',
  password: ''
});

// 页面加载时获取用户列表和院系列表
onMounted(async () => {
  try {
    // 获取用户列表
    const userResponse = await axios.get('/api/users');
    userList.value = userResponse.data;

    // 获取院系列表
    const departmentResponse = await axios.get('/api/departments');
    departmentList.value = departmentResponse.data;
  } catch (error) {
    console.error('获取数据失败', error);
    // 使用默认数据以演示目的
    userList.value = [
      { userId: 1, accountNumber: 'S001', personalInforId: 1, type: 'student', name: '张三', phoneNumber: '13800138000', picture: '' },
      { userId: 2, accountNumber: 'T001', personalInforId: 2, type: 'teacher', name: '李老师', phoneNumber: '13900139000', picture: '' },
    ];

    departmentList.value = [
      { deptName: '计算机科学与技术', campus: '中心校区' },
      { deptName: '数学', campus: '中心校区' }
    ];
  }
});

const filteredUserList = computed(() => {
  if (!searchKeyword.value) return userList.value;
  const keyword = searchKeyword.value.toLowerCase();
  return userList.value.filter(user =>
      user.userId.toString().includes(keyword) ||
      user.name.toLowerCase().includes(keyword) ||
      user.accountNumber.toLowerCase().includes(keyword)
  );
});

const getUserTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    "ROLE_STUDENT": '学生',
    'role_teacher': '教师',
    'role_admin': '管理员'
  };
  return typeMap[type] || type;
};

const openAddDialog = () => {
  isEditing.value = false;
  form.value = {
    userId: 0,
    accountNumber: '',
    personalInforId: 0,
    type: 'student',
    name: '',
    phoneNumber: '',
    picture: '',
    password: '',
    deptName: departmentList.value.length > 0 ? departmentList.value[0].deptName : '',
    totCred: 0,
    salary: 0
  };
  dialogVisible.value = true;
};

const openEditDialog = (item: UserDTO) => {
  isEditing.value = true;

  // 复制基本用户信息
  form.value = { ...item };

  // 根据用户类型获取额外信息
  if (item.type === 'student') {
    fetchStudentInfo(item.userId);
  } else if (item.type === 'teacher') {
    fetchTeacherInfo(item.userId);
  }

  dialogVisible.value = true;
};

const fetchStudentInfo = async (userId: number) => {
  try {
    const response = await axios.get(`/api/students/${userId}`);
    const studentData = response.data;
    form.value.deptName = studentData.deptName;
    form.value.totCred = studentData.totCred;
  } catch (error) {
    console.error('获取学生信息失败', error);
    // 默认值
    form.value.deptName = departmentList.value.length > 0 ? departmentList.value[0].deptName : '';
    form.value.totCred = 0;
  }
};

const fetchTeacherInfo = async (userId: number) => {
  try {
    const response = await axios.get(`/api/teachers/${userId}`);
    const teacherData = response.data;
    form.value.deptName = teacherData.deptName;
    form.value.salary = teacherData.salary;
  } catch (error) {
    console.error('获取教师信息失败', error);
    // 默认值
    form.value.deptName = departmentList.value.length > 0 ? departmentList.value[0].deptName : '';
    form.value.salary = 0;
  }
};

const saveUser = async () => {
  if (!form.value.accountNumber || !form.value.name ||
      (!form.value.password && !isEditing.value) ||
      !form.value.type) {
    ElMessage.warning('请填写完整信息');
    return;
  }

  // 检查特定类型需要的额外字段
  if ((form.value.type === 'student' || form.value.type === 'teacher') && !form.value.deptName) {
    ElMessage.warning('请选择院系');
    return;
  }

  if (form.value.type === 'student' && form.value.totCred === undefined) {
    ElMessage.warning('请填写学分');
    return;
  }

  if (form.value.type === 'teacher' && form.value.salary === undefined) {
    ElMessage.warning('请填写薪资');
    return;
  }

  try {
    if (isEditing.value) {
      // 更新用户信息
      await updateUser();
    } else {
      // 创建新用户
      await createUser();
    }

    dialogVisible.value = false;
    await refreshUserList();
    ElMessage.success(isEditing.value ? '修改成功' : '添加成功');
  } catch (error) {
    console.error('保存失败', error);
    ElMessage.error('操作失败，请重试');
  }
};

const createUser = async () => {
  // 表单验证已在 saveUser 方法中处理

  // 根据您提供的学生创建后端逻辑 (student.setPassword("默认密码");)，
  // 我们假设教师和管理员的创建接口也会在后端设置默认密码。
  // 因此，前端表单中的密码字段将不会在这些“单一接口调用”的创建场景中传递。
  // 如果您的教师/管理员后端接口需要前端提供密码，则需要在下面的 payload 中添加 password 字段。

  if (form.value.type === 'student') {
    const studentPayload = {
      name: form.value.name,
      phoneNumber: form.value.phoneNumber,
      picture: form.value.picture || '',
      accountNumber: form.value.accountNumber,
      deptName: form.value.deptName,
      totCred: form.value.totCred ?? 0
      // 后端将设置默认密码和用户类型
    };
    await axios.post('/api/students', studentPayload);
  } else if (form.value.type === 'teacher') {
    // 假设: POST /api/teachers 现在处理完整的教师创建流程
    const teacherPayload = {
      name: form.value.name,
      phoneNumber: form.value.phoneNumber,
      picture: form.value.picture || '',
      accountNumber: form.value.accountNumber,
      deptName: form.value.deptName,
      salary: form.value.salary ?? 0
      // 假设后端将设置默认密码和用户类型
    };
    await axios.post('/api/teachers', teacherPayload);
  } else if (form.value.type === 'administrator') {
    // 假设: POST /api/administrators 现在处理完整的管理员创建流程
    const adminPayload = {
      name: form.value.name,
      phoneNumber: form.value.phoneNumber,
      picture: form.value.picture || '',
      accountNumber: form.value.accountNumber
      // 假设后端将设置默认密码和用户类型
    };
    await axios.post('/api/administrators', adminPayload);
  }
};

const updateUser = async () => {
  // 1. 更新个人信息
  await axios.put(`/api/personal-information/${form.value.personalInforId}`, {
    personalInforId: form.value.personalInforId,
    name: form.value.name,
    phoneNumber: form.value.phoneNumber,
    picture: form.value.picture || ''
  });

  // 2. 根据类型更新特定用户信息
  if (form.value.type === 'student') {
    await axios.put(`/api/students/${form.value.userId}`, {
      userId: form.value.userId,
      deptName: form.value.deptName,
      totCred: form.value.totCred || 0
    });
  } else if (form.value.type === 'teacher') {
    await axios.put(`/api/teachers/${form.value.userId}`, {
      userId: form.value.userId,
      deptName: form.value.deptName,
      salary: form.value.salary || 0
    });
  }
};

const refreshUserList = async () => {
  try {
    const response = await axios.get('/api/users');
    userList.value = response.data;
  } catch (error) {
    console.error('刷新用户列表失败', error);
  }
};

const deleteUser = (item: UserDTO) => {
  ElMessageBox.confirm(
      `确定要删除用户 "${item.name}" 吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      // 删除用户 (后端应该级联删除关联的信息)
      await axios.delete(`/api/users/${item.userId}`);
      await refreshUserList();
      ElMessage.success('删除成功');
    } catch (error) {
      console.error('删除失败', error);
      ElMessage.error('删除失败，请重试');
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};
</script>