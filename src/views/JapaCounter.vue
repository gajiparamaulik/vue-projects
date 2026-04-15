<template>
    <div class="box">

        <div class="top-bar">
            <div class="stat">
                <span>🧿 Malas</span>
                <b>{{ malas }}</b>
            </div>

            <div class="stat">
                <span>🔢 Chants</span>
                <b>{{ count }}</b>
            </div>

            <div class="stat">
                <span>⏱ Time</span>
                <b>{{ time }}</b>
            </div>
        </div>

        <div class="main">
            <div class="circle-wrapper">
                <svg width="240" height="240">
                    <defs>
                        <linearGradient id="grad">
                            <stop offset="0%" stop-color="#00f5a0"/>
                            <stop offset="100%" stop-color="#00d9f5"/>
                        </linearGradient>
                    </defs>

                    <circle class="bg" cx="120" cy="120" r="100"/>

                    <circle class="progress" cx="120" cy="120" r="100" :style="{ strokeDashoffset: dashOffset }"/>
                </svg>

                <div class="count">{{ count }}</div>

                <div class="drops">
                    <span v-for="d in dropList" :key="d.id" class="drop" :style="{ left: d.x + 'px', top: d.y + 'px' }"></span>
                </div>
            </div>

            <div class="tap-panel" @click="increment">
                <div class="tap-text">Tap to Chant</div>
            </div>
            
            <button class="reset" @click="reset">↺</button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import '../assets/css/japa.css';

const count = ref(0);
const max = 108;

const seconds = ref(0);
const running = ref(false);
let interval = null;

const dropList = ref([]);

const malas = computed(() => Math.floor(count.value / max));

const time = computed(() => {
    const m = String(Math.floor(seconds.value / 60)).padStart(2, "0");
    const s = String(seconds.value % 60).padStart(2, "0");
    return `${m}:${s}`;
});

function startTimer() {
    if (!running.value) {
        running.value = true;
        interval = setInterval(() => seconds.value++, 1000);
    }
}

const circumference = 2 * Math.PI * 100;

const dashOffset = computed(() => {
    const progress = (count.value % max) / max;
    return circumference * (1 - progress);
});

function increment() {
    count.value++;
    startTimer();

    createDrops();

    if (navigator.vibrate) navigator.vibrate(20);
}

function createDrops() {
    for (let i = 0; i < 4; i++) {
        const id = Date.now() + Math.random();

        dropList.value.push({
            id,
            x: Math.random() * 120 - 60,
            y: Math.random() * 120 - 60,
        });

        setTimeout(() => {
            dropList.value = dropList.value.filter(d => d.id !== id);
        }, 600);
    }
}

function reset() {
    count.value = 0;
    seconds.value = 0;
    running.value = false;
    clearInterval(interval);
}
</script>