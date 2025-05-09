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
  import { ref, computed, onBeforeUnmount } from 'vue';
  import * as echarts from 'echarts';
  
  interface Grade {
    courseId: string;
    courseName: string;
    tasks: {
      name: string;
      score: number;
    }[];
  }
  
  // 示例数据
  const gradeList = ref<Grade[]>([
    {
      courseId: 'CS101',
      courseName: '计算机科学导论',
      tasks: [
        { name: '平时作业', score: 91 },
        { name: '期中考试', score: 85 },
        { name: '期末考试', score: 88 },
        { name: '课程项目', score: 95 }
      ],
    },
    {
      courseId: 'CS102',
      courseName: '数据结构',
      tasks: [
        { name: '平时作业', score: 88 },
        { name: '期中考试', score: 90 },
        { name: '期末考试', score: 82 },
        { name: '实验报告', score: 95 }
      ],
    }
  ]);

  const calculateTotalScore = (tasks: { score: number }[]) => {
    return tasks.reduce((total, task) => total + task.score, 0);
  };
  
  // 获取所有任务类型（假设任务类型一致）
  const taskTypes = computed(() => {
    const types = new Set<string>();
    gradeList.value.forEach(grade => {
      grade.tasks.forEach(task => types.add(task.name));
    });
    return Array.from(types);
  });
  
  const searchKeyword = ref('');
  const chartInstances = new Map();
  
  const filteredGrades = computed(() => {
    if (!searchKeyword.value) return gradeList.value;
    const keyword = searchKeyword.value.toLowerCase();
    return gradeList.value.filter(grade => 
      grade.courseId.toLowerCase().includes(keyword) ||
      grade.courseName.toLowerCase().includes(keyword));
  });
  
  const getTaskScore = (row: Grade, taskName: string) => {
    const task = row.tasks.find(t => t.name === taskName);
    return task ? `${task.score}分` : '-';
  };
  
  const handleExpandChange = (row: Grade, expandedRows: Grade[]) => {
    if (expandedRows.includes(row)) {
      setTimeout(() => {
        renderChart(row);
      }, 0);
    } else {
      destroyChart(row);
    }
  };
  
  const renderChart = (row: Grade) => {
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
      value: ((task.score / totalScore) * 100).toFixed(2)
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
  
  const destroyChart = (row: Grade) => {
    if (chartInstances.has(row.courseId)) {
      chartInstances.get(row.courseId).dispose();
      chartInstances.delete(row.courseId);
    }
  };
  
  onBeforeUnmount(() => {
    chartInstances.forEach(chart => chart.dispose());
    chartInstances.clear();
  });
  </script>
  
