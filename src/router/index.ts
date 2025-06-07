import { createWebHistory, createRouter } from "vue-router";
import Login from "../components/Login.vue"
import InformationManage from "../components/InformationManage.vue";
import CourseManage from "../components/CourseManage.vue";
import GradeQuery from "../components/GradeQuery.vue";
import GradeModify from "../components/GradeModify.vue";
import GradeAnalyze from "../components/GradeAnalyze.vue";
import { getCurrentUserId, getCurrentUserType } from "../function/CurrentUser";

const routes = [
    { path: '/', redirect: '/login' },
    { path: "/login", component: Login, meta: { } },
    { path: "/information-manage", component: InformationManage, meta: { allowedRoles: ['admin'] } },
    { path: "/course-manage", component: CourseManage, meta: { allowedRoles: ['admin', 'teacher', 'student'] } },
    { path: "/grade-query", component: GradeQuery, meta: { allowedRoles: ['student'] } },
    { path: "/grade-modify", component: GradeModify, meta: { allowedRoles: ['admin', 'teacher']} },
    { path: "/grade-analyze", component: GradeAnalyze, meta: { allowedRoles: ['teacher', 'student']} }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, from, next) => {
    try {
        const uid = await getCurrentUserId();
        const utype = await getCurrentUserType();

        console.log("U info from index.ts: ", { uid, utype });

        const isLoggedIn = (uid !== null && utype !== null);

        console.log("IsLoggedIn from index.ts:" + isLoggedIn);

        // 如果用户已登录且尝试访问登录页，则重定向到主页或一个默认页
        // 注意：您需要定义一个登录后应该跳转的 "主页" 路由，这里暂时用 '/'
        // 如果您的应用中没有一个明确的 '/' 路由作为登录后的目标，您可能需要调整
        if (isLoggedIn && to.path === '/login') {
            // 假设信息管理是 admin 的主页，课程管理是其他人的主页
            if (utype === 'ROLE_ADMIN') {
                return next({ name: 'InformationManage' }); // 或者其他 admin 专属页面
            }
            return next({ name: 'CourseManage' }); // 或者其他通用页面
        }

        // 如果用户未登录且访问的不是登录页，重定向到登录页
        if (!isLoggedIn && to.path !== '/login') {
            return next({ path: '/login', query: { redirect: to.fullPath } });
        }

        // 如果用户未登录且访问登录页，直接放行
        if (!isLoggedIn && to.path === '/login') {
            return next();
        }

        // 以下是已登录用户的权限检查逻辑
        const allowedRoles = to.matched
            .map(record => record.meta.allowedRoles)
            .filter(roles => roles && Array.isArray(roles))
            .flat();

        // 如果路由没有定义允许的角色 (例如登录页的 meta 为空或没有 allowedRoles)，且用户已登录，则允许访问
        // (已登录用户访问无特定权限要求的页面)
        if (allowedRoles.length === 0 && isLoggedIn) {
            return next();
        }

        // 如果路由没有定义允许的角色，并且用户未登录，此情况已由前面的逻辑处理

        // 将meta中的小写角色转换为大写格式进行比较 (与参考代码一致)
        const convertedRoles = allowedRoles.map((role: any) => {
            switch (role.toLowerCase()) {
                case 'admin':
                    return 'ROLE_ADMIN';
                case 'teacher':
                    return 'ROLE_TEACHER';
                case 'student':
                    return 'ROLE_STUDENT';
                default:
                    return role; // 如果不匹配，保持原样
            }
        });

        // 检查当前用户类型是否在允许的角色列表中
        if (convertedRoles.includes(utype)) {
            return next();
        } else {
            // 用户类型不匹配，重定向到来源页或显示无权限页面
            console.warn(`用户类型 ${utype} 无权访问路由 ${to.path}`);
            window.alert(`您没有权限访问此页面: ${to.path}. 将返回上一页或仪表盘。`);
            // 如果 from.path 存在且不是登录页，则返回上一页，否则返回一个安全的默认页
            if (from && from.path && from.path !== '/login' && from.path !== '/') {
                return next({ path: from.path });
            } else {
                // 根据用户类型重定向到各自的 "仪表盘" 或默认页面
                // 这里需要您根据实际应用情况来定义这些默认页面的路由 name
                if (utype === 'ROLE_ADMIN') {
                    return next({ name: 'InformationManage' }); // 假设 Admin 的默认页
                } else if (utype === 'ROLE_TEACHER') {
                    return next({ name: 'CourseManage' }); // 假设 Teacher 的默认页 (或特定仪表盘)
                } else if (utype === 'ROLE_STUDENT') {
                    return next({ name: 'GradeQuery' }); // 假设 Student 的默认页
                } else {
                    // 未知角色或无默认页，则强制登出或跳转登录
                    console.error('未知用户角色或无法确定默认页面，将重定向到登录页');
                    return next({ path: '/login' });
                }
            }
        }

    } catch (error) {
        console.error('获取用户信息失败 (index.ts):', error);
        // 如果获取用户信息失败，重定向到登录页
        return next({ path: '/login', query: { redirect: to.fullPath } });
    }
});


export default router;