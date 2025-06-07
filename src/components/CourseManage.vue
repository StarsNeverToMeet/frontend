<template>
  <div>
    <div class="header">
      <h1>课程基本信息管理</h1>
      <div class="actions">
        <el-button v-if="isAdmin" type="primary" @click="openAddDialog">添加课程</el-button>
        <el-input v-model="searchKeyword" placeholder="输入课程ID或课程名称"></el-input>
      </div>
    </div>

    <el-card>
      <el-table :data="filteredCourses" border style="width: 100%">
        <el-table-column prop="courseId" label="课程ID"></el-table-column>
        <el-table-column prop="title" label="课程名称"></el-table-column>
        <el-table-column prop="courseIntroduction" label="课程描述"></el-table-column>
        <el-table-column prop="credits" label="课程学分"></el-table-column>
        <el-table-column prop="capacity" label="课程容量"></el-table-column>
        <el-table-column prop="deptName" label="所属院系"></el-table-column>
        <el-table-column prop="requiredRoomType" label="教室类型要求"></el-table-column>
        <el-table-column label="操作" v-if="isAdmin">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteCourse(row.courseId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>

  <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑课程信息' : '添加课程信息'" width="600px">
    <el-form :model="form" label-width="100px">
      <el-form-item label="课程ID" v-if="isEditing">
        <el-input v-model="form.courseId" disabled></el-input>
      </el-form-item>
      <el-form-item label="课程名称" required>
        <el-input v-model="form.title"></el-input>
      </el-form-item>
      <el-form-item label="所属院系" required>
        <el-select v-model="form.deptName" style="width: 100%">
          <el-option
              v-for="dept in departmentList"
              :key="dept.deptName"
              :label="dept.deptName"
              :value="dept.deptName"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="课程描述" required>
        <el-input v-model="form.courseIntroduction" type="textarea"></el-input>
      </el-form-item>
      <el-form-item label="课程学分" required>
        <el-input-number v-model="form.credits" :min="0" :max="10"></el-input-number>
      </el-form-item>
      <el-form-item label="课程容量" required>
        <el-input-number v-model="form.capacity" :min="1" :max="300"></el-input-number>
      </el-form-item>
      <el-form-item label="教室类型要求" required>
        <el-input v-model="form.requiredRoomType"></el-input>
      </el-form-item>
      <el-form-item label="年级" required>
        <el-input-number v-model="form.gradeYear" :min="1" :max="4"></el-input-number>
      </el-form-item>
      <el-form-item label="学时" required>
        <el-input-number v-model="form.period" :min="2" :max="5"></el-input-number>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveCourse">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import "../assets/pages_styles.css";
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import {getCurrentUserType} from "../function/CurrentUser.ts";

// 导入相关DTO
interface CourseDTO {
  courseId: number;
  title: string;
  deptName: string;
  credits: number;
  courseIntroduction: string;
  capacity: number;
  requiredRoomType: string;
  gradeYear: number;
  period: number;
}

interface DepartmentDTO {
  deptName: string;
  campus: string;
}

// 状态定义
const isAdmin = ref(false);
const courseList = ref<CourseDTO[]>([]);
const departmentList = ref<DepartmentDTO[]>([]);
const searchKeyword = ref('');
const dialogVisible = ref(false);
const isEditing = ref(false);
const form = ref<CourseDTO>({
  courseId: 0,
  title: '',
  deptName: '',
  credits: 0,
  courseIntroduction: '',
  capacity: 0,
  requiredRoomType: '普通教室',
  gradeYear: 1,
  period: 1
});

// 页面加载时获取课程列表和院系列表
onMounted(async () => {
  try {
    const userType = await getCurrentUserType();
    if (userType === "ROLE_ADMIN") {
      isAdmin.value = true;
    }
    // 获取课程列表
    const courseResponse = await axios.get('/api/courses');
    courseList.value = courseResponse.data;
    // 获取院系列表
    const departmentResponse = await axios.get('/api/departments');
    departmentList.value = departmentResponse.data;


  } catch (error) {
    console.error('获取数据失败', error);

  }
});

const filteredCourses = computed(() => {
  if (!searchKeyword.value) return courseList.value;
  const keyword = searchKeyword.value.toLowerCase();
  return courseList.value.filter(course =>
      course.courseId.toString().includes(keyword) ||
      course.title.toLowerCase().includes(keyword) ||
      course.courseIntroduction.toLowerCase().includes(keyword));
});

const openAddDialog = () => {
  isEditing.value = false;
  form.value = {
    courseId: 0,
    title: '',
    deptName: departmentList.value.length > 0 ? departmentList.value[0].deptName : '',
    credits: 0,
    courseIntroduction: '',
    capacity: 0,
    requiredRoomType: '普通教室',
    gradeYear: 1,
    period: 1
  };
  dialogVisible.value = true;
};

const openEditDialog = (course: CourseDTO) => {
  isEditing.value = true;
  form.value = { ...course };
  dialogVisible.value = true;
}

const saveCourse = async () => {
  if (!form.value.title || !form.value.deptName || !form.value.courseIntroduction ||
      form.value.credits <= 0 || form.value.capacity <= 0 ||
      !form.value.requiredRoomType || form.value.gradeYear < 1 || form.value.period < 1) {
    ElMessage.warning('请填写完整信息');
    return;
  }

  try {
    if (isEditing.value) {
      // 更新课程
      await axios.put(`/api/courses/${form.value.courseId}`, form.value);
      const index = courseList.value.findIndex(course => course.courseId === form.value.courseId);
      if (index !== -1) {
        courseList.value[index] = { ...form.value };
      }
      ElMessage.success('课程信息已更新');
    } else {
      // 创建课程
      const response = await axios.post('/api/courses', form.value);
      const newCourse = response.data;
      courseList.value.push(newCourse);
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
  } catch (error) {
    console.error('保存失败', error);
    ElMessage.error('操作失败，请重试');
  }
}

const deleteCourse = (courseId: number) => {
  ElMessageBox.confirm(`确定要删除课程 ID: "${courseId}" 吗？`, '提示', {
    type: 'warning',
  }).then(async () => {
    try {
      await axios.delete(`/api/courses/${courseId}`);
      courseList.value = courseList.value.filter(course => course.courseId !== courseId);
      ElMessage.success('删除成功');
    } catch (error) {
      console.error('删除失败', error);
      ElMessage.error('删除失败，请重试');
    }
  }).catch(() => {
    ElMessage.info('已取消删除操作');
  });
};
</script>