<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import "../assets/css/taskView.css";
 
const taskStore = useTaskStore()
const router    = useRouter()
const toast     = useToast()
 
const title    = ref('')
const priority = ref<'low' | 'medium' | 'high'>('low')
const filter   = ref<'all' | 'completed' | 'pending'>('all')
 
onMounted(() => {
    taskStore.loadFromLocalStorage()
})
 
const addTask = () => {
    if (!title.value.trim()) {
        toast.warning('Empty task', 'Please enter a task title first.')
        return
    }
    taskStore.addTasks(title.value, priority.value)
    toast.success('Task added!', `"${title.value}" was added to your list.`)
    title.value    = ''
    priority.value = 'low'
}
 
const deleteTask = (id: string | number, taskTitle: string) => {
    taskStore.deleteTask(id)
    toast.deleted('Task removed', `"${taskTitle}" has been deleted.`)
}
 
const toggleTask = (id: string | number, wasCompleted: boolean) => {
    taskStore.toggleTask(id)
    if (wasCompleted) {
        toast.info('Marked as pending', 'Task moved back to pending.')
    } else {
        toast.complete('Task completed! 🎉', 'Great job keeping on track.')
    }
}
 
const filteredTasks = computed(() => {
    if (filter.value === 'completed') return taskStore.completedTasks
    if (filter.value === 'pending')   return taskStore.pendingTasks
    return taskStore.tasks
})
 
const totalCount      = computed(() => taskStore.tasks.length)
const completedCount  = computed(() => taskStore.completedTasks.length)
const pendingCount    = computed(() => taskStore.pendingTasks.length)
const progressPercent = computed(() =>
    totalCount.value === 0 ? 0 : Math.round((completedCount.value / totalCount.value) * 100)
)
 
const goBack = () => router.back()
</script>
 
<template>
    <div class="page">
        <div class="bg-glow"></div>
 
        <header class="top-bar">
            <button class="back-btn" @click="goBack">
                <span>←</span>
                <span>Back</span>
            </button>
            <div class="page-badge">
                <span>📝</span>
                <span>Task Manager</span>
            </div>
        </header>
 
        <main class="main-content">
 
            <div class="page-hero">
                <p class="hero-eyebrow">Stay Organised</p>
                <h1 class="hero-title">My Tasks</h1>
                <p class="hero-sub">Track, prioritise and complete your daily goals</p>
            </div>
 
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
 
            <div class="glass-card add-card">
                <p class="card-label">Add New Task</p>
                <div class="add-row">
                    <input
                        type="text"
                        v-model="title"
                        class="task-input"
                        placeholder="What needs to be done?"
                        @keydown.enter="addTask"
                    />
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
 
            <div class="filter-tabs">
                <button
                    v-for="tab in [
                        { key: 'all',       label: 'All',       count: totalCount },
                        { key: 'pending',   label: 'Pending',   count: pendingCount },
                        { key: 'completed', label: 'Completed', count: completedCount },
                    ]"
                    :key="tab.key"
                    class="filter-tab"
                    :class="{ active: filter === tab.key }"
                    @click="filter = tab.key as any"
                >
                    {{ tab.label }}
                    <span class="tab-count">{{ tab.count }}</span>
                </button>
            </div>
 
            <div class="task-list">
                <TransitionGroup name="task">
                    <div
                        v-for="task in filteredTasks"
                        :key="task.id"
                        class="task-item"
                        :class="{ 'task-done': task.completed }"
                    >
                        <button class="check-btn" @click="toggleTask(task.id, task.completed)">
                            <span class="check-inner" :class="{ checked: task.completed }">
                                <span v-if="task.completed" class="checkmark">✓</span>
                            </span>
                        </button>
 
                        <span class="task-title" @click="toggleTask(task.id, task.completed)">
                            {{ task.title }}
                        </span>
 
                        <span class="priority-badge" :class="'prio-' + task.priority">
                            {{ task.priority }}
                        </span>
 
                        <button class="delete-btn" @click="deleteTask(task.id, task.title)" title="Delete task">
                            ✕
                        </button>
                    </div>
                </TransitionGroup>
 
                <div v-if="filteredTasks.length === 0" class="empty-state">
                    <span class="empty-icon">
                        {{ filter === 'completed' ? '🏆' : filter === 'pending' ? '☕' : '✨' }}
                    </span>
                    <p>
                        {{ filter === 'completed' ? 'No completed tasks yet'
                         : filter === 'pending'   ? 'No pending tasks!'
                         : 'No tasks yet — add one above' }}
                    </p>
                </div>
            </div>
 
        </main>
    </div>
</template>