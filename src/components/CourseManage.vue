<template>
    <div>
        <div class="header">
            <h1>课程基本信息管理</h1>
            <div class="actions">
                <el-button type="primary" @click="openAddDialog">添加课程</el-button>
                <el-input v-model="searchKeyword" placeholder="输入课程ID或课程名称"></el-input>
            </div>
        </div>
        
        <el-card>
            <el-table :data="filteredCourses" border style="width: 100%">
                <el-table-column prop="courseId" label="课程ID"></el-table-column>
                <el-table-column prop="courseName" label="课程名称"></el-table-column>
                <el-table-column prop="courseDescription" label="课程描述"></el-table-column>
                <el-table-column prop="courseCredits" label="课程学分"></el-table-column>
                <el-table-column prop="courseCapacity" label="课程容量"></el-table-column>">
                <el-table-column label="操作">
                    <template #default="{ row }">
                        <el-button type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button type="danger" @click="deleteCourse(row.courseId)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑课程信息' : '添加课程信息'" width="600px">
        <el-form :model="form" label-width="80px">
            <el-form-item label="课程ID" required>
                <el-input v-model="form.courseId"></el-input>
            </el-form-item>
            <el-form-item label="课程名称" required>
                <el-input v-model="form.courseName"></el-input>
            </el-form-item>
            <el-form-item label="课程描述" required>
                <el-input v-model="form.courseDescription"></el-input>
            </el-form-item>
            <el-form-item label="课程学分" required>
                <el-input v-model="form.courseCredits"></el-input>
            </el-form-item>
            <el-form-item label="课程容量" required>
                <el-input v-model="form.courseCapacity"></el-input>
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
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Course {
    courseId: string
    courseName: string
    courseDescription: string
    courseCredits: number
    courseCapacity: number
}

const courseList = ref<Course[]>([
    { courseId: 'CS101', courseName: '计算机科学导论', courseDescription: '计算机科学的基础课程', courseCredits: 3, courseCapacity: 100 },
    { courseId: 'CS102', courseName: '数据结构', courseDescription: '学习数据结构的基本概念', courseCredits: 4, courseCapacity: 80 },
]);

const searchKeyword = ref('');
const dialogVisible = ref(false);
const isEditing = ref(false);
const form = ref<Course>({ courseId: '', courseName: '', courseDescription: '', courseCredits: 0, courseCapacity: 0 });

const filteredCourses = computed(() => {
    if (!searchKeyword.value) return courseList.value;
    const keyword = searchKeyword.value.toLowerCase();
    return courseList.value.filter(course => 
        course.courseId.toLowerCase().includes(keyword) || 
        course.courseName.toLowerCase().includes(keyword) ||
        course.courseDescription.toLowerCase().includes(keyword));
});

const openAddDialog = () => {
    form.value = { courseId: '', courseName: '', courseDescription: '', courseCredits: 0, courseCapacity: 0 };
    isEditing.value = false;
    dialogVisible.value = true;
};

const openEditDialog = (course: Course) => {
    isEditing.value = true;
    form.value = { ...course };
    dialogVisible.value = true;
}

const saveCourse = () => {
    if (!form.value.courseId || !form.value.courseName || !form.value.courseDescription || form.value.courseCredits <= 0 || form.value.courseCapacity <= 0) {
        ElMessage.warning('请填写完整信息');
        return;
    }
    if (isEditing.value) {
        const index = courseList.value.findIndex(course => course.courseId === form.value.courseId);
        if (index !== -1) {
            courseList.value[index] = { ...form.value };
            ElMessage.success('课程信息已更新');
        } else {
            ElMessage.error('课程ID不存在');
        }
    } else {
        const exists = courseList.value.some(course => course.courseId === form.value.courseId);
        if (exists) {
            ElMessage.error('课程ID已存在');
            return;
        }
        courseList.value.push({ ...form.value });
        ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
}

const deleteCourse = (courseId: string) => {
    ElMessageBox.confirm(`确定要删除课程 "${courseId}" 吗？`, '提示', {
        type: 'warning',
    }).then(() => {
        const index = courseList.value.findIndex(course => course.courseId === courseId);
        if (index !== -1) {
            courseList.value.splice(index, 1);
            ElMessage.success('删除成功');
        } else {
            ElMessage.error('课程ID不存在');
        }
    }).catch(() => {
        ElMessage.info('已取消删除操作');
    });
};
</script>

