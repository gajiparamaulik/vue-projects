<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { useRouter } from 'vue-router';

const taskStore = useTaskStore();
const router = useRouter();

const title = ref('');
const priority = ref<'low' | 'medium' | 'high'>('low');
const filter = ref<'all' | 'completed' | 'pending'>('all')

onMounted(() => {
    console.log('data', taskStore.tasks);
    taskStore.loadFromLocalStorage();
})

const addTask = () => {
    if(!title.value.trim()) return;
    taskStore.addTasks(title.value, priority.value);
    title.value = "";
    priority.value = 'low';
    console.log('check', taskStore.tasks);
}

const filteredTasks = computed(() => {
    if(filter.value === 'completed') return taskStore.completedTasks;
    if(filter.value === 'pending') return taskStore.pendingTasks;
    return taskStore.tasks;
})

const priorityClass = (priority: string) => {
    switch (priority) {
        case 'low':
            return 'bg-success';
        case 'medium':
            return 'bg-warning text-dark';
        case 'high':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
};

const goBack = () => {
  router.back();
};
</script>

<template>
    <div class="container py-5">
        <div class="mb-3">
            <button class="btn btn-outline-dark" @click="goBack">
                Back To Home
            </button>
        </div>
        <div class="card shadow-lg p-4">
            <h2 class="text-center mb-4 text-primary">📝 Task Manager</h2>

            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <input type="text" v-model="title" class="form-control" placeholder="Enter Task"/>
                </div>

                <div class="col-md-3">
                    <select v-model="priority" class="form-select">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    </select>
                </div>

                <div class="col-md-3 d-grid">
                    <button class="btn btn-primary" @click="addTask">Add Task</button>
                </div>
            </div>

            <div class="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                <button class="btn btn-outline-secondary" @click="filter = 'all'">All</button>
                <button class="btn btn-outline-success" @click="filter = 'completed'">Completed</button>
                <button class="btn btn-outline-warning" @click="filter = 'pending'">Pending</button>
            </div>

            <ul class="list-group">
                <li v-for="task in filteredTasks" :key="task.id" class="list-group-item d-flex justify-content-between align-items-center">
                    <span :class="['task-text', task.completed ? 'text-decoration-line-through text-muted' : '']"
                        @click="taskStore.toggleTask(task.id)">
                        {{ task.title }}
                        <span class="badge ms-2" :class="priorityClass(task.priority)">{{ task.priority }}</span>
                    </span>
                    <button class="btn btn-sm btn-danger" @click="taskStore.deleteTask(task.id)">Delete</button>
                </li>
            </ul>

            <div v-if="filteredTasks.length === 0" class="text-center text-muted mt-3">No tasks found.</div>
        </div>
    </div>
</template>

<style scoped>
.card {
  border-radius: 15px;
}

.task-text {
  cursor: pointer;
  transition: 0.2s;
}

.task-text:hover {
  color: #0d6efd;
}

.list-group-item {
  border-radius: 10px;
  margin-bottom: 8px;
}

button {
  transition: 0.2s ease-in-out;
}

button:hover {
  transform: scale(1.05);
}
</style>