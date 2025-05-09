<template>
    <div v-if="showTeacherSection" >
      <!-- 教师成绩管理部分 -->
      <div class="header">
        <h1>成绩管理</h1>
        <el-input v-model="searchKeyword" placeholder="输入学生或课程信息" style="width: 300px" />
      </div>
  
      <el-card>
        <el-table :data="filteredGrades" border>
          <el-table-column prop="studentId" label="学号" width="120" />
          <el-table-column prop="studentName" label="姓名" width="120" />
          <el-table-column prop="courseId" label="课程ID" width="120" />
          <el-table-column prop="courseName" label="课程名称" />
          <el-table-column prop="grade" label="成绩" width="100" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusColor[row.status]">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="openApplyDialog(row)"
                :disabled="row.status !== '已确认'"
              >
                申请修改
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- 申请修改对话框 -->
      <el-dialog v-model="applyDialogVisible" title="成绩修改申请" width="500px">
        <el-form :model="applyForm" label-width="80px">
          <el-form-item label="学生姓名">
            <el-input v-model="applyForm.studentName" disabled />
          </el-form-item>
          <el-form-item label="课程名称">
            <el-input v-model="applyForm.courseName" disabled />
          </el-form-item>
          <el-form-item label="原成绩">
            <el-input v-model="applyForm.originalGrade" disabled />
          </el-form-item>
          <el-form-item label="新成绩" prop="newGrade" required>
            <el-input-number v-model="applyForm.newGrade" :min="0" :max="100" />
          </el-form-item>
          <el-form-item label="修改理由" prop="reason" required>
            <el-input v-model="applyForm.reason" type="textarea" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="applyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApplication">提交申请</el-button>
        </template>
      </el-dialog>
  
      <!-- 管理员审核部分 -->
      <div v-if="showAdminSection">
        <div class="header">
            <h1>待审核申请</h1>
        </div>
        <el-card>
          <el-table :data="pendingApplications" border>
            <el-table-column prop="studentId" label="学号" width="120" />
            <el-table-column prop="studentName" label="姓名" width="120" />
            <el-table-column prop="courseName" label="课程" />
            <el-table-column label="成绩变化" width="120">
              <template #default="{ row }">
                {{ row.originalGrade }} → {{ row.newGrade }}
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="申请理由" />
            <el-table-column prop="applyTime" label="申请时间" width="180" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="success" size="small" @click="handleAudit(row, 'approved')">
                  通过
                </el-button>
                <el-button type="danger" size="small" @click="handleAudit(row, 'rejected')">
                  拒绝
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import "../assets/pages_styles.css";
  import { ref, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  interface Grade {
    id: string
    studentId: string
    studentName: string
    courseId: string
    courseName: string
    grade: number
    status: '已确认' | '待审核' | '已修改' | '已拒绝'
  }
  
  interface Application {
    id: string
    gradeId: string
    originalGrade: number
    newGrade: number
    reason: string
    status: 'pending' | 'approved' | 'rejected'
    applyTime: string
  }
  
  const statusColor: Record<string, string>= {
    '已确认': 'success',
    '待审核': 'warning',
    '已修改': '',
    '已拒绝': 'danger'
  }
  
  // 模拟初始数据
  const gradeList = ref<Grade[]>([
    {
      id: 'G001',
      studentId: 'S001',
      studentName: '张三',
      courseId: 'CS101',
      courseName: '计算机基础',
      grade: 85,
      status: '已确认'
    },
    {
      id: 'G002',
      studentId: 'S002',
      studentName: '李四',
      courseId: 'CS102',
      courseName: '数据结构',
      grade: 92,
      status: '已确认'
    }
  ])
  
  const applications = ref<Application[]>([])
  const searchKeyword = ref('')
  const applyDialogVisible = ref(false)
  const showAdminSection = ref(true) // 根据实际用户角色切换
  const showTeacherSection = ref(true) // 根据实际用户角色切换
  
  const applyForm = ref({
    gradeId: '',
    studentName: '',
    courseName: '',
    originalGrade: 0,
    newGrade: 0,
    reason: ''
  })
  
  // 计算属性
  const filteredGrades = computed(() => {
    return gradeList.value.filter(g =>
      g.studentName.includes(searchKeyword.value) ||
      g.courseName.includes(searchKeyword.value) ||
      g.courseId.includes(searchKeyword.value))
  })
  
  const pendingApplications = computed(() => {
    return applications.value.filter(app => app.status === 'pending')
  })
  
  // 方法
  const openApplyDialog = (grade: Grade) => {
    applyForm.value = {
      gradeId: grade.id,
      studentName: grade.studentName,
      courseName: grade.courseName,
      originalGrade: grade.grade,
      newGrade: grade.grade,
      reason: ''
    }
    applyDialogVisible.value = true
  }
  
  const submitApplication = async () => {
    if (!applyForm.value.newGrade || !applyForm.value.reason) {
      ElMessage.warning('请填写完整信息')
      return
    }
  
    const newApplication: Application = {
      id: `APP_${Date.now()}`,
      gradeId: applyForm.value.gradeId,
      originalGrade: applyForm.value.originalGrade,
      newGrade: applyForm.value.newGrade,
      reason: applyForm.value.reason,
      status: 'pending',
      applyTime: new Date().toLocaleString()
    }
  
    applications.value.push(newApplication)
    
    // 更新成绩状态
    const grade = gradeList.value.find(g => g.id === applyForm.value.gradeId)
    if (grade) grade.status = '待审核'
    
    applyDialogVisible.value = false
    ElMessage.success('申请已提交')
  }
  
  const handleAudit = (app: Application, result: 'approved' | 'rejected') => {
    ElMessageBox.confirm(`确定要${result === 'approved' ? '通过' : '拒绝'}该申请吗？`, '审核确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      app.status = result
      const grade = gradeList.value.find(g => g.id === app.gradeId)
      
      if (grade) {
        grade.status = result === 'approved' ? '已修改' : '已拒绝'
        if (result === 'approved') {
          grade.grade = app.newGrade
        }
      }
      
      ElMessage.success(`已${result === 'approved' ? '通过' : '拒绝'}申请`)
    })
  }
</script>
