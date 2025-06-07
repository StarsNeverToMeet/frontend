<template>
  <div v-if="showTeacherSection">
    <div>
      <div class="header">
        <h1>成绩查询与分析</h1>
        <div class="actions">
          <el-input v-model="searchKeyword" placeholder="搜索课程名称或ID" />
        </div>
      </div>

      <el-card>
        <el-table
            :data="filteredCourses"
            border
            style="width: 100%"
            @expand-change="handleCourseExpand"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <el-table
                  :data="getCourseStudentRanks(row.courseId)"
                  border
                  style="width: 100%; margin-top: 20px;"
              >
                <el-table-column prop="rank" label="排名" />
                <el-table-column prop="studentId" label="学号" />
                <el-table-column prop="studentName" label="姓名"  />
                <el-table-column prop="score" label="成绩"  />
                <el-table-column prop="gpa" label="绩点" />
              </el-table>
              <div class="chart-container">
                <div :id="'course-chart-' + row.courseId" style="width: 50%; height: 400px;"></div>
                <div :id="'score-dist-' + row.courseId" style="width: 50%; height: 400px;"></div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="courseId" label="课程ID" width="120"></el-table-column>
          <el-table-column prop="courseName" label="课程名称"></el-table-column>
          <el-table-column prop="average" label="平均分" width="100"></el-table-column>
          <el-table-column prop="gpa" label="平均GPA" width="100"></el-table-column>
          <el-table-column prop="totalStudents" label="修读人数" width="100"></el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>

  <div v-if="showStudentSection">
    <div class="header">
      <h1>成绩查询与分析-生</h1>
      <div class="actions">
        <el-input v-model="studentSearchKeyword" placeholder="搜索课程名称或ID" />
      </div>
    </div>

    <el-card>
      <div class="student-stats">
        <el-statistic title="总学分" :value="studentStats.totalCredits"></el-statistic>
        <el-statistic title="平均分" :value="studentStats.averageScore.toFixed(2)"></el-statistic>
        <el-statistic title="GPA" :value="studentStats.gpa.toFixed(2)"></el-statistic>
      </div>

      <el-table
          :data="filteredStudentGrades"
          border
          style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="courseId" label="课程ID"></el-table-column>
        <el-table-column prop="courseName" label="课程名称"></el-table-column>
        <el-table-column prop="score" label="成绩" width="100"></el-table-column>
        <el-table-column prop="credits" label="学分" width="100"></el-table-column>
        <el-table-column prop="gpa" label="绩点" width="100"></el-table-column>
        <el-table-column prop="semester" label="学期" width="150"></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import "../assets/pages_styles.css";
import { ref, computed, onMounted } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';

// 定义GradeAnalyzeDTO相关接口
interface StudentRankDTO {
  rank: number;
  studentId: number;
  studentName: string;
  score: number;
  gpa: number;
}

interface CourseStatsDTO {
  courseId: number;
  courseName: string;
  average: number;
  gpa: number;
  totalStudents: number;
  scores: number[];
  teacherId: number;
}

interface StudentStatsDTO {
  totalCredits: number;
  averageScore: number;
  gpa: number;
}

interface StudentGradeDTO {
  courseId: number;
  courseName: string;
  score: number;
  credits: number;
  gpa: number;
  semester: string;
}


// 存储图表实例的Map
const chartInstances = new Map();

const showTeacherSection = ref(false);
const showStudentSection = ref(false);
const type = ref<string|null>(null);
const teacherId = ref<number|null>(null);
const studentId = ref<number|null>(null);
// 搜索关键词
const searchKeyword = ref('');
const studentSearchKeyword = ref('');


// 存储数据
const courseStats = ref<CourseStatsDTO[]>([]);
const studentGrades = ref<StudentGradeDTO[]>([]);
const studentRanks = ref<Map<number, StudentRankDTO[]>>(new Map());

// 页面加载时获取数据
onMounted(async () => {
  try {
    // 获取特定教师的课程统计数据
    type.value = await getCurrentUserType();
    if (type.value === "ROLE_TEACHER") {
      showTeacherSection.value = true;
      teacherId.value = await getCurrentUserId();
      if (teacherId.value) {
        const courseStatsResponse = await axios.get(`/api/courses/stats/${teacherId.value}`);
        courseStats.value = courseStatsResponse.data;
      } else {
        console.warn('当前教师ID未设置，无法加载课程统计数据。');
        courseStats.value = [];
      }
    }

    if(type.value === "ROLE_STUDENT") {
      showStudentSection.value = true;
      studentId.value = await getCurrentUserId();
      if (studentId.value) {
        await fetchStudentGrades(studentId.value);
      }
    }
  } catch (error) {
    console.error('获取数据失败', error);
  }
});


// 获取学生成绩详情
const fetchStudentGrades = async (studentId: number) => {
  try {
    const response = await axios.get(`/api/grades/student/${studentId}/details`);
    studentGrades.value = response.data;
  } catch (error) {
    console.error(`获取学生 ${studentId} 成绩失败`, error);
    studentGrades.value = [];

  }
};

// 计算属性
const filteredCourses = computed(() => {
  return courseStats.value
      .filter(c =>
          c.courseId.toString().includes(searchKeyword.value.toLowerCase()) ||
          c.courseName.toLowerCase().includes(searchKeyword.value.toLowerCase())
      );
});

const filteredStudentGrades = computed(() => {
  if (!studentId.value) return [];
  return studentGrades.value
      .filter(record =>
          record.courseId.toString().includes(studentSearchKeyword.value.toLowerCase()) ||
          record.courseName.toLowerCase().includes(studentSearchKeyword.value.toLowerCase())
      );
});

const studentStats = computed<StudentStatsDTO>(() => {
  if (!studentId.value || studentGrades.value.length === 0) {
    return { totalCredits: 0, averageScore: 0, gpa: 0 };
  }
  const totalCredits = studentGrades.value.reduce((sum, cur) => sum + cur.credits, 0);
  const weightedScore = studentGrades.value.reduce((sum, cur) => sum + cur.score * cur.credits, 0);
  const weightedGPA = studentGrades.value.reduce((sum, cur) => sum + cur.gpa * cur.credits, 0);
  return {
    totalCredits,
    averageScore: totalCredits > 0 ? weightedScore / totalCredits : 0,
    gpa: totalCredits > 0 ? weightedGPA / totalCredits : 0
  };
});

// 获取课程学生成绩排名
const getCourseStudentRanks = (courseId: number): StudentRankDTO[] | undefined => {
  if (studentRanks.value.has(courseId)) {
    return studentRanks.value.get(courseId);
  }
  fetchCourseStudentRanks(courseId);
  return studentRanks.value.get(courseId);
};

// 获取课程学生排名
const fetchCourseStudentRanks = async (courseId: number) => {
  try {
    const response = await axios.get(`/api/courses/${courseId}/student-ranks`);
    studentRanks.value.set(courseId, response.data);
  } catch (error) {
    console.error(`获取课程 ${courseId} 学生排名失败`, error);
  }
};

// 图表处理
const handleCourseExpand = (row: CourseStatsDTO, expandedRows: CourseStatsDTO[]) => {
  const isExpanded = expandedRows.some(expandedRow => expandedRow.courseId === row.courseId);
  if (isExpanded) {
    // 确保在 DOM 更新后渲染图表
    setTimeout(() => {
      renderCourseCharts(row);
    }, 0);
  } else {
    destroyCharts(row.courseId);
  }
};

const renderCourseCharts = (course: CourseStatsDTO) => {
  const courseChartDom = document.getElementById('course-chart-' + course.courseId);
  const scoreDistDom = document.getElementById('score-dist-' + course.courseId);

  if (courseChartDom && !chartInstances.has('course-chart-' + course.courseId)) {
    const courseChart = echarts.init(courseChartDom);
    const option = {
      title: { text: `${course.courseName} - 成绩概览` },
      tooltip: {},
      legend: { data:['平均分', '平均GPA'] },
      xAxis: { data: ["统计"] },
      yAxis: [
        { type: 'value', name: '分数', min: 0, max: 100 },
        { type: 'value', name: 'GPA', min: 0, max: 5, position: 'right'}
      ],
      series: [
        { name: '平均分', type: 'bar', data: [course.average.toFixed(2)], yAxisIndex: 0 },
        { name: '平均GPA', type: 'bar', data: [course.gpa.toFixed(2)], yAxisIndex: 1 }
      ]
    };
    courseChart.setOption(option);
    chartInstances.set('course-chart-' + course.courseId, courseChart);
  }

  if (scoreDistDom && !chartInstances.has('score-dist-' + course.courseId)) {
    const scoreDistChart = echarts.init(scoreDistDom);
    const bins = [0, 60, 70, 80, 90, 100];
    const labels = ['<60', '60-69', '70-79', '80-89', '90-100'];
    const histogramData = new Array(labels.length).fill(0);
    course.scores.forEach(score => {
      for (let i = 0; i < bins.length - 1; i++) {
        if (score >= bins[i] && score < bins[i+1]) {
          histogramData[i]++;
          break;
        }
      }
      if (score === 100) { // 特殊处理满分
        histogramData[labels.length -1]++;
      }
    });

    const option = {
      title: { text: `${course.courseName} - 分数分布` },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value', name: '学生人数' },
      series: [{ name: '人数', type: 'bar', data: histogramData }]
    };
    scoreDistChart.setOption(option);
    chartInstances.set('score-dist-' + course.courseId, scoreDistChart);
  }
};

const destroyCharts = (courseId: number) => {
  const courseChartInstance = chartInstances.get('course-chart-' + courseId);
  if (courseChartInstance) {
    courseChartInstance.dispose();
    chartInstances.delete('course-chart-' + courseId);
  }
  const scoreDistInstance = chartInstances.get('score-dist-' + courseId);
  if (scoreDistInstance) {
    scoreDistInstance.dispose();
    chartInstances.delete('score-dist-' + courseId);
  }
};

// 在组件卸载时清理所有图表实例
import { onBeforeUnmount } from 'vue';
import {getCurrentUserId, getCurrentUserType} from "../function/CurrentUser.ts";
onBeforeUnmount(() => {
  chartInstances.forEach(chart => {
    chart.dispose();
  });
  chartInstances.clear();
});

</script>