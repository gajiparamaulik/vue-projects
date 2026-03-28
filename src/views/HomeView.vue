<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const apps = [
    { name: 'Task Manager', path: '/tasks', icon: '📝' },
    { name: 'Weather App', path: '/weather', icon: '🌤️' },
    { name: 'Calculator', path: '/calculator', icon: '🧮' }
]

const goTo = (path: string) => {
    router.push(path)
}
</script>

<template>
    <div class="home-container">
        <div class="hero text-center text-white d-flex flex-column justify-content-center align-items-center">
            <h1 class="display-4 fw-bold">My Mini Apps 🚀</h1>
            <p class="lead">Built with Vue 3 + Pinia + TypeScript</p>
            <button class="btn btn-light mt-3">Explore Apps</button>
        </div>

        <div class="container my-5">
            <div class="row g-4">
                <div class="col-md-4" v-for="app in apps" :key="app.name">
                    <div class="card app-card h-100 text-center" @click="goTo(app.path)">
                        <div class="card-body">
                            <div class="icon mb-3">{{ app.icon }}</div>
                            <h5 class="card-title">{{ app.name }}</h5>
                            <p class="card-text text-muted">Click to open {{ app.name }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.hero {
  height: 55vh;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
}

.app-card {
  cursor: pointer;
  border: none;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.app-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.icon {
  font-size: 40px;
}
</style>