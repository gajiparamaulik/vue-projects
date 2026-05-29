<script setup lang="ts">
import { useRouter } from 'vue-router'
// import FlipClock from '../components/FlipClock.vue'

const router = useRouter()

const apps = [
    { name: 'Task Manager', path: '/tasks', icon: '📝', desc: 'Manage your daily tasks with priority levels' },
    { name: 'Weather App', path: '/weather', icon: '🌤️', desc: 'Check live weather for any city worldwide' },
    { name: 'Japa Counter', path: '/japa-counter', icon: '📿', desc: 'Track your chanting sessions with ease' },
    { name: 'User List', path: '/user-list', icon: '👥', desc: 'View and manage your user list' },
    { name: 'Recipe Finder App', path: '/recipe-finder', icon: '🍳', desc: 'Find delicious recipes based on your ingredients' }
]
</script>

<template>
    <div class="home">
        <!-- Hero -->
        <div class="hero">
            <div class="hero-content">
                <p class="hero-eyebrow">Vue 3 + Pinia + TypeScript</p>
                <h1 class="hero-title">My Mini Apps</h1>
                <p class="hero-sub">A collection of focused, beautifully crafted applications</p>

                <!-- Flip Clock -->
                <FlipClock />
            </div>
        </div>

        <!-- Cards -->
        <div class="cards-section">
            <div class="cards-grid">
                <div v-for="app in apps" :key="app.name" class="app-card" @click="router.push(app.path)" tabindex="0"
                    @keydown.enter="router.push(app.path)" role="button">
                    <div class="card-icon">{{ app.icon }}</div>
                    <h3 class="card-name">{{ app.name }}</h3>
                    <p class="card-desc">{{ app.desc }}</p>
                    <span class="card-arrow">→</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.home {
    min-height: 100vh;
    background: #0f0f1a;
}

/* ---- Hero ---- */
.hero {
    background: linear-gradient(160deg, #0f0f1a 0%, #1a1a3e 50%, #0f0f1a 100%);
    padding: 72px 24px 56px;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.hero::before {
    content: '';
    position: absolute;
    top: -120px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%);
    pointer-events: none;
}

.hero-content {
    position: relative;
    max-width: 700px;
    margin: 0 auto;
}

.hero-eyebrow {
    font-size: 12px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(56, 189, 248, 0.8);
    font-weight: 600;
    margin: 0 0 16px;
}

.hero-title {
    font-size: clamp(2.4rem, 6vw, 4rem);
    font-weight: 800;
    color: #f8fafc;
    margin: 0 0 14px;
    line-height: 1.1;
    letter-spacing: -1px;
}

.hero-sub {
    font-size: 1.05rem;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
    font-weight: 400;
    line-height: 1.6;
}

/* ---- Cards ---- */
.cards-section {
    padding: 56px 24px 80px;
    max-width: 960px;
    margin: 0 auto;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 24px;
}

.app-card {
    background: linear-gradient(160deg, #1e1e38 0%, #16162a 100%);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 32px 28px 28px;
    cursor: pointer;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 8px;
    outline: none;
}

.app-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.04) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.25s ease;
    border-radius: 16px;
}

.app-card:hover,
.app-card:focus {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.15);
    border-color: rgba(56, 189, 248, 0.2);
}

.app-card:hover::before,
.app-card:focus::before {
    opacity: 1;
}

.card-icon {
    font-size: 36px;
    margin-bottom: 4px;
}

.card-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
}

.card-desc {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0;
    line-height: 1.5;
    flex: 1;
}

.card-arrow {
    font-size: 1.1rem;
    color: rgba(56, 189, 248, 0.6);
    margin-top: 4px;
    display: inline-block;
    transition: transform 0.2s ease;
}

.app-card:hover .card-arrow,
.app-card:focus .card-arrow {
    transform: translateX(4px);
}

@media (max-width: 480px) {
    .hero {
        padding: 48px 16px 40px;
    }

    .cards-section {
        padding: 40px 16px 60px;
    }
}
</style>
