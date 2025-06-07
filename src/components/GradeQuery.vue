<template>
  <div>
    <div class="header">
      <h1>成绩查询与分析</h1>
      <div class="actions">
        <el-input v-model="searchKeyword" placeholder="输入课程ID或课程名称"></el-input>
      </div>
    </div>

    <el-card>
      <el-table
          :data="filteredGrades"
          border
          style="width: 100%"
          @expand-change="handleExpandChange"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div
                :id="'chart-' + row.courseId"
                style="width: 100%; height: 400px; padding: 20px;"
            ></div>
          </template>
        </el-table-column>

        <el-table-column prop="courseId" label="课程ID"></el-table-column>
        <el-table-column prop="courseName" label="课程名称"></el-table-column>
        <el-table-column v-for="task in taskTypes" :key="task" :label="task">
          <template #default="{ row }">
            {{ getTaskScore(row, task) }}
          </template>
        </el-table-column>
        <el-table-column label="总分">
          <template #default="{ row }">
            {{ calculateTotalScore(row.tasks) }}分
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import "../assets/pages_styles.css";
import { ref, computed, onBeforeUnmount, onMounted } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';
import { getCurrentUserId } from "../function/CurrentUser.ts";

// 定义GradeQueryDTO相关接口
interface GradeTaskDTO {
  name: string;     // 对应type，中文名称
  score: number;    // 对应grade
  weight: number;   // 对应proportion
}

interface GradeQueryDTO {
  courseId: number;
  courseName: string;
  tasks: GradeTaskDTO[];
}

// 定义原始数据格式
interface GradeDTO {
  gradeId: number;
  takesId: number;
  grade: number;
  proportion: number;
  type: 'attending' | 'homework' | 'test';
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
}

const gradeList = ref<GradeQueryDTO[]>([]);
const searchKeyword = ref('');
const chartInstances = new Map();

// 计算所有任务类型
const taskTypes = computed(() => {
  const types = new Set<string>();
  gradeList.value.forEach(grade => {
    grade.tasks.forEach(task => types.add(task.name));
  });
  return Array.from(types);
});

// 过滤课程列表
const filteredGrades = computed(() => {
  if (!searchKeyword.value) return gradeList.value;
  const keyword = searchKeyword.value.toLowerCase();
  return gradeList.value.filter(grade =>
      grade.courseId.toString().toLowerCase().includes(keyword) ||
      grade.courseName.toLowerCase().includes(keyword));
});
// 页面加载时获取成绩数据
onMounted(async () => {
  try {
    const studentId = await getCurrentUserId();
    console.log('Current studentId before API call:', studentId);
    console.log('Type of studentId:', typeof studentId);

    // 获取学生的成绩数据
    const gradeResponse = await axios.get(`/api/grades/student/${studentId}`);
    const gradesData: GradeDTO[] = gradeResponse.data;

    // 按课程分组转换数据
    const coursesMap = new Map<number, GradeQueryDTO>();

    gradesData.forEach(grade => {
      if (!coursesMap.has(grade.courseId)) {
        coursesMap.set(grade.courseId, {
          courseId: grade.courseId,
          courseName: grade.courseName,
          tasks: []
        });
      }

      const taskName = translateTaskType(grade.type);

      coursesMap.get(grade.courseId)!.tasks.push({
        name: taskName,
        score: grade.grade,
        weight: grade.proportion
      });
    });

    gradeList.value = Array.from(coursesMap.values());
  } catch (error) {
    console.error('获取成绩数据失败', error);
  }
});

const translateTaskType = (type: 'attending' | 'homework' | 'test'): string => {
  const typeMap: Record<string, string> = {
    'attending': '出勤成绩',
    'homework': '作业成绩',
    'test': '测试成绩'
  };
  return typeMap[type] || type;
};

const calculateTotalScore = (tasks: GradeTaskDTO[]) => {
  if (!tasks || tasks.length === 0) return 0;
  return tasks.reduce((total, task) => total + (task.score * task.weight), 0).toFixed(2);
};

const getTaskScore = (row: GradeQueryDTO, taskName: string) => {
  const task = row.tasks.find(t => t.name === taskName);
  return task ? `${task.score}分 (${task.weight * 100}%)` : '-';
};

// 处理展开行事件
const handleExpandChange = (row: GradeQueryDTO, expandedRows: GradeQueryDTO[]) => {
  if (expandedRows.includes(row)) {
    setTimeout(() => {
      renderChart(row);
    }, 0);
  } else {
    destroyChart(row);
  }
};

// 渲染图表
const renderChart = (row: GradeQueryDTO) => {
  const container = document.getElementById(`chart-${row.courseId}`);
  if (!container) return;

  // 销毁已有实例
  if (chartInstances.has(row.courseId)) {
    chartInstances.get(row.courseId).dispose();
  }

  // 准备图表数据
  const totalScore = calculateTotalScore(row.tasks);
  const data = row.tasks.map(task => ({
    name: task.name,
    value: ((task.score * task.weight * 100) / Number(totalScore)).toFixed(2)
  }));

  // 初始化图表
  const chart = echarts.init(container);
  const option = {
    title: {
      text: '成绩构成分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '成绩构成',
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {d}%'
        }
      }
    ]
  };

  chart.setOption(option);
  chartInstances.set(row.courseId, chart);
};

// 销毁图表
const destroyChart = (row: GradeQueryDTO) => {
  if (chartInstances.has(row.courseId)) {
    chartInstances.get(row.courseId).dispose();
    chartInstances.delete(row.courseId);
  }
};

// 组件卸载前清理图表
onBeforeUnmount(() => {
  chartInstances.forEach(chart => chart.dispose());
  chartInstances.clear();
});
</script>