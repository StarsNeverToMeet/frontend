import { createWebHistory, createRouter } from "vue-router";
import Login from "../components/Login.vue"
import InformationManage from "../components/InformationManage.vue";
import CourseManage from "../components/CourseManage.vue";
import GradeQuery from "../components/GradeQuery.vue";
import GradeModify from "../components/GradeModify.vue";
import GradeAnalyze from "../components/GradeAnalyze.vue";

const routes = [
    { path: '/', redirect: '/login' },
    { path: "/login", component: Login},
    { path: "/information-manage", component: InformationManage },
    { path: "/course-manage", component: CourseManage },
    { path: "/grade-query", component: GradeQuery },
    { path: "/grade-modify", component: GradeModify },
    { path: "/grade-analyze", component: GradeAnalyze }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router;