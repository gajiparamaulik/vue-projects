<script setup lang="ts">

import { useToast } from '../composables/useToast'

const { toasts, dismiss } = useToast()

const meta: Record<string, { icon: string; accent: string; bar: string }> = {
    success:  { icon: '✓',  accent: 'rgba(74,222,128,0.25)',  bar: 'linear-gradient(90deg,#4ade80,#22d3ee)' },
    delete:   { icon: '✕',  accent: 'rgba(248,113,113,0.25)', bar: 'linear-gradient(90deg,#f87171,#fb923c)' },
    complete: { icon: '★',  accent: 'rgba(251,191,36,0.25)',  bar: 'linear-gradient(90deg,#fbbf24,#f59e0b)' },
    warning:  { icon: '!',  accent: 'rgba(251,191,36,0.25)',  bar: 'linear-gradient(90deg,#fbbf24,#fb923c)' },
    info:     { icon: 'i',  accent: 'rgba(56,189,248,0.25)',  bar: 'linear-gradient(90deg,#38bdf8,#818cf8)' },
}
</script>

<template>
    <Teleport to="body">
        <div class="tc">
            <TransitionGroup name="t">
                <div v-for="toast in toasts" :key="toast.id" class="ti" :class="{ leaving: toast.leaving }">
                    <!-- Icon bubble -->
                    <div class="ti-icon" :style="{ background: meta[toast.type].accent }">
                        {{ meta[toast.type].icon }}
                    </div>

                    <!-- Text -->
                    <div class="ti-body">
                        <p class="ti-title">{{ toast.title }}</p>
                        <p v-if="toast.message" class="ti-msg">{{ toast.message }}</p>
                    </div>

                    <!-- Close btn -->
                    <button class="ti-close" @click="dismiss(toast.id)">✕</button>

                    <!-- Animated progress bar -->
                    <div class="ti-bar" :style="{ background: meta[toast.type].bar }"></div>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<style scoped>
/* Container — fixed top-right */
.tc {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
}

/* Toast card */
.ti {
    width: 340px;
    background: rgba(10, 12, 28, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 14px 14px 14px 14px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    position: relative;
    overflow: hidden;
    pointer-events: all;
    cursor: default;
    backdrop-filter: blur(16px);
    box-shadow:
        0 0 0 1px rgba(255,255,255,0.04),
        0 8px 32px rgba(0,0,0,0.5),
        0 2px 8px rgba(0,0,0,0.3);
    animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.ti.leaving {
    animation: slideOut 0.35s cubic-bezier(0.55, 0, 1, 0.45) both;
}

/* Icon bubble */
.ti-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 800;
    color: #fff;
    flex-shrink: 0;
}

/* Body */
.ti-body {
    flex: 1;
    min-width: 0;
    padding-right: 20px;
}

.ti-title {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1.3;
}

.ti-msg {
    margin: 3px 0 0;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.45);
    line-height: 1.4;
    text-overflow: ellipsis;
    overflow: hidden;
}

/* Close */
.ti-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.45);
    font-size: 0.65rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
    line-height: 1;
}

.ti-close:hover {
    background: rgba(255,255,255,0.15);
    color: #fff;
}

/* Progress bar */
.ti-bar {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: 100%;
    transform-origin: left;
    animation: progress 4s linear forwards;
    border-radius: 0 0 16px 16px;
}

/* ── Keyframes ── */
@keyframes slideIn {
    from { transform: translateX(110%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0);   opacity: 1; max-height: 100px; margin-bottom: 0; }
    to   { transform: translateX(110%); opacity: 0; max-height: 0;   margin-bottom: -12px; }
}

@keyframes progress {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
}

/* TransitionGroup (stacking) */
.t-move {
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Mobile */
@media (max-width: 480px) {
    .tc {
        top: auto;
        bottom: 16px;
        right: 12px;
        left: 12px;
    }
    .ti {
        width: 100%;
    }
}
</style>
