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

            const response = await axios.get('/api/user/get_userid', config);
            const userId = response.data as number;
            console.log('从API获取到的用户ID:', userId);
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
        return null;
    }
}

async function getCurrentUserType(): Promise<string | null> {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const response = await axios.get('/api/user/get_type', config);

            const userType = response.data as string;
            console.log('从API获取到的用户类型:', userType);
            return userType;
        } catch (e: unknown) {
            if (axios.isAxiosError(e)) {
                if (e.response) {
                    console.error('API请求错误:', e.response.status, e.response.data);
                    if (e.response.status === 401) {
                        console.error('未授权或Token无效:', e.response.data);
                    }
                } else if (e.request) {
                    console.error('API无响应:', e.request);
                } else {
                    console.error('请求设置错误:', e.message);
                }
            } else if (e instanceof Error) {
                console.error('发生错误:', e.message);
            } else {
                console.error('发生未知类型的错误:', e);
            }
            return null;
        }
    } else {
        console.log('未能从localStorage获取到token，无法请求用户类型');
        return null;
    }
}

async function getCurrentUserName(): Promise<string | null> {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const response = await axios.get('/api/user/get_name', config);
            const userName = response.data as string;
            console.log('从API获取到的用户名:', userName);
            return userName;
        } catch (e: unknown) {
            // 处理请求错误
            if (axios.isAxiosError(e)) {
                if (e.response) {
                    console.error('API请求错误:', e.response.status, e.response.data);
                    if (e.response.status === 401) {
                        console.error('未授权或Token无效:', e.response.data);
                    }
                } else if (e.request) {
                    console.error('API无响应:', e.request);
                } else {
                    console.error('请求设置错误:', e.message);
                }
            } else if (e instanceof Error) {
                console.error('发生错误:', e.message);
            } else {
                // 处理未知类型的错误
                console.error('发生未知类型的错误:', e);
            }
            return null;
        }
    } else {
        console.log('未能从localStorage获取到token，无法请求用户类型');
        return null;
    }
}


export { getCurrentUserId, getCurrentUserType, getCurrentUserName };