import axios from 'axios';

async function getCurrentUserId() {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            // 设置请求头，将 token 添加到 Authorization 头部
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            // 发送 GET 请求到后端的 /api/user/id
            // 请确保将 'http://your-backend-api-url' 替换为您的实际后端 API 地址
            const response = await axios.get('/api/user/get_userid', config);

            // 请求成功，response.data 中应该包含了 userId
            const userId = response.data as number;
            console.log('从API获取到的用户ID:', userId);
            // 在这里您可以使用 userId 进行后续操作
            // 例如：this.userId = userId; (如果在 Vue 组件的方法中)
            return userId;
        } catch (e: unknown) { // 将捕获的 error 显式声明为 unknown 类型
            // 处理请求错误
            if (axios.isAxiosError(e)) { // 使用 axios.isAxiosError 类型守卫
                // 此处 e 的类型被缩小为 AxiosError
                if (e.response) {
                    // 请求已发出，但服务器响应的状态码不在 2xx 范围内
                    console.error('API请求错误:', e.response.status, e.response.data);
                    // 例如，如果 token 过期或无效，后端会返回 401
                    if (e.response.status === 401) {
                        // 处理未授权的情况，比如跳转到登录页
                        // localStorage.removeItem('token'); // 清除无效的 token
                        // window.location.href = '/login';
                    }
                } else if (e.request) {
                    // 请求已发出，但没有收到响应
                    console.error('API无响应:', e.request);
                } else {
                    // 在设置请求时触发了一个错误
                    console.error('请求设置错误:', e.message);
                }
            } else if (e instanceof Error) { // 处理其他普通错误
                console.error('发生错误:', e.message);
            } else {
                // 处理未知类型的错误
                console.error('发生未知类型的错误:', e);
            }
            return null;
        }
    } else {
        console.log('未能从localStorage获取到token，无法请求用户ID');
        // 可能需要引导用户去登录
        return null;
    }
}

async function getCurrentUserType(): Promise<string | null> {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            // 设置请求头，将 token 添加到 Authorization 头部
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            // 发送 GET 请求到后端的 /api/user/get_type
            // 请确保将 API 地址修改为您的实际后端 API 地址
            const response = await axios.get('/api/user/get_type', config);

            // 请求成功，response.data 中应该包含了 type
            const userType = response.data as string;
            console.log('从API获取到的用户类型:', userType);
            return userType;
        } catch (e: unknown) { // 将捕获的 error 显式声明为 unknown 类型
            // 处理请求错误
            if (axios.isAxiosError(e)) { // 使用 axios.isAxiosError 类型守卫
                if (e.response) {
                    // 请求已发出，但服务器响应的状态码不在 2xx 范围内
                    console.error('API请求错误:', e.response.status, e.response.data);
                    // 例如，如果 token 过期或无效，后端会返回 401
                    if (e.response.status === 401) {
                        // 处理未授权的情况
                        // 可以考虑清除无效的 token 并跳转到登录页
                        // localStorage.removeItem('token');
                        // window.location.href = '/login';
                        console.error('未授权或Token无效:', e.response.data);
                    }
                } else if (e.request) {
                    // 请求已发出，但没有收到响应
                    console.error('API无响应:', e.request);
                } else {
                    // 在设置请求时触发了一个错误
                    console.error('请求设置错误:', e.message);
                }
            } else if (e instanceof Error) { // 处理其他普通错误
                console.error('发生错误:', e.message);
            } else {
                // 处理未知类型的错误
                console.error('发生未知类型的错误:', e);
            }
            return null;
        }
    } else {
        console.log('未能从localStorage获取到token，无法请求用户类型');
        // 可能需要引导用户去登录
        return null;
    }
}


export { getCurrentUserId, getCurrentUserType };