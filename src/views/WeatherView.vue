<script setup lang="ts">
import { ref } from 'vue';

const city = ref('');
const weather = ref<any>(null);
const loading = ref(false);
const error = ref('');

const API_KEY = '7996646101c04097b5562539262502';

const getWeather = async () => {
    if(!city.value) {
        return alert('Please Enter City Name!');
    }

    loading.value = true;
    error.value = '';

    try {
        const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city.value}&aqi=yes`);
        const data = await res.json();
        if(data.error) {
            error.value = data.error.message;
            weather.value = null;
        } else {
            weather.value = data;
        }
        console.log(data);
    } catch(err) {
        error.value = "Something Went Wrong.!";
    } finally {
        loading.value = false;
    }
}

const numberFormat = (value: number | undefined) => {
  if (value === undefined || value === null) return '-'
  return value.toFixed(1)
}
</script>

<template>
    <div class="container text-center mt-5">
        <h1>Weather App 🌤️</h1>
        <input v-model="city" placeholder="Enter city" class="form-control mb-3 " />
        <button @click="getWeather" class="btn btn-primary mb-4">Get Weather</button>

        <div v-if="loading">Loading...</div>
        <div v-if="error" class="text-danger">{{ error }}</div>

        <div v-if="weather" class="weather-card p-4 rounded shadow text-white" style="background: linear-gradient(135deg, #4a4e69, #22223b);">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <strong>Current weather</strong><br />
                    <small>{{ weather.location.localtime }}</small>
                </div>
            </div>
            <h2>{{ weather.location.name }}, {{ weather.location.region }}</h2>
            <div class="d-flex align-items-center">
                <img :src="weather.current.condition.icon" alt="weather icon" />
                <div class="ms-3">
                    <h1>{{ weather.current.temp_c }}°C</h1>
                    <p>Feels like {{ weather.current.feelslike_c }}°C</p>
                    <p>{{ weather.current.condition.text }}</p>
                </div>
            </div>

            <div class="d-flex flex-wrap justify-content-between mt-3">
            <div>
                <strong>Wind:</strong> {{ weather.current.wind_kph }} km/h
            </div>
            <div>
                <strong>Humidity:</strong> {{ weather.current.humidity }}%
            </div>
            <div>
                <strong>Visibility:</strong> {{ weather.current.vis_km }} km
            </div>
            <div>
                <strong>Pressure:</strong> {{ weather.current.pressure_mb }} mb
            </div>
            <div>
                <strong>Dew point:</strong> {{ weather.current.dewpoint_c }}°C
            </div>
            <!-- <div><strong>Air Quality (PM2.5):</strong> {{ weather.current.air_quality?.pm2_5 | numberFormat }}</div> -->
            </div>
        </div>
    </div>
</template>