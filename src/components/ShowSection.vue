<template>
  <div>
    <div class="header">
      <h1>教师课程详情</h1>
    </div>

    <el-card>
      <el-table :data="courseDetailsList" border style="width: 100%">
        <el-table-column prop="sectionId" label="课程ID"></el-table-column>
        <el-table-column prop="courseName" label="课程名称"></el-table-column>
        <el-table-column prop="semester" label="学期"></el-table-column>
        <el-table-column prop="year" label="学年"></el-table-column>
        <el-table-column prop="dayOfWeek" label="上课日期"></el-table-column>
        <el-table-column prop="startTime" label="开始时间"></el-table-column>
        <el-table-column prop="endTime" label="结束时间"></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { getCurrentUserId } from '../function/CurrentUser.ts';

// 定义课程详情的数据结构
interface CourseDetailDTO {
  sectionId: number;
  courseName: string;
  semester: string;
  year: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

const courseDetailsList = ref<CourseDetailDTO[]>([]);


// 页面加载时获取课程详情数据
onMounted(async () => {
  const teacherId = await getCurrentUserId();
  if (!teacherId) {
    ElMessage.error('教师ID未找到');
    return;
  }

  try {
    const response = await axios.get(`/api/teachers/${teacherId}/course-details`);
    courseDetailsList.value = response.data;
    if (courseDetailsList.value.length === 0) {
      ElMessage.info('该教师暂无课程安排');
    }
  } catch (error) {
    console.error('获取教师课程详情失败', error);
    ElMessage.error('获取教师课程详情失败，请重试');
  }
});
</script>

<style scoped>
/* 可以从 CourseManage.vue 复制或自定义样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  align-items: center;
}

.el-input {
  margin-left: 10px;
  width: 250px; /* 根据需要调整 */
}

.el-card {
  margin-top: 20px;
}
</style>