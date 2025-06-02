import './assets/styles.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'element-plus/dist/index.css';
import ElementPlus from 'element-plus';
import './plugins/axios.ts';
import { createPinia } from 'pinia';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus);
router.isReady().then(() => {
    app.mount('#app');
});

