<template>
    <div>
      <div class="header">
        <h1>成绩查询与分析-师</h1>
        <div class = "actions">
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

      <div class="header">
        <h1>成绩查询与分析-生</h1>
        <div class = "actions">
        <el-input v-model="searchKeyword" placeholder="搜索课程名称或ID" />
        </div>
      </div>
      
      <el-card>
        <div class="student-stats">
          <el-statistic title="总学分" :value="studentStats.totalCredits"></el-statistic>
          <el-statistic title="平均分" :value="studentStats.averageScore"></el-statistic>
          <el-statistic title="GPA" :value="studentStats.gpa"></el-statistic>
        </div>
        
        <el-table 
          :data="filteredStudents" 
          border 
          style="width: 100%; margin-top: 20px;"
        >
          <el-table-column prop="courseId" label="课程ID"></el-table-column>
          <el-table-column prop="courseName" label="课程名称"></el-table-column>
          <el-table-column prop="score" label="成绩" width="100"></el-table-column>
          <el-table-column prop="credits" label="学分" width="100"></el-table-column>
          <el-table-column prop="gpa" label="绩点" width="100"></el-table-column>
        </el-table>
      </el-card>


    </div>
  </template>
  
  <script setup lang="ts">
  import "../assets/pages_styles.css";
  import { ref, computed, onBeforeUnmount } from 'vue';
  import * as echarts from 'echarts';
  
  interface Course {
    courseId: string;
    courseName: string;
    scores: number[];
    credits: number;
    tasks: {
      name: string;
      weight: number;
    }[];
  }
  
  interface StudentGrade {
    courseId: string;
    courseName: string;
    score: number;
    credits: number;
    gpa: number;
  }
  
  // 示例数据
  const courses = ref<Course[]>([
    {
      courseId: 'CS101',
      courseName: '计算机科学导论',
      credits: 3,
      scores: [85, 92, 78, 88, 95, 82, 90, 75, 85, 91],
      tasks: [
        { name: '作业', weight: 0.3 },
        { name: '考试', weight: 0.7 }
      ]
    },
    {
      courseId: 'CS102',
      courseName: '数据结构',
      credits: 4,
      scores: [78, 85, 88, 92, 75, 80, 85, 90, 82, 87],
      tasks: [
        { name: '实验', weight: 0.4 },
        { name: '考试', weight: 0.6 }
      ]
    }
  ]);
  
  const studentGrades = ref<StudentGrade[]>([
    { courseId: 'CS101', courseName: '计算机科学导论', score: 92, credits: 3, gpa: 4.0 },
    { courseId: 'CS102', courseName: '数据结构', score: 88, credits: 4, gpa: 3.7 },
    { courseId: 'MATH201', courseName: '高等数学', score: 85, credits: 5, gpa: 3.3 }
  ]);
  
  const searchKeyword = ref('');
  const chartInstances = new Map();
  
  // 课程分析计算属性
  const filteredCourses = computed(() => {
    return courses.value.filter(c => 
      c.courseId.includes(searchKeyword.value) ||
      c.courseName.includes(searchKeyword.value))
      .map(course => ({
        ...course,
        average: (course.scores.reduce((a,b) => a + b, 0)) / course.scores.length,
        gpa: calculateCourseGPA(course.scores),
        totalStudents: course.scores.length
      }));
  });
  
  // 学生分析计算属性
  const filteredStudents = computed(() => {
    return studentGrades.value.filter(s => 
      s.courseId.includes(searchKeyword.value) ||
      s.courseName.includes(searchKeyword.value));
  });
  
  const studentStats = computed(() => {
    const totalCredits = studentGrades.value.reduce((sum, cur) => sum + cur.credits, 0);
    const totalScore = studentGrades.value.reduce((sum, cur) => sum + cur.score, 0);
    const totalGPA = studentGrades.value.reduce((sum, cur) => sum + cur.gpa * cur.credits, 0);
    
    return {
      totalCredits,
      averageScore: totalScore / studentGrades.value.length,
      gpa: totalGPA / totalCredits
    };
  });
  
  // 工具函数
  const calculateCourseGPA = (scores: number[]) => {
    const avg = scores.reduce((a,b) => a + b, 0) / scores.length;
    return (avg / 100) * 4;
  };
  /*
  const scoreToGPA = (score: number) => {
    if (score >= 90) return 4.0;
    if (score >= 85) return 3.7;
    if (score >= 82) return 3.3;
    if (score >= 78) return 3.0;
    if (score >= 75) return 2.7;
    return 2.0;
  };*/
  
  // 图表处理
  const handleCourseExpand = (row: Course, expandedRows: Course[]) => {
    if (expandedRows.includes(row)) {
      setTimeout(() => {
        renderCourseCharts(row);
      }, 0);
    } else {
      destroyCharts(row.courseId);
    }
  };
  
  const renderCourseCharts = (course: Course) => {
    renderPieChart(course);
    renderBarChart(course);
  };
  
  const renderPieChart = (course: Course) => {
    const container = document.getElementById(`course-chart-${course.courseId}`);
    if (!container) return;
  
    const chart = echarts.init(container);
    const option = {
      title: { text: '成绩分布', left: 'center' },
      tooltip: { trigger: 'item' },
      series: [{
        name: '成绩分布',
        type: 'pie',
        radius: '60%',
        data: [
          { value: course.scores.filter(s => s >= 90).length, name: '优秀' },
          { value: course.scores.filter(s => s >= 80 && s < 90).length, name: '良好' },
          { value: course.scores.filter(s => s >= 70 && s < 80).length, name: '中等' },
          { value: course.scores.filter(s => s < 70).length, name: '及格' }
        ]
      }]
    };
    chart.setOption(option);
    chartInstances.set(`course-chart-${course.courseId}`, chart);
  };
  
  const renderBarChart = (course: Course) => {
    const container = document.getElementById(`score-dist-${course.courseId}`);
    if (!container) return;
  
    const chart = echarts.init(container);
    const option = {
      title: { text: '分数段分布', left: 'center' },
      xAxis: {
        type: 'category',
        data: ['<60', '60-70', '70-80', '80-90', '90-100']
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: [
          course.scores.filter(s => s < 60).length,
          course.scores.filter(s => s >= 60 && s < 70).length,
          course.scores.filter(s => s >= 70 && s < 80).length,
          course.scores.filter(s => s >= 80 && s < 90).length,
          course.scores.filter(s => s >= 90).length
        ]
      }]
    };
    chart.setOption(option);
    chartInstances.set(`score-dist-${course.courseId}`, chart);
  };
  
  const destroyCharts = (courseId: string) => {
    [`course-chart-${courseId}`, `score-dist-${courseId}`].forEach(id => {
      if (chartInstances.has(id)) {
        chartInstances.get(id).dispose();
        chartInstances.delete(id);
      }
    });
  };
  
  onBeforeUnmount(() => {
    chartInstances.forEach(chart => chart.dispose());
    chartInstances.clear();
  });
  </script>
  
