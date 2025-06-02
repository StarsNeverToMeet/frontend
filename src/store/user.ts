import { defineStore } from 'pinia';
import axios from 'axios';
import router from '../router'; // 确保路径正确
import { ElMessage } from 'element-plus';

// 假设的用户信息接口，与您 App.vue 中的 UserDTO 类似
interface UserDTO {
    userId: number;
    accountNumber: string;
    personalInforId: number;
    type: 'student' | 'teacher' | 'administrator';
    name: string;
    phoneNumber: string;
    picture: string;
}

// Store 的 state 结构
interface UserState {
    user: UserDTO | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

export const useUserStore = defineStore('user', {
    state: (): UserState => ({
        user: null,
        token: localStorage.getItem('token') || null, // 初始化时从 localStorage 加载 token
        loading: false,
        error: null,
    }),

    getters: {
        isLoggedIn: (state) => !!state.token && !!state.user,
        currentUser: (state) => state.user,
        userType: (state) => state.user?.type,
        userName: (state) => state.user?.name || '用户',
        userAvatar: (state) => state.user?.picture || 'https://i.pravatar.cc/40', // 默认头像
    },

    actions: {
        // 内部方法：设置用户信息和 token
        setUserSession(user: UserDTO, token: string) {
            this.user = user;
            this.token = token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            this.error = null;
        },

        // 内部方法：清除用户信息和 token
        clearUserSession() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        },

        async login(credentials: { accountNumber: string; password: string }): Promise<boolean> {
            this.loading = true;
            this.error = null;
            try {
                // 假设您的登录API是 /api/auth/login
                // 并且成功时返回 { user: UserDTO, token: string }
                const response = await axios.post<{ user: UserDTO; token: string }>('/api/auth/login', credentials);
                const { user, token } = response.data;

                if (user && token) {
                    this.setUserSession(user, token);

                    // 登录成功后跳转
                    // 避免登录成功后又跳回登录页
                    const redirectPath = router.currentRoute.value.query.redirect as string;
                    if (redirectPath && redirectPath !== '/login' && redirectPath !== '/') {
                        router.push(redirectPath);
                    } else {
                        // 根据用户类型或默认跳转到主界面
                        // 例如，如果所有用户类型都有信息管理页作为主要入口：
                        router.push('/information-manage');
                    }
                    return true;
                } else {
                    // 如果后端返回200但数据不符合预期
                    this.error = '登录响应数据格式不正确';
                    this.clearUserSession();
                    return false;
                }
            } catch (error: any) {
                console.error('登录失败:', error);
                this.clearUserSession();
                if (error.response && error.response.data && error.response.data.message) {
                    this.error = error.response.data.message; // 使用后端返回的错误信息
                } else {
                    this.error = '账号或密码错误，或服务器无响应。';
                }
                return false;
            } finally {
                this.loading = false;
            }
        },

        logout() {
            this.clearUserSession();
            router.push('/login'); // 跳转到登录页
            ElMessage.success('已成功退出登录');
        },

        // 应用启动时或需要刷新用户信息时调用
        async fetchCurrentUser(): Promise<boolean> {
            if (!this.token) {
                // 如果没有 token，则不需要尝试获取用户信息
                this.clearUserSession(); // 确保状态干净
                return false;
            }
            this.loading = true;
            try {
                // 假设有一个 /api/user/current 接口返回当前用户信息
                const response = await axios.get<UserDTO>('/api/user/current');
                if (response.data) {
                    this.user = response.data; // 只更新用户信息，token 已存在
                    axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`; // 确保axios的header是最新的
                    this.error = null;
                    return true;
                } else {
                    this.clearUserSession(); // 如果获取不到用户信息，则认为会话无效
                    router.push('/login');
                    return false;
                }
            } catch (error) {
                console.error('获取当前用户信息失败:', error);
                this.clearUserSession(); // 获取失败也清除会话
                // 根据错误类型，可能需要重定向到登录页
                // 例如，如果是 401 Unauthorized，则肯定要清除会话并跳转
                if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
                    router.push('/login');
                }
                return false;
            } finally {
                this.loading = false;
            }
        },

        // 更新用户个人信息（例如在 App.vue 的编辑对话框保存时调用）
        async updateProfile(updatedInfo: Partial<UserDTO>): Promise<boolean> {
            if (!this.user) return false;
            this.loading = true;
            try {
                // 假设后端API是 /api/personal-information/{personalInforId}
                // 注意：通常个人信息更新和用户核心信息（如类型、账号）是分开的
                // 这里我们假设更新的是 `personal-information` 相关字段
                const payload = {
                    name: updatedInfo.name ?? this.user.name,
                    phoneNumber: updatedInfo.phoneNumber ?? this.user.phoneNumber,
                    picture: updatedInfo.picture ?? this.user.picture,
                };
                // 确保使用用户的 personalInforId
                await axios.put(`/api/personal-information/${this.user.personalInforId}`, payload);

                // 更新 store 中的用户信息
                if (this.user) {
                    this.user = { ...this.user, ...payload };
                }
                ElMessage.success('个人信息更新成功');
                return true;
            } catch (error) {
                console.error('更新个人信息失败:', error);
                ElMessage.error('更新个人信息失败，请重试');
                return false;
            } finally {
                this.loading = false;
            }
        }
    },
});

// 在 main.ts 或应用初始化时可以调用 fetchCurrentUser
// 例如，如果用户刷新页面，并且 localStorage 中有 token，则尝试获取用户信息
// const userStore = useUserStore();
// if (userStore.token) {
//   userStore.fetchCurrentUser();
// }