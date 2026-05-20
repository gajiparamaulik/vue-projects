import { createRouter, createWebHistory } from 'vue-router';

import HomeView from '../views/HomeView.vue';
import TaskView from '../views/TaskView.vue';
import WeatherView from '../views/WeatherView.vue';
import JapaCounter from '../views/JapaCounter.vue';
import UserListView from '../views/UserListView.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: HomeView
        },
        {
            path: '/tasks',
            component: TaskView
        },
        {
            path: '/weather',
            component: WeatherView
        },
        {
            path: '/japa-counter',
            component: JapaCounter
        },
        {
            path: '/user-list',
            component: UserListView
        }
    ]
})

export default router