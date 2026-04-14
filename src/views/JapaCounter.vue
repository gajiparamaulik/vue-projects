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

        <!-- MAIN -->
        <div class="main">
            <!-- CIRCLE -->
            <div class="circle-wrapper">
                <svg width="240" height="240">
                    <defs>
                        <linearGradient id="grad">
                            <stop offset="0%" stop-color="#00f5a0"/>
                            <stop offset="100%" stop-color="#00d9f5"/>
                        </linearGradient>
                    </defs>

                    <circle class="bg" cx="110" cy="110" r="100"/>
                    <circle class="progress" cx="110" cy="110" r="100" :style="{ strokeDashoffset: dashOffset }"/>
                </svg>

                <div class="count">{{ count }}</div>
            </div>

            <!-- TAP PANEL -->
            <div class="tap-panel" @click="increment">
                <div class="tap-text">+ Tap to Chant</div>
            </div>

            <!-- ACTIONS -->
            <div class="actions">
                <button class="play" @click="toggleTimer">{{ running ? "Pause" : "Start" }}</button>
                <button class="reset" @click="reset">Reset</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import '../assets/css/japa.css';

const count = ref(0);
const max = 108;
const mode = ref("manual");

const malas = computed(() => Math.floor(count.value / max));

const seconds = ref(0);
const running = ref(false);
let interval = null;

const time = computed(() => {
    const m = String(Math.floor(seconds.value / 60)).padStart(2, "0");
    const s = String(seconds.value % 60).padStart(2, "0");
    return `${m}:${s}`;
});

function toggleTimer() {
    running.value = !running.value;

    if (running.value) {
        interval = setInterval(() => seconds.value++, 1000);
    } else {
        clearInterval(interval);
    }
}


const circumference = 2 * Math.PI * 100;

const dashOffset = computed(() => {
    const progress = (count.value % max) / max;
    return circumference * (1 - progress);
});

function increment() {
    count.value++;
    if (navigator.vibrate) navigator.vibrate(20);
}

function reset() {
    count.value = 0;
    seconds.value = 0;
    clearInterval(interval);
    running.value = false;
}
</script>