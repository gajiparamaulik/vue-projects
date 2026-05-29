<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import "../assets/css/recipePage.css";

// ── Types 
interface Category {
  idCategory: string
  strCategory: string
  strCategoryThumb: string
  strCategoryDescription: string
}

interface Meal {
  idMeal: string
  strMeal: string
  strMealThumb: string
  strCategory?: string
  strArea?: string
  strInstructions?: string
  strYoutube?: string
  strSource?: string
  strTags?: string
  [key: string]: string | undefined
}

type ViewMode = 'categories' | 'results' | 'detail'

// ── Router ─────────────────────────────────────────────────────────────
const router = useRouter()
const goBack = () => router.back()

// ── State 
const categories      = ref<Category[]>([])
const meals           = ref<Meal[]>([])
const selectedMeal    = ref<Meal | null>(null)
const selectedIngredients = ref<string[]>([])

const searchQuery     = ref('')
const searchInput     = ref('')
const activeCategory  = ref('')
const viewMode        = ref<ViewMode>('categories')

const isLoadingCats   = ref(true)
const isLoadingMeals  = ref(false)
const isLoadingDetail = ref(false)
const errorMsg        = ref('')

// ── Fetch categories on mount ──────────────────────────────────────────
const fetchCategories = async () => {
  isLoadingCats.value = true
  errorMsg.value      = ''
  try {
    const res  = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php')
    const data = await res.json()
    categories.value = data.categories ?? []
  } catch {
    errorMsg.value = 'Failed to load categories. Please try again.'
  } finally {
    isLoadingCats.value = false
  }
}

// ── Search by ingredient ───────────────────────────────────────────────
const searchByIngredient = async (ingredient: string) => {
  if (!ingredient.trim()) return
  isLoadingMeals.value = true
  errorMsg.value       = ''
  meals.value          = []
  viewMode.value       = 'results'
  activeCategory.value = ''
  searchQuery.value    = ingredient.trim()
  try {
    const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient.trim())}`)
    const data = await res.json()
    meals.value = data.meals ?? []
    if (!meals.value.length) errorMsg.value = `No meals found with "${ingredient}"`
  } catch {
    errorMsg.value = 'Search failed. Please try again.'
  } finally {
    isLoadingMeals.value = false
  }
}

// ── Search by category ─────────────────────────────────────────────────
const searchByCategory = async (category: string) => {
  isLoadingMeals.value = true
  errorMsg.value       = ''
  meals.value          = []
  viewMode.value       = 'results'
  activeCategory.value = category
  searchQuery.value    = ''
  searchInput.value    = ''
  try {
    const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`)
    const data = await res.json()
    meals.value = data.meals ?? []
  } catch {
    errorMsg.value = 'Failed to load category meals.'
  } finally {
    isLoadingMeals.value = false
  }
}

// ── Load full meal detail ──────────────────────────────────────────────
const openMeal = async (meal: Meal) => {
  isLoadingDetail.value = true
  selectedIngredients.value = []
  selectedMeal.value    = meal   // show card immediately
  viewMode.value        = 'detail'
  document.body.style.overflow = 'hidden'
  try {
    const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
    const data = await res.json()
    const full = data.meals?.[0] ?? null
    if (full) {
      selectedMeal.value = full
      // parse up to 20 ingredient/measure pairs
      const ing: string[] = []
      for (let i = 1; i <= 20; i++) {
        const name    = full[`strIngredient${i}`]?.trim()
        const measure = full[`strMeasure${i}`]?.trim()
        if (name) ing.push(measure ? `${measure} ${name}` : name)
      }
      selectedIngredients.value = ing
    }
  } catch {
    // keep the basic card data
  } finally {
    isLoadingDetail.value = false
  }
}

const closeDetail = () => {
  viewMode.value = meals.value.length ? 'results' : 'categories'
  selectedMeal.value = null
  document.body.style.overflow = ''
}

const goToCategories = () => {
  viewMode.value       = 'categories'
  meals.value          = []
  searchQuery.value    = ''
  searchInput.value    = ''
  activeCategory.value = ''
  errorMsg.value       = ''
}

// ── Handle search submit ───────────────────────────────────────────────
const handleSearch = () => {
  if (searchInput.value.trim()) searchByIngredient(searchInput.value)
}

// ── Popular ingredients (quick search chips) ───────────────────────────
const popularIngredients = [
  'Chicken', 'Beef', 'Salmon', 'Pasta', 'Tomato',
  'Garlic', 'Egg', 'Cheese', 'Mushroom', 'Potato',
]

// ── Computed ────────────────────────────────────────────────────────────
const filteredCategories = computed(() => {
  const q = searchInput.value.toLowerCase().trim()
  if (!q || viewMode.value !== 'categories') return categories.value
  return categories.value.filter(c => c.strCategory.toLowerCase().includes(q))
})

const pageTitle = computed(() => {
  if (viewMode.value === 'results' && activeCategory.value) return activeCategory.value
  if (viewMode.value === 'results' && searchQuery.value)    return `"${searchQuery.value}"`
  return 'Recipe Finder'
})

// ── YouTube embed ID ───────────────────────────────────────────────────
const ytId = computed(() => {
  const url = selectedMeal.value?.strYoutube ?? ''
  const m   = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)
  return m?.[1] ?? ''
})

// ── Cleanup on unmount ─────────────────────────────────────────────────
import { onUnmounted } from 'vue'
onUnmounted(() => { document.body.style.overflow = '' })

onMounted(fetchCategories)
</script>

<template>
	<div class="page">
		<!-- Background layers -->
		<div class="bg-blob bg-blob-1"></div>
		<div class="bg-blob bg-blob-2"></div>
		<div class="bg-blob bg-blob-3"></div>
		<!-- ── Top bar ── -->
		<header class="top-bar">
			<button class="back-btn" @click="goBack">← Back</button>
			<div class="page-badge">🍽️ Recipe Finder</div>
		</header>
		<main class="main-content">
			<!-- ── Hero ── -->
			<div class="page-hero">
				<!-- <p class="hero-eyebrow">Powered by TheMealDB</p> -->
				<h1 class="hero-title">
          Discover<br/>
          <span class="title-accent">Delicious</span> Recipes
        </h1>
				<p class="hero-sub">Search by ingredient or browse by category</p>
			</div>
			<!-- ── Search bar ── -->
			<div class="search-section">
				<div class="search-box" :class="{ focused: searchInput }"> <span class="search-icon">🔍</span>
					<input v-model="searchInput" class="search-input" placeholder="Search by ingredient — e.g. chicken, garlic, salmon…" @keydown.enter="handleSearch" />
					<button v-if="searchInput" class="search-clear" @click="searchInput = ''">✕</button>
					<button class="search-btn" @click="handleSearch" :disabled="!searchInput.trim()"> Search </button>
				</div>
				<!-- Quick ingredient chips -->
				<div class="chips-row"> <span class="chips-label">Quick:</span>
					<button v-for="ing in popularIngredients" :key="ing" class="ing-chip" :class="{ active: searchQuery === ing }" @click="searchByIngredient(ing)">{{ ing }}</button>
				</div>
			</div>
			<!-- ── Breadcrumb nav ── -->
			<div class="breadcrumb" v-if="viewMode !== 'categories'">
				<button class="bc-link" @click="goToCategories">All Categories</button> <span class="bc-sep">›</span> <span class="bc-current">{{ pageTitle }}</span> </div>
			<!-- ══════════════════════════════════════════
           CATEGORIES VIEW
      ══════════════════════════════════════════ -->
			<template v-if="viewMode === 'categories'">
				<!-- Loading -->
				<div v-if="isLoadingCats" class="skel-grid cat-grid">
					<div v-for="i in 14" :key="i" class="skel-cat">
						<div class="skel skel-img"></div>
						<div class="skel skel-txt"></div>
					</div>
				</div>
				<!-- Error -->
				<div v-else-if="errorMsg" class="state-card"> <span class="state-icon">⚠️</span>
					<p>{{ errorMsg }}</p>
					<button class="action-btn" @click="fetchCategories">Retry</button>
				</div>
				<template v-else>
					<p class="section-label">Browse Categories</p>
					<div class="cat-grid">
						<button v-for="cat in filteredCategories" :key="cat.idCategory" class="cat-card" @click="searchByCategory(cat.strCategory)">
							<div class="cat-img-wrap"> <img :src="cat.strCategoryThumb" :alt="cat.strCategory" class="cat-img" loading="lazy" />
								<div class="cat-overlay"></div>
							</div>
							<div class="cat-info">
								<p class="cat-name">{{ cat.strCategory }}</p>
							</div>
						</button>
					</div>
				</template>
			</template>
			<!-- ══════════════════════════════════════════
           RESULTS VIEW
      ══════════════════════════════════════════ -->
			<template v-else-if="viewMode === 'results'">
				<!-- Result header -->
				<div class="results-header">
					<div>
						<p class="section-label"> {{ activeCategory ? 'Category' : 'Ingredient search' }} </p>
						<h2 class="results-title">{{ pageTitle }}</h2> </div> <span class="results-count" v-if="!isLoadingMeals">
            {{ meals.length }} meal{{ meals.length !== 1 ? 's' : '' }}
          </span> </div>
				<!-- Loading -->
				<div v-if="isLoadingMeals" class="skel-grid meal-grid">
					<div v-for="i in 8" :key="i" class="skel-meal">
						<div class="skel skel-meal-img"></div>
						<div class="skel skel-meal-txt"></div>
						<div class="skel skel-meal-txt2"></div>
					</div>
				</div>
				<!-- No results -->
				<div v-else-if="!meals.length" class="state-card"> <span class="state-icon">🥘</span>
					<p>{{ errorMsg || 'No meals found. Try a different ingredient.' }}</p>
					<button class="action-btn" @click="goToCategories">Browse Categories</button>
				</div>
				<!-- Meal grid -->
				<TransitionGroup v-else name="card" tag="div" class="meal-grid">
					<button v-for="meal in meals" :key="meal.idMeal" class="meal-card" @click="openMeal(meal)">
						<div class="meal-img-wrap"> <img :src="meal.strMealThumb" :alt="meal.strMeal" class="meal-img" loading="lazy" />
							<div class="meal-img-overlay"> <span class="view-btn">View Recipe →</span> </div>
						</div>
						<div class="meal-info">
							<p class="meal-name">{{ meal.strMeal }}</p>
							<p class="meal-meta" v-if="meal.strCategory || meal.strArea"> <span v-if="meal.strCategory">{{ meal.strCategory }}</span> <span v-if="meal.strArea">· {{ meal.strArea }}</span> </p>
						</div>
					</button>
				</TransitionGroup>
			</template>
		</main>
		<!-- ══════════════════════════════════════════════════
         MEAL DETAIL DRAWER
    ══════════════════════════════════════════════════ -->
		<Teleport to="body">
			<Transition name="overlay">
				<div v-if="viewMode === 'detail'" class="detail-overlay" @click.self="closeDetail">
					<Transition name="drawer">
						<div v-if="viewMode === 'detail'" class="detail-drawer" role="dialog" aria-modal="true">
							<!-- Drawer hero image -->
							<div class="detail-hero"> <img v-if="selectedMeal?.strMealThumb" :src="selectedMeal.strMealThumb + '/preview'" :alt="selectedMeal?.strMeal" class="detail-hero-img" />
								<div class="detail-hero-overlay"></div>
								<button class="detail-close" @click="closeDetail" aria-label="Close">✕</button>
								<div class="detail-hero-text">
									<div class="detail-tags" v-if="selectedMeal?.strTags"> <span v-for="tag in (selectedMeal.strTags ?? '').split(',')" :key="tag" class="detail-tag">
                      {{ tag.trim() }}
                    </span> </div>
									<h2 class="detail-title">{{ selectedMeal?.strMeal }}</h2>
									<div class="detail-meta"> <span v-if="selectedMeal?.strCategory" class="detail-badge">🍽 {{ selectedMeal.strCategory }}</span> <span v-if="selectedMeal?.strArea" class="detail-badge">🌍 {{ selectedMeal.strArea }}</span> </div>
								</div>
							</div>
							<!-- Drawer body -->
							<div class="detail-body">
								<!-- Loading indicator -->
								<div v-if="isLoadingDetail" class="detail-loading">
									<div class="loading-dots"> <span></span><span></span><span></span> </div>
									<p>Loading full recipe…</p>
								</div>
								<template v-else>
									<!-- Ingredients -->
									<section v-if="selectedIngredients.length" class="detail-section">
										<h3 class="detail-section-title">
                      <span class="section-icon">🥬</span> Ingredients
                      <span class="ing-count">{{ selectedIngredients.length }} items</span>
                    </h3>
										<div class="ing-grid">
											<div v-for="(ing, i) in selectedIngredients" :key="i" class="ing-item"> <span class="ing-dot"></span> <span>{{ ing }}</span> </div>
										</div>
									</section>
									<!-- Instructions -->
									<section v-if="selectedMeal?.strInstructions" class="detail-section">
										<h3 class="detail-section-title">
                      <span class="section-icon">📋</span> Instructions
                    </h3>
										<div class="instructions">
											<p v-for="(step, i) in (selectedMeal.strInstructions ?? '').split(/\r?\n/).filter(s => s.trim())" :key="i" class="instruction-step">{{ step }}</p>
										</div>
									</section>
									<!-- YouTube -->
									<section v-if="ytId" class="detail-section">
										<h3 class="detail-section-title">
                      <span class="section-icon">▶️</span> Video Tutorial
                    </h3>
										<div class="yt-wrap">
											<iframe :src="`https://www.youtube.com/embed/${ytId}`" frameborder="0" allowfullscreen class="yt-frame" loading="lazy"></iframe>
										</div>
									</section>
									<!-- Links -->
									<div class="detail-links" v-if="selectedMeal?.strSource || selectedMeal?.strYoutube"> <a v-if="selectedMeal?.strSource" :href="selectedMeal.strSource" target="_blank" rel="noopener" class="detail-link">🔗 View Original Recipe</a> <a v-if="selectedMeal?.strYoutube" :href="selectedMeal.strYoutube" target="_blank" rel="noopener" class="detail-link yt-link">▶ Watch on YouTube</a> </div>
								</template>
							</div>
						</div>
					</Transition>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>