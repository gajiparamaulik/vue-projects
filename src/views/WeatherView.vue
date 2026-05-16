<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const city = ref('Bangalore');
const weather = ref<any>(null);
const loading = ref(false);
const error = ref('');

const API_KEY = '7996646101c04097b5562539262502';

onMounted(() => {
    getWeather();
});

const getWeather = async () => {
    if (!city.value.trim()) return;
    loading.value = true;
    error.value = '';
    try {
        const res = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city.value}&aqi=yes`
        );
        const data = await res.json();
        if (data.error) {
            error.value = data.error.message;
            weather.value = null;
        } else {
            weather.value = data;
        }
    } catch {
        error.value = 'Could not reach the weather service. Please try again.';
    } finally {
        loading.value = false;
    }
};

const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') getWeather();
};

const goBack = () => router.back();

// Derive a simple sky condition key from condition code for background theming
const skyCondition = computed(() => {
    if (!weather.value) return 'default';
    const code = weather.value.current.condition.code;
    const isDay = weather.value.current.is_day;
    if ([1000].includes(code)) return isDay ? 'sunny' : 'clear-night';
    if ([1003, 1006].includes(code)) return 'cloudy';
    if ([1009, 1030, 1135, 1147].includes(code)) return 'overcast';
    if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return 'rain';
    if ([1066, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return 'snow';
    if ([1087, 1273, 1276].includes(code)) return 'storm';
    return 'default';
});

const formattedTime = computed(() => {
    if (!weather.value) return '';
    const raw = weather.value.location.localtime; // "2025-05-15 14:30"
    const [, time] = raw.split(' ');
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
});

const formattedDate = computed(() => {
    if (!weather.value) return '';
    const raw = weather.value.location.localtime;
    const dateStr = raw.split(' ')[0];
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
});

const uvLevel = computed(() => {
    const uv = weather.value?.current?.uv ?? 0;
    if (uv <= 2) return { label: 'Low', color: '#4ade80' };
    if (uv <= 5) return { label: 'Moderate', color: '#fbbf24' };
    if (uv <= 7) return { label: 'High', color: '#fb923c' };
    return { label: 'Very High', color: '#f87171' };
});

const aqiLevel = computed(() => {
    const pm = weather.value?.current?.air_quality?.pm2_5 ?? null;
    if (pm === null) return null;
    if (pm <= 12) return { label: 'Good', color: '#4ade80', val: pm.toFixed(1) };
    if (pm <= 35) return { label: 'Moderate', color: '#fbbf24', val: pm.toFixed(1) };
    if (pm <= 55) return { label: 'Unhealthy', color: '#fb923c', val: pm.toFixed(1) };
    return { label: 'Hazardous', color: '#f87171', val: pm.toFixed(1) };
});

const windDir = computed(() => weather.value?.current?.wind_dir ?? '');
</script>

<template>
    <div class="page" :class="'sky-' + skyCondition">
        <!-- Atmospheric background layers -->
        <div class="bg-layer bg-glow-top"></div>
        <div class="bg-layer bg-glow-mid"></div>

        <!-- Top bar -->
        <header class="top-bar">
            <button class="back-btn" @click="goBack">
                <span>←</span>
                <span>Back</span>
            </button>
            <div class="page-badge">
                <span>🌤️</span>
                <span>Weather App</span>
            </div>
        </header>

        <main class="main-content">

            <!-- Hero -->
            <div class="page-hero">
                <p class="hero-eyebrow">Live Conditions</p>
                <h1 class="hero-title">Weather</h1>
                <p class="hero-sub">Real-time weather for any city worldwide</p>
            </div>

            <!-- Search bar -->
            <div class="search-wrap">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input v-model="city" class="search-input" placeholder="Search city..." @keydown="handleKey"/>
                    <button class="search-btn" @click="getWeather" :disabled="loading">
                        <span v-if="!loading">Search</span>
                        <span v-else class="spinner"></span>
                    </button>
                </div>
                <div v-if="error" class="error-msg">
                    <span>⚠️</span> {{ error }}
                </div>
            </div>

            <!-- Loading skeleton -->
            <div v-if="loading" class="skeleton-wrap">
                <div class="skel skel-hero"></div>
                <div class="skel-row">
                    <div class="skel skel-stat"></div>
                    <div class="skel skel-stat"></div>
                    <div class="skel skel-stat"></div>
                    <div class="skel skel-stat"></div>
                </div>
            </div>

            <!-- Weather content -->
            <Transition name="fade-up">
                <div v-if="weather && !loading" class="weather-wrap">

                    <!-- Main hero card -->
                    <div class="hero-card glass-card">
                        <div class="hero-card-top">
                            <div class="location-block">
                                <p class="location-time">{{ formattedTime }}</p>
                                <p class="location-date">{{ formattedDate }}</p>
                                <h2 class="location-name">
                                    {{ weather.location.name }}
                                </h2>
                                <p class="location-region">
                                    {{ weather.location.region }}, {{ weather.location.country }}
                                </p>
                            </div>
                            <div class="condition-block">
                                <img :src="'https:' + weather.current.condition.icon.replace('64x64', '128x128')"
                                    :alt="weather.current.condition.text"
                                    class="condition-icon"/>
                                <p class="condition-text">{{ weather.current.condition.text }}</p>
                            </div>
                        </div>

                        <div class="temp-display">
                            <span class="temp-value">{{ Math.round(weather.current.temp_c) }}</span>
                            <span class="temp-unit">°C</span>
                        </div>
                        <p class="feels-like">
                            Feels like <strong>{{ weather.current.feelslike_c }}°C</strong>
                            &nbsp;·&nbsp;
                            {{ weather.current.is_day ? '☀️ Day' : '🌙 Night' }}
                        </p>
                    </div>

                    <!-- Stats grid -->
                    <div class="stats-grid">

                        <div class="stat-card glass-card">
                            <div class="stat-icon">💧</div>
                            <div class="stat-body">
                                <p class="stat-label">Humidity</p>
                                <p class="stat-value">{{ weather.current.humidity }}<span class="stat-unit">%</span></p>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" :style="{ width: weather.current.humidity + '%', background: '#38bdf8' }"></div>
                                </div>
                            </div>
                        </div>

                        <div class="stat-card glass-card">
                            <div class="stat-icon">💨</div>
                            <div class="stat-body">
                                <p class="stat-label">Wind</p>
                                <p class="stat-value">{{ weather.current.wind_kph }}<span class="stat-unit"> km/h</span></p>
                                <p class="stat-sub">{{ windDir }} direction</p>
                            </div>
                        </div>

                        <div class="stat-card glass-card">
                            <div class="stat-icon">👁️</div>
                            <div class="stat-body">
                                <p class="stat-label">Visibility</p>
                                <p class="stat-value">{{ weather.current.vis_km }}<span class="stat-unit"> km</span></p>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" :style="{ width: Math.min(weather.current.vis_km / 20 * 100, 100) + '%', background: '#818cf8' }"></div>
                                </div>
                            </div>
                        </div>

                        <div class="stat-card glass-card">
                            <div class="stat-icon">🌡️</div>
                            <div class="stat-body">
                                <p class="stat-label">Pressure</p>
                                <p class="stat-value">{{ weather.current.pressure_mb }}<span class="stat-unit"> mb</span></p>
                                <p class="stat-sub">Sea level</p>
                            </div>
                        </div>

                        <div class="stat-card glass-card">
                            <div class="stat-icon">🌊</div>
                            <div class="stat-body">
                                <p class="stat-label">Dew Point</p>
                                <p class="stat-value">{{ weather.current.dewpoint_c }}<span class="stat-unit">°C</span></p>
                                <p class="stat-sub">Moisture in air</p>
                            </div>
                        </div>

                        <div class="stat-card glass-card">
                            <div class="stat-icon">☁️</div>
                            <div class="stat-body">
                                <p class="stat-label">Cloud Cover</p>
                                <p class="stat-value">{{ weather.current.cloud }}<span class="stat-unit">%</span></p>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" :style="{ width: weather.current.cloud + '%', background: 'rgba(255,255,255,0.4)' }"></div>
                                </div>
                            </div>
                        </div>

                        <div class="stat-card glass-card">
                            <div class="stat-icon">🔆</div>
                            <div class="stat-body">
                                <p class="stat-label">UV Index</p>
                                <p class="stat-value" :style="{ color: uvLevel.color }">
                                    {{ weather.current.uv }}<span class="stat-unit" style="font-size: 0.8rem"> ({{ uvLevel.label }})</span>
                                </p>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" :style="{ width: Math.min(weather.current.uv / 11 * 100, 100) + '%', background: uvLevel.color }"></div>
                                </div>
                            </div>
                        </div>

                        <div v-if="aqiLevel" class="stat-card glass-card">
                            <div class="stat-icon">🌿</div>
                            <div class="stat-body">
                                <p class="stat-label">Air Quality PM2.5</p>
                                <p class="stat-value" :style="{ color: aqiLevel.color }">
                                    {{ aqiLevel.val }}<span class="stat-unit"> µg/m³</span>
                                </p>
                                <p class="stat-sub" :style="{ color: aqiLevel.color }">{{ aqiLevel.label }}</p>
                            </div>
                        </div>

                    </div>

                    <!-- Footer coords -->
                    <p class="coords-line">
                        📍 {{ weather.location.lat }}°N, {{ weather.location.lon }}°E
                        &nbsp;·&nbsp;
                        tz {{ weather.location.tz_id }}
                    </p>

                </div>
            </Transition>

        </main>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

/* ── CSS Variables ── */
.page {
    --accent: #38bdf8;
    --accent2: #818cf8;
    --bg: #0f0f1a;
    --card-bg: linear-gradient(160deg, #1e1e38 0%, #16162a 100%);
    --card-border: rgba(255, 255, 255, 0.06);
    --text: #f1f5f9;
    --text-muted: rgba(255, 255, 255, 0.45);
    --text-dim: rgba(255, 255, 255, 0.25);

    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', system-ui, sans-serif;
    position: relative;
    overflow-x: hidden;
}

/* Sky condition tints */
.sky-sunny     { --glow-color: rgba(251, 191, 36, 0.10); }
.sky-clear-night { --glow-color: rgba(129, 140, 248, 0.10); }
.sky-cloudy    { --glow-color: rgba(148, 163, 184, 0.08); }
.sky-overcast  { --glow-color: rgba(100, 116, 139, 0.08); }
.sky-rain      { --glow-color: rgba(56, 189, 248, 0.12); }
.sky-snow      { --glow-color: rgba(186, 230, 253, 0.10); }
.sky-storm     { --glow-color: rgba(139, 92, 246, 0.12); }
.sky-default   { --glow-color: rgba(56, 189, 248, 0.09); }

/* ── Background layers ── */
.bg-layer {
    position: fixed;
    pointer-events: none;
    z-index: 0;
}

.bg-glow-top {
    top: -180px;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, var(--glow-color, rgba(56,189,248,0.09)) 0%, transparent 70%);
}

.bg-glow-mid {
    bottom: -100px;
    right: -100px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(129, 140, 248, 0.06) 0%, transparent 70%);
}

/* ── Top bar ── */
.top-bar {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 28px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
    padding: 8px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    font-family: inherit;
}

.back-btn:hover {
    background: rgba(56, 189, 248, 0.1);
    border-color: rgba(56, 189, 248, 0.25);
    color: var(--accent);
    transform: translateX(-2px);
}

.page-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: rgba(56, 189, 248, 0.7);
    background: rgba(56, 189, 248, 0.08);
    border: 1px solid rgba(56, 189, 248, 0.15);
    padding: 6px 14px;
    border-radius: 20px;
}

/* ── Main ── */
.main-content {
    position: relative;
    z-index: 1;
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 24px 80px;
}

/* ── Hero ── */
.page-hero {
    text-align: center;
    margin-bottom: 36px;
}

.hero-eyebrow {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(56, 189, 248, 0.8);
    font-weight: 600;
    margin: 0 0 12px;
    font-family: 'Outfit', sans-serif;
}

.hero-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 10px;
    line-height: 1.15;
    letter-spacing: -1px;
    font-family: 'Outfit', sans-serif;
}

.hero-sub {
    font-size: 0.95rem;
    color: var(--text-muted);
    margin: 0;
    font-weight: 400;
    line-height: 1.6;
}

/* ── Search ── */
.search-wrap {
    margin-bottom: 32px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.search-box {
    display: flex;
    align-items: center;
    gap: 0;
    background: linear-gradient(160deg, #1e1e38 0%, #16162a 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 6px 6px 6px 16px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-box:focus-within {
    border-color: rgba(56, 189, 248, 0.3);
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.07);
}

.search-icon {
    font-size: 1rem;
    margin-right: 10px;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 0.95rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
}

.search-input::placeholder {
    color: var(--text-dim);
}

.search-btn {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none;
    border-radius: 10px;
    color: #0f0f1a;
    font-size: 0.875rem;
    font-weight: 700;
    padding: 10px 22px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: opacity 0.2s, transform 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
}

.search-btn:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
}

.search-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(15, 15, 26, 0.3);
    border-top-color: #0f0f1a;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.error-msg {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: #f87171;
    background: rgba(248, 113, 113, 0.08);
    border: 1px solid rgba(248, 113, 113, 0.18);
    border-radius: 10px;
    padding: 10px 16px;
}

/* ── Skeleton ── */
.skeleton-wrap {
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: pulse 1.5s ease-in-out infinite;
}

.skel {
    background: linear-gradient(160deg, #1e1e38 0%, #16162a 100%);
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.04);
}

.skel-hero { height: 220px; }

.skel-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.skel-stat { height: 90px; border-radius: 12px; background: linear-gradient(160deg, #1e1e38 0%, #16162a 100%); border: 1px solid rgba(255,255,255,0.04); }

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* ── Glass card base ── */
.glass-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 18px;
}

/* ── Hero weather card ── */
.hero-card {
    padding: 32px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s ease;
}

.hero-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.04) 0%, transparent 60%);
    border-radius: 18px;
    pointer-events: none;
}

.hero-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 16px;
}

.location-block { flex: 1; }

.location-time {
    font-size: 0.75rem;
    color: rgba(56, 189, 248, 0.7);
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin: 0 0 2px;
    font-family: 'Outfit', sans-serif;
}

.location-date {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0 0 10px;
}

.location-name {
    font-size: clamp(1.4rem, 3vw, 1.9rem);
    font-weight: 700;
    color: var(--text);
    margin: 0 0 4px;
    line-height: 1.2;
    font-family: 'Outfit', sans-serif;
    letter-spacing: -0.3px;
}

.location-region {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
}

.condition-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.condition-icon {
    width: 80px;
    height: 80px;
    object-fit: contain;
    filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.3));
}

.condition-text {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
    margin: 0;
    max-width: 90px;
    line-height: 1.3;
}

.temp-display {
    display: flex;
    align-items: flex-start;
    gap: 2px;
    line-height: 1;
    margin-bottom: 10px;
}

.temp-value {
    font-size: clamp(3.5rem, 10vw, 5.5rem);
    font-weight: 700;
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    letter-spacing: -2px;
    line-height: 1;
}

.temp-unit {
    font-size: clamp(1.2rem, 3vw, 1.8rem);
    font-weight: 600;
    color: var(--accent);
    margin-top: 10px;
    font-family: 'Outfit', sans-serif;
}

.feels-like {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
}

.feels-like strong {
    color: rgba(255, 255, 255, 0.75);
}

/* ── Stats grid ── */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.stat-card {
    padding: 18px 18px 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    transition: border-color 0.2s ease, transform 0.2s ease;
}

.stat-card:hover {
    border-color: rgba(56, 189, 248, 0.14);
    transform: translateY(-2px);
}

.stat-icon {
    font-size: 1.4rem;
    flex-shrink: 0;
    margin-top: 2px;
}

.stat-body {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: 0.68rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
    font-weight: 600;
    margin: 0 0 4px;
    white-space: nowrap;
}

.stat-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 6px;
    font-family: 'Outfit', sans-serif;
    line-height: 1.2;
    letter-spacing: -0.2px;
}

.stat-unit {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-muted);
    font-family: 'DM Sans', sans-serif;
}

.stat-sub {
    font-size: 0.72rem;
    color: var(--text-dim);
    margin: 0;
}

.stat-bar {
    height: 3px;
    background: rgba(255,255,255,0.07);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 2px;
}

.stat-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

/* ── Coords footer ── */
.coords-line {
    text-align: center;
    font-size: 0.75rem;
    color: var(--text-dim);
    margin: 0;
    letter-spacing: 0.3px;
}

/* ── Fade-up transition ── */
.fade-up-enter-active {
    transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.fade-up-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

/* ── Responsive ── */
@media (max-width: 540px) {
    .top-bar { padding: 16px; }
    .main-content { padding: 32px 16px 60px; }
    .hero-card { padding: 22px 18px; }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .temp-value {
        letter-spacing: -2px;
    }
}
</style>