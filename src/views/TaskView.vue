<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { useRouter } from 'vue-router';
import "../assets/css/taskView.css";

const taskStore = useTaskStore();
const router = useRouter();

const title = ref('');
const priority = ref<'low' | 'medium' | 'high'>('low');
const filter = ref<'all' | 'completed' | 'pending'>('all');

onMounted(() => {
    taskStore.loadFromLocalStorage();
});

const addTask = () => {
    if (!title.value.trim()) return;
    taskStore.addTasks(title.value, priority.value);
    title.value = '';
    priority.value = 'low';
};

const filteredTasks = computed(() => {
    if (filter.value === 'completed') return taskStore.completedTasks;
    if (filter.value === 'pending') return taskStore.pendingTasks;
    return taskStore.tasks;
});

const goBack = () => {
    router.back();
};

const totalCount = computed(() => taskStore.tasks.length);
const completedCount = computed(() => taskStore.completedTasks.length);
const pendingCount = computed(() => taskStore.pendingTasks.length);
const progressPercent = computed(() =>
    totalCount.value === 0 ? 0 : Math.round((completedCount.value / totalCount.value) * 100)
);
</script>

<template>
    <div class="page">
        <!-- Background glow -->
        <div class="bg-glow"></div>

        <!-- Header -->
        <header class="top-bar">
            <button class="back-btn" @click="goBack">
                <span class="back-icon">←</span>
                <span>Back</span>
            </button>
            <div class="page-badge">
                <span>📝</span>
                <span>Task Manager</span>
            </div>
        </header>

        <main class="main-content">

            <!-- Hero title -->
            <div class="page-hero">
                <p class="hero-eyebrow">Stay Organised</p>
                <h1 class="hero-title">My Tasks</h1>
                <p class="hero-sub">Track, prioritise and complete your daily goals</p>
            </div>

            <!-- Stats row -->
            <div class="stats-row">
                <div class="stat-chip">
                    <span class="stat-num">{{ totalCount }}</span>
                    <span class="stat-label">Total</span>
                </div>
                <div class="progress-bar-wrap">
                    <div class="progress-track">
                        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                    </div>
                    <span class="progress-label">{{ progressPercent }}% done</span>
                </div>
                <div class="stat-chip">
                    <span class="stat-num accent-green">{{ completedCount }}</span>
                    <span class="stat-label">Done</span>
                </div>
                <div class="stat-chip">
                    <span class="stat-num accent-amber">{{ pendingCount }}</span>
                    <span class="stat-label">Pending</span>
                </div>
            </div>

            <!-- Add task card -->
            <div class="glass-card add-card">
                <p class="card-label">Add New Task</p>
                <div class="add-row">
                    <input type="text" v-model="title" class="task-input"
                        placeholder="What needs to be done?" @keydown.enter="addTask"/>
                    <select v-model="priority" class="priority-select">
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🔴 High</option>
                    </select>
                    <button class="add-btn" @click="addTask">
                        <span>＋</span>
                        <span>Add</span>
                    </button>
                </div>
            </div>

            <!-- Filter tabs -->
            <div class="filter-tabs">
                <button
                    v-for="tab in [{ key: 'all', label: 'All', count: totalCount }, { key: 'pending', label: 'Pending', count: pendingCount }, { key: 'completed', label: 'Completed', count: completedCount }]"
                    :key="tab.key" class="filter-tab" :class="{ active: filter === tab.key }" @click="filter = tab.key as any">
                    {{ tab.label }}
                    <span class="tab-count">{{ tab.count }}</span>
                </button>
            </div>

            <!-- Task list -->
            <div class="task-list">
                <TransitionGroup name="task">
                    <div v-for="task in filteredTasks" :key="task.id" class="task-item" :class="{ 'task-done': task.completed }">
                        <button class="check-btn" @click="taskStore.toggleTask(task.id)">
                            <span class="check-inner" :class="{ checked: task.completed }">
                                <span v-if="task.completed" class="checkmark">✓</span>
                            </span>
                        </button>

                        <span class="task-title" @click="taskStore.toggleTask(task.id)">
                            {{ task.title }}
                        </span>

                        <span class="priority-badge" :class="'prio-' + task.priority">
                            {{ task.priority }}
                        </span>

                        <button class="delete-btn" @click="taskStore.deleteTask(task.id)" title="Delete task">✕</button>
                    </div>
                </TransitionGroup>

                <div v-if="filteredTasks.length === 0" class="empty-state">
                    <span class="empty-icon">{{ filter === 'completed' ? '🏆' : filter === 'pending' ? '☕' : '✨' }}</span>
                    <p>{{ filter === 'completed' ? 'No completed tasks yet' : filter === 'pending' ? 'No pending tasks!' : 'No tasks yet — add one above' }}</p>
                </div>
            </div>

        </main>
    </div>
</template>