<template>
  <div>
    <div class="header">
      <h1>成绩查询与分析-师</h1>
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
        <!-- 如果需要在表格中显示 teacherId，可以取消下面这行的注释 -->
        <!-- <el-table-column prop="teacherId" label="教师ID" width="100"></el-table-column> -->
      </el-table>
    </el-card>

    <div class="header">
      <h1>成绩查询与分析-生</h1>
      <div class="actions">
        <el-input v-model="studentSearchKeyword" placeholder="搜索课程名称或ID" />
        <el-select v-model="selectedStudentId" placeholder="选择学生" style="margin-left: 10px;">
          <el-option v-for="student in studentList" :key="student.userId" :label="student.name" :value="student.userId" />
        </el-select>
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
import { ref, computed, onMounted, watch } from 'vue';
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

interface StudentDTO {
  userId: number;
  name: string;
}

// 存储图表实例的Map
const chartInstances = new Map();

// 假设这是当前登录的教师ID，实际应用中应从认证信息或其它来源获取
const currentTeacherId = ref(11); // 例如，教师ID为1

// 搜索关键词
const searchKeyword = ref('');
const studentSearchKeyword = ref('');
const selectedStudentId = ref<number | null>(null);

// 存储数据
const courseStats = ref<CourseStatsDTO[]>([]);
const studentGrades = ref<StudentGradeDTO[]>([]);
const studentList = ref<StudentDTO[]>([]);
const studentRanks = ref<Map<number, StudentRankDTO[]>>(new Map());

// 页面加载时获取数据
onMounted(async () => {
  try {
    // 获取特定教师的课程统计数据
    if (currentTeacherId.value) {
      const courseStatsResponse = await axios.get(`/api/courses/stats/${currentTeacherId.value}`);
      courseStats.value = courseStatsResponse.data;
    } else {
      console.warn('当前教师ID未设置，无法加载课程统计数据。');
      courseStats.value = []; // 或者加载一些默认提示数据
    }

    // 获取学生列表 (这部分逻辑保持不变，假设学生列表与特定教师无关)
    const studentsResponse = await axios.get('/api/students');
    studentList.value = studentsResponse.data;

    // 默认选中第一个学生并获取其成绩 (这部分逻辑保持不变)
    if (studentList.value.length > 0) {
      selectedStudentId.value = studentList.value[0].userId;
      await fetchStudentGrades(selectedStudentId.value);
    }

  } catch (error) {
    console.error('获取数据失败', error);
    // 使用默认数据以演示目的
    // 注意: 默认数据也应包含 teacherId 属性
    courseStats.value = [
      {
        courseId: 101,
        courseName: '计算机科学导论',
        average: 85.5,
        gpa: 3.7,
        totalStudents: 3,
        scores: [92, 85, 80],
        teacherId: currentTeacherId.value || 1 // 确保模拟数据包含 teacherId
      },
      {
        courseId: 102,
        courseName: '数据结构',
        average: 76,
        gpa: 3.1,
        totalStudents: 3,
        scores: [88, 78, 60],
        teacherId: currentTeacherId.value || 1 // 确保模拟数据包含 teacherId
      }
    ];

    // 学生列表和学生成绩的默认数据逻辑保持不变
    studentList.value = [
      { userId: 1001, name: '张三' },
      { userId: 1002, name: '李四' },
      { userId: 1003, name: '王五' }
    ];
    if (studentList.value.length > 0 && !selectedStudentId.value) {
      selectedStudentId.value = studentList.value[0].userId;
    }
    if (selectedStudentId.value) {
      // 确保在错误回退时，如果selectedStudentId已设置，仍尝试填充模拟成绩
      await fetchStudentGrades(selectedStudentId.value);
    }
  }
});

// 监听学生选择变化
watch(selectedStudentId, (newValue) => {
  if (newValue) {
    fetchStudentGrades(newValue);
  } else {
    studentGrades.value = [];
  }
});

// 获取学生成绩详情
const fetchStudentGrades = async (studentId: number) => {
  try {
    const response = await axios.get(`/api/grades/student/${studentId}/details`);
    studentGrades.value = response.data;
  } catch (error) {
    console.error(`获取学生 ${studentId} 成绩失败`, error);
    // 使用默认数据以演示目的
    if (studentId === 1001) {
      studentGrades.value = [
        { courseId: 101, courseName: '计算机科学导论', score: 92, credits: 3, gpa: 4.8, semester: '2025春夏' },
        { courseId: 102, courseName: '数据结构', score: 88, credits: 4, gpa: 4.2, semester: '2025春夏' }
      ];
    } else if (studentId === 1002) {
      studentGrades.value = [
        { courseId: 101, courseName: '计算机科学导论', score: 85, credits: 3, gpa: 4.0, semester: '2025春夏' },
        { courseId: 102, courseName: '数据结构', score: 78, credits: 4, gpa: 3.3, semester: '2025春夏' }
      ];
    } else if (studentId === 1003) { // 假设王五的成绩
      studentGrades.value = [
        { courseId: 101, courseName: '计算机科学导论', score: 80, credits: 3, gpa: 3.6, semester: '2025春夏' },
        { courseId: 102, courseName: '数据结构', score: 60, credits: 4, gpa: 1.5, semester: '2025春夏' }
      ];
    }
    else {
      studentGrades.value = [];
    }
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
  if (!selectedStudentId.value) return [];
  return studentGrades.value
      .filter(record =>
          record.courseId.toString().includes(studentSearchKeyword.value.toLowerCase()) ||
          record.courseName.toLowerCase().includes(studentSearchKeyword.value.toLowerCase())
      );
});

const studentStats = computed<StudentStatsDTO>(() => {
  if (!selectedStudentId.value || studentGrades.value.length === 0) {
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
  // 返回默认或缓存数据, 如果API调用是异步的，这里可能立即返回undefined或旧数据
  // 可以考虑在模板中处理加载状态，或确保fetchCourseStudentRanks更新后视图能响应
  return studentRanks.value.get(courseId) || generateDefaultRanks(courseId, courseStats.value.find(c => c.courseId === courseId)?.totalStudents);
};

// 获取课程学生排名
const fetchCourseStudentRanks = async (courseId: number) => {
  try {
    const response = await axios.get(`/api/courses/${courseId}/student-ranks`);
    studentRanks.value.set(courseId, response.data);
  } catch (error) {
    console.error(`获取课程 ${courseId} 学生排名失败`, error);
    const course = courseStats.value.find(c => c.courseId === courseId);
    studentRanks.value.set(courseId, generateDefaultRanks(courseId, course?.totalStudents));
  }
};

// 生成默认排名数据（用于演示）
// 稍微修改generateDefaultRanks以接受可选的学生数量参数，使模拟数据更真实
const generateDefaultRanks = (courseId: number, totalStudents?: number): StudentRankDTO[] => {
  const defaultRanks: StudentRankDTO[] = [];
  const names = ['张三', '李四', '王五', '赵六', '孙七'];
  const studentCount = totalStudents || 3; // 如果没有提供总学生数，默认3个

  if (courseId === 101) {
    for (let i = 0; i < studentCount; i++) {
      const score = 92 - i * 7;
      defaultRanks.push({ rank: i + 1, studentId: 1001 + i, studentName: names[i % names.length] || `学生${i+1}`, score: score, gpa: Math.max(0, (score - 50)/10) });
    }
    return defaultRanks;
  } else if (courseId === 102) {
    for (let i = 0; i < studentCount; i++) {
      const score = 88 - i * 10;
      defaultRanks.push({ rank: i + 1, studentId: 1001 + i, studentName: names[i % names.length] || `学生${i+1}`, score: score, gpa: Math.max(0, (score - 50)/10) });
    }
    return defaultRanks;
  }
  return []; // 默认返回空数组
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
onBeforeUnmount(() => {
  chartInstances.forEach(chart => {
    chart.dispose();
  });
  chartInstances.clear();
});

</script>