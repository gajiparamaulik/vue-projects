<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/css/japa.css';

const router = useRouter()

interface Mantra {
    id: number
    text: string
    color: string
}

const mantras: Mantra[] = [
    { id: 1, text: 'Hare Krishna Hare Krishna Krishna Krishna Hare Hare', color: '#38bdf8' },
    { id: 2, text: 'Hare Rama Hare Rama Rama Rama Hare Hare', color: '#34d399' },
    { id: 3, text: 'Om Namah Shivaya', color: '#a78bfa' },
    { id: 4, text: 'Om Mani Padme Hum', color: '#f472b6' }
]

const count = ref(0)
const sessionTime = ref(0)
const isRunning = ref(false)
const selectedMantra = ref(mantras[0])
const showTextModal = ref(false)
const showMalasModal = ref(false)
const animatingDrops = ref<Array<{id: number, x: number, y: number}>>([])

const MAX_COUNT = 108
const totalMalas = computed(() => Math.floor(count.value / MAX_COUNT))
const currentMalaProgress = computed(() => (count.value % MAX_COUNT) / MAX_COUNT * 100)
const formattedTime = computed(() => {
    const mins = Math.floor(sessionTime.value / 60).toString().padStart(2, '0')
    const secs = (sessionTime.value % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
})

let timerInterval: ReturnType<typeof setInterval> | null = null

function startTimer() {
    if (!isRunning.value) {
        isRunning.value = true;
        timerInterval = setInterval(() => {
            sessionTime.value++
        }, 1000)
    }
}

function increment() {
    count.value++;
    startTimer();
    createDropAnimation();

    if (navigator.vibrate) {
        navigator.vibrate([20, 10, 20]);
    }
}

function createDropAnimation() {
  for (let i = 0; i < 6; i++) {
    const id = Date.now() + Math.random();
    const drop = {
      id,
      x: Math.random() * 200 - 100,
      y: Math.random() * 150 - 75
    }
    animatingDrops.value.push(drop);
    setTimeout(() => {
      animatingDrops.value = animatingDrops.value.filter(d => d.id !== id);
    }, 800)
  }
}

function reset() {
    count.value = 0;
    sessionTime.value = 0;
    isRunning.value = false;
    if (timerInterval) clearInterval(timerInterval);
    animatingDrops.value = [];
}

function goBack() {
    router.back();
}

function openTextModal() {
    showTextModal.value = true;
}

function closeTextModal() {
    showTextModal.value = false;
}

function selectMantra(mantra: Mantra) {
    selectedMantra.value = mantra;
}

function openMalasModal() {
    showMalasModal.value = true;
}

function closeMalasModal() {
    showMalasModal.value = false;
}
</script>

<template>
    <div class="japa-container">
        <!-- Header -->
        <header class="japa-header">
            <button class="header-btn back-btn" @click="goBack" aria-label="Go back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </button>
            <h1 class="header-title">Japa Counter</h1>
            <div class="header-spacer"></div>
        </header>

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-item" @click="openMalasModal">
                <div class="stat-value">{{ totalMalas }}</div>
                <div class="stat-label">Malas</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
                <div class="stat-value">{{ formattedTime }}</div>
                <div class="stat-label">Time</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
                <div class="stat-value">{{ count % MAX_COUNT }}</div>
                <div class="stat-label">Current</div>
            </div>
        </div>

        <!-- Main Counter Circle -->
        <div class="counter-section">
            <div class="circle-container">
                <svg class="progress-ring" viewBox="0 0 300 300" width="300" height="300">
                    <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" :stop-color="selectedMantra.color" stop-opacity="0.3"/>
                            <stop offset="100%" :stop-color="selectedMantra.color" stop-opacity="0.8"/>
                        </linearGradient>
                    </defs>
                    
                    <!-- Background circle -->
                    <circle cx="150" cy="150" r="120" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"/>
                    
                    <!-- Progress circle -->
                    <circle cx="150" cy="150" r="120" fill="none" :stroke="selectedMantra.color" stroke-width="12"
                        stroke-dasharray="754.4" :stroke-dashoffset="754.4 * (1 - currentMalaProgress / 100)" stroke-linecap="round"
                        style="transition: stroke-dashoffset 0.3s ease; transform: rotate(-90deg); transform-origin: 150px 150px;"
                    />
                </svg>

                <!-- Drops -->
                <div class="drops-container">
                    <div v-for="drop in animatingDrops" :key="drop.id" class="drop"
                        :style="{
                            left: `calc(50% + ${drop.x}px)`,
                            top: `calc(50% + ${drop.y}px)`,
                            '--color': selectedMantra.color
                        }"
                    />
                </div>

                <!-- Center Display -->
                <div class="center-display" @click="openTextModal">
                    <div class="count-large">{{ count }}</div>
                    <div class="count-hint">Click for mantra</div>
                </div>
            </div>
        </div>

        <!-- Tap Zone -->
        <div class="tap-zone" @click="increment">
            <div class="tap-inner">
                <svg class="tap-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 3v5l4.28 2.54.72-1.2-4-2.4V7z"/>
                </svg>
                <p class="tap-text">Tap to Chant</p>
                <p class="tap-sub">{{ isRunning ? 'Session Active' : 'Start Session' }}</p>
            </div>
        </div>

        <!-- Control Buttons -->
        <div class="controls">
            <button class="ctrl-btn reset-btn" @click="reset" :disabled="count === 0" title="Reset counter">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                </svg>
                Reset
            </button>
            <button class="ctrl-btn mantra-btn" @click="showMalasModal = true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z"/>
                </svg>
                Mantras
            </button>
        </div>

        <!-- Text Modal -->
        <Teleport to="body">
            <Transition name="modal-fade">
                <div v-if="showTextModal" class="modal-overlay" @click="closeTextModal">
                    <div class="modal-content" @click.stop>
                        <button class="modal-close" @click="closeTextModal" aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                        <div class="modal-header">
                            <div class="modal-counter">{{ count }} Chants</div>
                            <div class="modal-time">{{ formattedTime }}</div>
                        </div>
                        <div class="modal-body">
                            <div class="mantra-display" :style="{ borderTopColor: selectedMantra.color }">
                                <p class="mantra-text">{{ selectedMantra.text }}</p>
                            </div>
                            <div class="session-stats">
                                <div class="stat-box">
                                    <span class="stat-num">{{ totalMalas }}</span>
                                    <span class="stat-desc">Malas Complete</span>
                                </div>
                                <div class="stat-box">
                                    <span class="stat-num">{{ Math.floor((currentMalaProgress / 100) * MAX_COUNT) }}</span>
                                    <span class="stat-desc">In Current Mala</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Mantras Modal -->
        <Teleport to="body">
            <Transition name="modal-fade">
                <div v-if="showMalasModal" class="modal-overlay" @click="closeMalasModal">
                    <div class="modal-content mantras-modal" @click.stop>
                        <button class="modal-close" @click="closeMalasModal" aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                        <div class="modal-header">
                            <h2>Select Mantra</h2>
                        </div>
                        <div class="mantras-list">
                            <button v-for="mantra in mantras" :key="mantra.id" class="mantra-item" :style="{ borderLeftColor: mantra.color }"
                                :class="{ active: selectedMantra.id === mantra.id }" @click="selectMantra(mantra); closeMalasModal()">
                                <span class="mantra-text">{{ mantra.text }}</span>
                                <span v-if="selectedMantra.id === mantra.id" class="checkmark">✓</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>