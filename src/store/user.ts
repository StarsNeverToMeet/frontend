import { defineStore } from 'pinia';
import axios from 'axios';
import router from '../router'; // 确保路径正确
import { ElMessage } from 'element-plus';

// Store 的 state 结构
interface UserState {
    token: string | null;
    loading: boolean;
    error: string | null;
}

export const userStore = defineStore('user', {
    state: (): UserState => ({
        token: localStorage.getItem('token') || null, // 初始化时从 localStorage 加载 token
        loading: false,
        error: null,
    }),

    getters: {
        isLoggedIn: (state) => !!state.token,
        getToken: (state) => state.token,
    },

    actions: {
        // 内部方法：设置 token
        setToken(token: string) {
            this.token = token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            this.error = null;
        },

        // 内部方法：清除 token
        clearToken() {
            this.token = null;
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        },

        async login(credentials: { accountNumber: string; password: string }): Promise<boolean> {
            this.loading = true;
            this.error = null;
            try {
                // 假设您的登录API是 /api/auth/login
                // 并且成功时返回 { token: string } 或包含 token 的对象
                const response = await axios.post<{ token: string }>('/api/auth/login', credentials); // 假设返回体中直接有 token 字段
                const { token } = response.data;

                if (token) {
                    this.setToken(token);

                    // 登录成功后的跳转逻辑可以保留，但不再依赖用户信息
                    const redirectPath = router.currentRoute.value.query.redirect as string;
                    if (redirectPath && redirectPath !== '/login' && redirectPath !== '/') {
                        router.push(redirectPath);
                    } else {
                        router.push('/information-manage'); // 默认跳转
                    }
                    return true;
                } else {
                    this.error = '登录响应数据中未找到Token';
                    this.clearToken();
                    return false;
                }
            } catch (error: any) {
                console.error('登录失败:', error);
                this.clearToken();
                if (error.response && error.response.data && error.response.data.message) {
                    this.error = error.response.data.message;
                } else {
                    this.error = '账号或密码错误，或服务器无响应。';
                }
                return false;
            } finally {
                this.loading = false;
            }
        },

        logout() {
            this.clearToken();
            router.push('/login'); // 跳转到登录页
            ElMessage.success('已成功退出登录');
        },

        // 如果还需要通过 token 验证会话有效性，可以保留一个简化版的 action
        // 否则，如果不需要，这个 action 也可以移除
        async validateCurrentToken(): Promise<boolean> {
            if (!this.token) {
                this.clearToken();
                return false;
            }
            this.loading = true;
            try {
                // 示例：假设有一个 /api/auth/validate-token 接口，仅用于验证token有效性
                // 如果验证通过，什么都不做；如果失败（例如返回401），则清除token
                await axios.get('/api/auth/validate-token'); // 不需要返回值，只要请求成功即可
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`; // 确保axios的header是最新的
                this.error = null;
                return true;
            } catch (error) {
                console.error('Token 验证失败:', error);
                this.clearToken(); // Token 无效，清除会话
                // 根据错误类型，可能需要重定向到登录页
                if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
                    router.push('/login');
                }
                return false;
            } finally {
                this.loading = false;
            }
        }
    },
});
