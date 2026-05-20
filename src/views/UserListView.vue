<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'

// ── Types ─────────────────────────────────────────────────────────────
interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  image: string
  age: number
  gender: string
  company: { name: string }
  address: { city: string; country: string }
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  age?: string
  city?: string
  company?: string
  gender?: string
}

// ── Router & Toast ────────────────────────────────────────────────────
const router = useRouter()
const toast  = useToast()
const goBack = () => router.back()

// ── State ─────────────────────────────────────────────────────────────
const allUsers    = ref<User[]>([])
const isLoading   = ref(true)
const error       = ref<string | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const viewMode    = ref<'grid' | 'list'>('grid')

// ── Config ────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 12
const VIRTUAL_ITEM_H = 88
const VIRTUAL_BUFFER = 3

// ── Fetch ─────────────────────────────────────────────────────────────
const fetchUsers = async () => {
  isLoading.value = true
  error.value     = null
  try {
    const res = await axios.get('https://dummyjson.com/users?limit=100')
    allUsers.value = res.data.users
  } catch {
    error.value = 'Failed to fetch users. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchUsers)

// ── Search ────────────────────────────────────────────────────────────
const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return allUsers.value
  return allUsers.value.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.address.city.toLowerCase().includes(q) ||
    u.company?.name.toLowerCase().includes(q)
  )
})

watch(searchQuery, () => { currentPage.value = 1 })

// ── Pagination ────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / ITEMS_PER_PAGE)))

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredUsers.value.slice(start, start + ITEMS_PER_PAGE)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  const pages: (number | '...')[] = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

const goToPage = (p: number | '...') => {
  if (p === '...') return
  currentPage.value = p as number
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Virtual Scrolling ─────────────────────────────────────────────────
const scrollContainer = ref<HTMLElement | null>(null)
const scrollTop       = ref(0)
const containerH      = ref(520)

const totalVH = computed(() => filteredUsers.value.length * VIRTUAL_ITEM_H)

const visibleStart = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / VIRTUAL_ITEM_H) - VIRTUAL_BUFFER)
)
const visibleEnd = computed(() =>
  Math.min(
    filteredUsers.value.length,
    Math.ceil((scrollTop.value + containerH.value) / VIRTUAL_ITEM_H) + VIRTUAL_BUFFER
  )
)
const virtualItems = computed(() =>
  filteredUsers.value.slice(visibleStart.value, visibleEnd.value)
)
const topPad    = computed(() => visibleStart.value * VIRTUAL_ITEM_H)
const bottomPad = computed(() => (filteredUsers.value.length - visibleEnd.value) * VIRTUAL_ITEM_H)

const onScroll = (e: Event) => {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}

let ro: ResizeObserver | null = null
watch(scrollContainer, (el) => {
  if (!el) return
  ro = new ResizeObserver(entries => { containerH.value = entries[0].contentRect.height })
  ro.observe(el)
})
onUnmounted(() => ro?.disconnect())

// ── Helpers ───────────────────────────────────────────────────────────
const avatarColor = (id: number) => {
  const colors = [
    'rgba(56,189,248,0.18)', 'rgba(129,140,248,0.18)',
    'rgba(74,222,128,0.18)', 'rgba(251,191,36,0.18)',
    'rgba(248,113,113,0.18)', 'rgba(192,132,252,0.18)',
  ]
  return colors[id % colors.length]
}
const avatarText = (u: User) => `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
const genderIcon = (g: string) => g === 'male' ? '♂' : '♀'
const startIdx   = computed(() => (currentPage.value - 1) * ITEMS_PER_PAGE + 1)
const endIdx     = computed(() => Math.min(currentPage.value * ITEMS_PER_PAGE, filteredUsers.value.length))

// ═══════════════════════════════════════════════════════════════════════
// ADD USER MODAL
// ═══════════════════════════════════════════════════════════════════════

const showModal  = ref(false)
const isSubmitting = ref(false)

const emptyForm = () => ({
  firstName: '',
  lastName:  '',
  email:     '',
  phone:     '',
  age:       '' as string | number,
  gender:    'male' as 'male' | 'female',
  city:      '',
  company:   '',
})

const form       = ref(emptyForm())
const formErrors = ref<FormErrors>({})
const touched    = ref<Record<string, boolean>>({})

// Validation rules
const validate = (): boolean => {
  const e: FormErrors = {}
  if (!form.value.firstName.trim())
    e.firstName = 'First name is required'
  else if (form.value.firstName.trim().length < 2)
    e.firstName = 'At least 2 characters'

  if (!form.value.lastName.trim())
    e.lastName = 'Last name is required'
  else if (form.value.lastName.trim().length < 2)
    e.lastName = 'At least 2 characters'

  if (!form.value.email.trim())
    e.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email))
    e.email = 'Enter a valid email address'

  if (!form.value.phone.trim())
    e.phone = 'Phone number is required'
  else if (form.value.phone.trim().length < 7)
    e.phone = 'Enter a valid phone number'

  const ageNum = Number(form.value.age)
  if (!form.value.age)
    e.age = 'Age is required'
  else if (isNaN(ageNum) || ageNum < 1 || ageNum > 120)
    e.age = 'Enter a valid age (1–120)'

  if (!form.value.city.trim())
    e.city = 'City is required'

  if (!form.value.company.trim())
    e.company = 'Company is required'

  formErrors.value = e
  return Object.keys(e).length === 0
}

// Live validate touched fields
watch(form, () => {
  if (Object.keys(touched.value).length === 0) return
  const e: FormErrors = {}
  if (touched.value.firstName) {
    if (!form.value.firstName.trim()) e.firstName = 'First name is required'
    else if (form.value.firstName.trim().length < 2) e.firstName = 'At least 2 characters'
  }
  if (touched.value.lastName) {
    if (!form.value.lastName.trim()) e.lastName = 'Last name is required'
    else if (form.value.lastName.trim().length < 2) e.lastName = 'At least 2 characters'
  }
  if (touched.value.email) {
    if (!form.value.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) e.email = 'Enter a valid email address'
  }
  if (touched.value.phone) {
    if (!form.value.phone.trim()) e.phone = 'Phone number is required'
    else if (form.value.phone.trim().length < 7) e.phone = 'Enter a valid phone number'
  }
  if (touched.value.age) {
    const n = Number(form.value.age)
    if (!form.value.age) e.age = 'Age is required'
    else if (isNaN(n) || n < 1 || n > 120) e.age = 'Enter a valid age (1–120)'
  }
  if (touched.value.city && !form.value.city.trim()) e.city = 'City is required'
  if (touched.value.company && !form.value.company.trim()) e.company = 'Company is required'
  formErrors.value = e
}, { deep: true })

const openModal = () => {
  form.value       = emptyForm()
  formErrors.value = {}
  touched.value    = {}
  showModal.value  = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = ''
}

// Close on Escape key
const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
watch(showModal, (v) => {
  if (v) window.addEventListener('keydown', onKeydown)
  else   window.removeEventListener('keydown', onKeydown)
})

const touch = (field: string) => { touched.value[field] = true }

const submitUser = async () => {
  // Touch all fields to show errors
  Object.keys(emptyForm()).forEach(k => { touched.value[k] = true })
  if (!validate()) {
    toast.warning('Fix form errors', 'Please fill in all required fields correctly.')
    return
  }

  isSubmitting.value = true
  try {
    // POST to dummyjson (it returns a fake created user)
    const res = await axios.post('https://dummyjson.com/users/add', {
      firstName: form.value.firstName.trim(),
      lastName:  form.value.lastName.trim(),
      email:     form.value.email.trim(),
      phone:     form.value.phone.trim(),
      age:       Number(form.value.age),
      gender:    form.value.gender,
      address:   { city: form.value.city.trim() },
      company:   { name: form.value.company.trim() },
    })

    // Add to local list with the returned id (dummyjson returns id 101)
    const newUser: User = {
      id:        res.data.id ?? Date.now(),
      firstName: form.value.firstName.trim(),
      lastName:  form.value.lastName.trim(),
      email:     form.value.email.trim(),
      phone:     form.value.phone.trim(),
      age:       Number(form.value.age),
      gender:    form.value.gender,
      image:     '',
      company:   { name: form.value.company.trim() },
      address:   { city: form.value.city.trim(), country: '' },
    }

    allUsers.value = [newUser, ...allUsers.value]
    currentPage.value = 1
    closeModal()
    toast.success('User added!', `${newUser.firstName} ${newUser.lastName} has been added.`)
  } catch {
    toast.deleted('Failed to add user', 'Something went wrong. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <!-- ── Top bar ── -->
    <header class="top-bar">
      <button class="back-btn" @click="goBack">
        <span>←</span><span>Back</span>
      </button>
      <div class="page-badge">👥 User Directory</div>
    </header>

    <main class="main-content">

      <!-- ── Hero ── -->
      <div class="page-hero">
        <p class="hero-eyebrow">People</p>
        <h1 class="hero-title">User Directory</h1>
        <p class="hero-sub">Browse, search and explore all registered users</p>
      </div>

      <!-- ── Stats bar ── -->
      <div class="stats-bar" v-if="!isLoading && !error">
        <div class="stat-item">
          <span class="stat-num">{{ allUsers.length }}</span>
          <span class="stat-lbl">Total</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num accent-blue">{{ filteredUsers.length }}</span>
          <span class="stat-lbl">Matching</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num accent-green">{{ totalPages }}</span>
          <span class="stat-lbl">Pages</span>
        </div>
        <div class="stat-spacer"></div>
        <!-- Add User button -->
        <button class="add-user-btn" @click="openModal">
          <span class="add-user-icon">＋</span>
          <span>Add User</span>
        </button>
        <div class="view-toggle">
          <button :class="['vt-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'" title="Grid view">⊞ Grid</button>
          <button :class="['vt-btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'" title="Virtual scroll">⚡ Virtual</button>
        </div>
      </div>

      <!-- ── Search ── -->
      <div class="search-wrap" v-if="!isLoading && !error">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="Search by name, email, city or company..."
          />
          <Transition name="fade-quick">
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
          </Transition>
          <Transition name="fade-quick">
            <span class="search-count" v-if="searchQuery">
              {{ filteredUsers.length }} result{{ filteredUsers.length !== 1 ? 's' : '' }}
            </span>
          </Transition>
        </div>
      </div>

      <!-- ── Loading skeleton ── -->
      <div v-if="isLoading" class="skeleton-grid">
        <div v-for="i in 12" :key="i" class="skel-card">
          <div class="skel skel-avatar"></div>
          <div class="skel-lines">
            <div class="skel skel-line w70"></div>
            <div class="skel skel-line w50"></div>
            <div class="skel skel-line w90"></div>
          </div>
        </div>
      </div>

      <!-- ── Error ── -->
      <div v-else-if="error" class="state-card">
        <span class="state-icon">⚠️</span>
        <p class="error-msg">{{ error }}</p>
        <button class="action-btn" @click="fetchUsers">Retry</button>
      </div>

      <!-- ── Empty search ── -->
      <div v-else-if="filteredUsers.length === 0" class="state-card">
        <span class="state-icon">🔍</span>
        <p class="state-msg">No users match "<strong>{{ searchQuery }}</strong>"</p>
        <button class="action-btn" @click="searchQuery = ''">Clear search</button>
      </div>

      <template v-else>

        <!-- ══════════ GRID MODE ══════════ -->
        <Transition name="fade" mode="out-in">
          <div v-if="viewMode === 'grid'" key="grid">
            <TransitionGroup name="card" tag="div" class="user-grid">
              <div v-for="user in pagedUsers" :key="user.id" class="user-card">
                <div class="card-top">
                  <div class="card-avatar" :style="{ background: avatarColor(user.id) }">
                    <img
                      v-if="user.image"
                      :src="user.image"
                      :alt="`${user.firstName}`"
                      class="avatar-img"
                      loading="lazy"
                      @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
                    />
                    <span class="avatar-fallback">{{ avatarText(user) }}</span>
                  </div>
                  <div class="card-id">#{{ String(user.id).padStart(3,'0') }}</div>
                </div>
                <div class="card-info">
                  <div class="card-name-row">
                    <h3 class="card-name">{{ user.firstName }} {{ user.lastName }}</h3>
                    <span class="gender-badge">{{ genderIcon(user.gender) }}</span>
                  </div>
                  <p class="card-email">{{ user.email }}</p>
                  <div class="card-chips">
                    <span class="chip">📍 {{ user.address.city }}</span>
                    <span class="chip">🏢 {{ user.company?.name }}</span>
                  </div>
                </div>
                <div class="card-footer">
                  <span class="age-badge">Age {{ user.age }}</span>
                  <span class="phone-text">{{ user.phone }}</span>
                </div>
                <div class="card-glow" aria-hidden="true"></div>
              </div>
            </TransitionGroup>

            <!-- Pagination -->
            <nav class="pagination" v-if="totalPages > 1">
              <button class="pg-btn pg-arrow" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">←</button>
              <button
                v-for="(p, i) in pageNumbers" :key="i"
                class="pg-btn"
                :class="{ active: p === currentPage, dots: p === '...' }"
                @click="goToPage(p)"
                :disabled="p === '...'"
              >{{ p }}</button>
              <button class="pg-btn pg-arrow" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">→</button>
            </nav>
            <p class="page-info">Showing {{ startIdx }}–{{ endIdx }} of {{ filteredUsers.length }} users</p>
          </div>
        </Transition>

        <!-- ══════════ VIRTUAL LIST MODE ══════════ -->
        <Transition name="fade" mode="out-in">
          <div v-if="viewMode === 'list'" key="list">
            <div class="virtual-info">
              <span class="vi-badge">⚡ Virtual Scroll</span>
              Rendering <strong style="color:rgba(255,255,255,0.6)">{{ visibleEnd - visibleStart }}</strong> of
              <strong style="color:rgba(255,255,255,0.6)">{{ filteredUsers.length }}</strong> rows in DOM
            </div>
            <div ref="scrollContainer" class="virtual-container" @scroll.passive="onScroll">
              <div :style="{ height: totalVH + 'px', position: 'relative' }">
                <div :style="{ height: topPad + 'px' }"></div>
                <div
                  v-for="user in virtualItems" :key="user.id"
                  class="vrow" :style="{ height: VIRTUAL_ITEM_H + 'px' }"
                >
                  <div class="vrow-avatar" :style="{ background: avatarColor(user.id) }">
                    <img
                      v-if="user.image" :src="user.image" :alt="`${user.firstName}`"
                      class="avatar-img" loading="lazy"
                      @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')"
                    />
                    <span class="avatar-fallback">{{ avatarText(user) }}</span>
                  </div>
                  <div class="vrow-main">
                    <div class="vrow-name">
                      {{ user.firstName }} {{ user.lastName }}
                      <span class="gender-badge">{{ genderIcon(user.gender) }}</span>
                      <span class="age-badge sm">{{ user.age }}</span>
                    </div>
                    <div class="vrow-sub">{{ user.email }}</div>
                  </div>
                  <div class="vrow-right">
                    <span class="chip sm">📍 {{ user.address.city }}</span>
                    <span class="chip sm hide-mobile">🏢 {{ user.company?.name }}</span>
                  </div>
                  <div class="vrow-id">#{{ String(user.id).padStart(3,'0') }}</div>
                </div>
                <div :style="{ height: bottomPad + 'px' }"></div>
              </div>
            </div>
            <p class="page-info" style="margin-top:12px">All {{ filteredUsers.length }} users · scroll to explore</p>
          </div>
        </Transition>

      </template>
    </main>

    <!-- ═══════════════════════════════════════════
         ADD USER MODAL (slide-in drawer)
    ═══════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <Transition name="drawer">
            <div v-if="showModal" class="modal-drawer" role="dialog" aria-modal="true" aria-label="Add new user">

              <!-- Drawer header -->
              <div class="drawer-header">
                <div class="drawer-title-row">
                  <div class="drawer-icon">👤</div>
                  <div>
                    <h2 class="drawer-title">Add New User</h2>
                    <p class="drawer-sub">Fill in the details below</p>
                  </div>
                </div>
                <button class="drawer-close" @click="closeModal" aria-label="Close">✕</button>
              </div>

              <!-- Drawer body — scrollable form -->
              <div class="drawer-body">
                <form @submit.prevent="submitUser" novalidate>

                  <!-- Row: First + Last name -->
                  <div class="form-row">
                    <div class="form-group" :class="{ error: formErrors.firstName }">
                      <label class="form-label">First Name <span class="required">*</span></label>
                      <input
                        v-model="form.firstName"
                        class="form-input"
                        placeholder="e.g. Maulik"
                        @blur="touch('firstName')"
                      />
                      <Transition name="err">
                        <p v-if="formErrors.firstName" class="form-error">{{ formErrors.firstName }}</p>
                      </Transition>
                    </div>
                    <div class="form-group" :class="{ error: formErrors.lastName }">
                      <label class="form-label">Last Name <span class="required">*</span></label>
                      <input
                        v-model="form.lastName"
                        class="form-input"
                        placeholder="e.g. Gajipara"
                        @blur="touch('lastName')"
                      />
                      <Transition name="err">
                        <p v-if="formErrors.lastName" class="form-error">{{ formErrors.lastName }}</p>
                      </Transition>
                    </div>
                  </div>

                  <!-- Email -->
                  <div class="form-group" :class="{ error: formErrors.email }">
                    <label class="form-label">Email <span class="required">*</span></label>
                    <input
                      v-model="form.email"
                      class="form-input"
                      type="email"
                      placeholder="e.g. maulik@example.com"
                      @blur="touch('email')"
                    />
                    <Transition name="err">
                      <p v-if="formErrors.email" class="form-error">{{ formErrors.email }}</p>
                    </Transition>
                  </div>

                  <!-- Phone -->
                  <div class="form-group" :class="{ error: formErrors.phone }">
                    <label class="form-label">Phone <span class="required">*</span></label>
                    <input
                      v-model="form.phone"
                      class="form-input"
                      placeholder="e.g. +91 98765 43210"
                      @blur="touch('phone')"
                    />
                    <Transition name="err">
                      <p v-if="formErrors.phone" class="form-error">{{ formErrors.phone }}</p>
                    </Transition>
                  </div>

                  <!-- Row: Age + Gender -->
                  <div class="form-row">
                    <div class="form-group" :class="{ error: formErrors.age }">
                      <label class="form-label">Age <span class="required">*</span></label>
                      <input
                        v-model="form.age"
                        class="form-input"
                        type="number"
                        min="1" max="120"
                        placeholder="e.g. 28"
                        @blur="touch('age')"
                      />
                      <Transition name="err">
                        <p v-if="formErrors.age" class="form-error">{{ formErrors.age }}</p>
                      </Transition>
                    </div>
                    <div class="form-group" :class="{ error: formErrors.gender }">
                      <label class="form-label">Gender <span class="required">*</span></label>
                      <div class="gender-toggle">
                        <button
                          type="button"
                          :class="['gt-btn', { active: form.gender === 'male' }]"
                          @click="form.gender = 'male'"
                        >♂ Male</button>
                        <button
                          type="button"
                          :class="['gt-btn', { active: form.gender === 'female' }]"
                          @click="form.gender = 'female'"
                        >♀ Female</button>
                      </div>
                    </div>
                  </div>

                  <!-- City -->
                  <div class="form-group" :class="{ error: formErrors.city }">
                    <label class="form-label">City <span class="required">*</span></label>
                    <input
                      v-model="form.city"
                      class="form-input"
                      placeholder="e.g. Ahmedabad"
                      @blur="touch('city')"
                    />
                    <Transition name="err">
                      <p v-if="formErrors.city" class="form-error">{{ formErrors.city }}</p>
                    </Transition>
                  </div>

                  <!-- Company -->
                  <div class="form-group" :class="{ error: formErrors.company }">
                    <label class="form-label">Company <span class="required">*</span></label>
                    <input
                      v-model="form.company"
                      class="form-input"
                      placeholder="e.g. IBM India"
                      @blur="touch('company')"
                    />
                    <Transition name="err">
                      <p v-if="formErrors.company" class="form-error">{{ formErrors.company }}</p>
                    </Transition>
                  </div>

                </form>
              </div>

              <!-- Drawer footer -->
              <div class="drawer-footer">
                <button class="cancel-btn" @click="closeModal" :disabled="isSubmitting">Cancel</button>
                <button class="submit-btn" @click="submitUser" :disabled="isSubmitting">
                  <span v-if="!isSubmitting">＋ Add User</span>
                  <span v-else class="btn-spinner"></span>
                </button>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

/* ── Page ── */
.page {
  min-height: 100vh;
  background: #0f0f1a;
  font-family: 'Segoe UI', system-ui, sans-serif;
  position: relative; overflow-x: hidden;
}

.bg-glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; }
.bg-glow-1 {
  top: -180px; left: 50%; transform: translateX(-50%);
  width: 800px; height: 800px;
  background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%);
}
.bg-glow-2 {
  bottom: -80px; right: -80px; width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%);
}

/* ── Top bar ── */
.top-bar {
  position: relative; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.back-btn {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.7);
  padding: 8px 16px; border-radius: 10px;
  cursor: pointer; font-size: 0.875rem; font-weight: 500;
  transition: all 0.2s ease; font-family: inherit;
}
.back-btn:hover {
  background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.25);
  color: #38bdf8; transform: translateX(-2px);
}
.page-badge {
  font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px;
  color: rgba(56,189,248,0.7);
  background: rgba(56,189,248,0.08);
  border: 1px solid rgba(56,189,248,0.15);
  padding: 6px 14px; border-radius: 20px;
}

/* ── Main ── */
.main-content {
  position: relative; z-index: 1;
  max-width: 1200px; margin: 0 auto;
  padding: 48px 24px 80px;
}

/* ── Hero ── */
.page-hero { text-align: center; margin-bottom: 36px; }
.hero-eyebrow {
  font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
  color: rgba(56,189,248,0.8); font-weight: 600; margin: 0 0 12px;
}
.hero-title {
  font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 800;
  color: #f8fafc; margin: 0 0 10px; line-height: 1.1; letter-spacing: -1px;
}
.hero-sub { font-size: 0.95rem; color: rgba(255,255,255,0.45); margin: 0; line-height: 1.6; }

/* ── Stats bar ── */
.stats-bar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  background: linear-gradient(160deg, #1e1e38 0%, #16162a 100%);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px; padding: 14px 20px; margin-bottom: 20px;
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-num  { font-size: 1.4rem; font-weight: 800; color: #f1f5f9; line-height: 1; }
.stat-num.accent-blue  { color: #38bdf8; }
.stat-num.accent-green { color: #4ade80; }
.stat-lbl { font-size: 0.65rem; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
.stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.07); }
.stat-spacer  { flex: 1; }

/* ── Add User button ── */
.add-user-btn {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  color: #0f0f1a; border: none; border-radius: 10px;
  padding: 9px 18px; font-size: 0.875rem; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(56,189,248,0.2);
}
.add-user-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(56,189,248,0.3); }
.add-user-btn:active { transform: translateY(0); }
.add-user-icon { font-size: 1.1rem; }

/* ── View toggle ── */
.view-toggle { display: flex; gap: 6px; }
.vt-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 13px; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.4);
  font-size: 0.8rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.vt-btn.active { background: rgba(56,189,248,0.12); border-color: rgba(56,189,248,0.3); color: #38bdf8; }
.vt-btn:hover:not(.active) { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.15); }

/* ── Search ── */
.search-wrap { margin-bottom: 28px; }
.search-box {
  display: flex; align-items: center;
  background: linear-gradient(160deg, #1e1e38 0%, #16162a 100%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; padding: 8px 8px 8px 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-box:focus-within { border-color: rgba(56,189,248,0.3); box-shadow: 0 0 0 3px rgba(56,189,248,0.07); }
.search-icon { font-size: 1rem; margin-right: 10px; flex-shrink: 0; }
.search-input { flex: 1; background: none; border: none; outline: none; color: #f1f5f9; font-size: 0.95rem; font-family: inherit; }
.search-input::placeholder { color: rgba(255,255,255,0.25); }
.search-clear {
  background: rgba(255,255,255,0.07); border: none; cursor: pointer;
  color: rgba(255,255,255,0.4); width: 26px; height: 26px; border-radius: 50%; font-size: 0.65rem;
  display: flex; align-items: center; justify-content: center; margin-right: 6px; transition: all 0.2s;
}
.search-clear:hover { background: rgba(248,113,113,0.15); color: #f87171; }
.search-count {
  font-size: 0.72rem; color: rgba(56,189,248,0.7); font-weight: 600;
  background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.15);
  padding: 3px 12px; border-radius: 20px; white-space: nowrap; margin-right: 4px;
}

/* ── Skeleton ── */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.skel-card {
  background: linear-gradient(160deg, #1e1e38 0%, #16162a 100%);
  border: 1px solid rgba(255,255,255,0.04); border-radius: 16px; padding: 20px;
  display: flex; gap: 14px; animation: pulse 1.5s ease-in-out infinite;
}
.skel { background: rgba(255,255,255,0.06); border-radius: 8px; }
.skel-avatar { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; }
.skel-lines  { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.skel-line   { height: 11px; border-radius: 6px; }
.w70 { width: 70%; } .w50 { width: 50%; } .w90 { width: 90%; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ── State cards ── */
.state-card {
  text-align: center; padding: 64px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  background: linear-gradient(160deg, #1e1e38 0%, #16162a 100%);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 18px;
}
.state-icon { font-size: 2.8rem; }
.error-msg  { color: #f87171; font-size: 0.95rem; margin: 0; }
.state-msg  { color: rgba(255,255,255,0.5); font-size: 0.95rem; margin: 0; }
.state-msg strong { color: rgba(255,255,255,0.8); }
.action-btn {
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  color: #0f0f1a; border: none; border-radius: 10px;
  padding: 10px 22px; font-size: 0.875rem; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: opacity 0.2s, transform 0.15s;
}
.action-btn:hover { opacity: 0.88; transform: translateY(-1px); }

/* ════════════════════════════
   GRID cards
════════════════════════════ */
.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 16px; margin-bottom: 32px;
}
.user-card {
  background: linear-gradient(160deg, #1e1e38 0%, #16162a 100%);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
  position: relative; overflow: hidden; cursor: default;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.user-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(56,189,248,0.14);
  border-color: rgba(56,189,248,0.2);
}
.user-card:hover .card-glow { opacity: 1; }
.card-glow {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(135deg, rgba(56,189,248,0.05) 0%, transparent 60%);
  border-radius: 18px; opacity: 0; transition: opacity 0.25s ease;
}
.card-top { display: flex; align-items: flex-start; justify-content: space-between; }
.card-avatar {
  width: 54px; height: 54px; border-radius: 14px;
  position: relative; overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; border-radius: inherit; }
.avatar-fallback { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.7); position: relative; z-index: 1; }
.card-id {
  font-size: 0.65rem; font-weight: 600; color: rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  padding: 3px 9px; border-radius: 20px;
}
.card-info { flex: 1; }
.card-name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.card-name { font-size: 1rem; font-weight: 700; color: #f1f5f9; margin: 0; }
.gender-badge { font-size: 0.72rem; color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 20px; }
.card-email { font-size: 0.78rem; color: rgba(255,255,255,0.38); margin: 0 0 10px; }
.card-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  font-size: 0.7rem; color: rgba(255,255,255,0.45);
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
  padding: 3px 9px; border-radius: 20px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 145px;
}
.chip.sm { font-size: 0.68rem; padding: 2px 8px; }
.card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); }
.age-badge { font-size: 0.7rem; font-weight: 600; color: rgba(56,189,248,0.7); background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.15); padding: 2px 9px; border-radius: 20px; }
.age-badge.sm { font-size: 0.65rem; padding: 1px 7px; }
.phone-text { font-size: 0.7rem; color: rgba(255,255,255,0.28); }

/* ── Card transitions ── */
.card-enter-active { transition: all 0.3s ease; }
.card-enter-from   { opacity: 0; transform: translateY(10px) scale(0.98); }
.card-leave-active { transition: all 0.2s ease; }
.card-leave-to     { opacity: 0; transform: scale(0.97); }

/* ── Fade ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,   .fade-leave-to     { opacity: 0; }
.fade-quick-enter-active, .fade-quick-leave-active { transition: opacity 0.15s ease; }
.fade-quick-enter-from,   .fade-quick-leave-to     { opacity: 0; }

/* ════════════════════════════
   PAGINATION
════════════════════════════ */
.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.pg-btn {
  min-width: 36px; height: 36px; padding: 0 10px; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.5); font-size: 0.875rem; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.18s; font-family: inherit;
}
.pg-btn:hover:not(:disabled):not(.dots):not(.active) { background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.25); color: #38bdf8; }
.pg-btn.active { background: linear-gradient(135deg, #38bdf8, #818cf8); border-color: transparent; color: #0f0f1a; cursor: default; }
.pg-btn:disabled:not(.dots) { opacity: 0.25; cursor: not-allowed; }
.pg-btn.dots { cursor: default; border-color: transparent; background: none; }
.pg-arrow { font-size: 1rem; padding: 0 14px; }
.page-info { text-align: center; font-size: 0.78rem; color: rgba(255,255,255,0.28); margin: 0; }

/* ════════════════════════════
   VIRTUAL SCROLL
════════════════════════════ */
.virtual-info {
  font-size: 0.78rem; color: rgba(255,255,255,0.35);
  text-align: center; margin-bottom: 14px;
  display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;
}
.vi-badge { font-size: 0.7rem; font-weight: 700; color: #4ade80; background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2); padding: 2px 9px; border-radius: 20px; }
.virtual-container {
  height: 520px; overflow-y: auto; border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
  background: linear-gradient(160deg, #1a1a32 0%, #14142a 100%);
  scrollbar-width: thin; scrollbar-color: rgba(56,189,248,0.2) transparent;
}
.virtual-container::-webkit-scrollbar { width: 5px; }
.virtual-container::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.2); border-radius: 99px; }
.vrow {
  display: flex; align-items: center; gap: 14px; padding: 0 20px;
  border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s;
}
.vrow:hover { background: rgba(56,189,248,0.04); }
.vrow-avatar { width: 46px; height: 46px; border-radius: 12px; position: relative; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.vrow-main { flex: 1; min-width: 0; }
.vrow-name { font-size: 0.9rem; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.vrow-sub  { font-size: 0.75rem; color: rgba(255,255,255,0.35); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vrow-right { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.vrow-id { font-size: 0.68rem; color: rgba(255,255,255,0.2); flex-shrink: 0; width: 36px; text-align: right; font-variant-numeric: tabular-nums; }

/* ════════════════════════════════════════════════
   ADD USER MODAL / DRAWER
════════════════════════════════════════════════ */

/* Overlay */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(5, 5, 18, 0.75);
  backdrop-filter: blur(6px);
  display: flex; justify-content: flex-end;
}

/* Drawer panel */
.modal-drawer {
  width: 100%; max-width: 480px; height: 100%;
  background: #13132a;
  border-left: 1px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column;
  box-shadow: -20px 0 60px rgba(0,0,0,0.5);
  overflow: hidden;
}

/* Drawer header */
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.drawer-title-row { display: flex; align-items: center; gap: 14px; }
.drawer-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(56,189,248,0.12);
  border: 1px solid rgba(56,189,248,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; flex-shrink: 0;
}
.drawer-title { font-size: 1.1rem; font-weight: 700; color: #f1f5f9; margin: 0 0 2px; }
.drawer-sub   { font-size: 0.78rem; color: rgba(255,255,255,0.35); margin: 0; }
.drawer-close {
  width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.45); font-size: 0.8rem;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.drawer-close:hover { background: rgba(248,113,113,0.12); color: #f87171; border-color: rgba(248,113,113,0.25); }

/* Drawer body */
.drawer-body {
  flex: 1; overflow-y: auto; padding: 24px;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent;
}
.drawer-body::-webkit-scrollbar { width: 4px; }
.drawer-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }

/* Form elements */
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
.form-group:last-child { margin-bottom: 0; }

.form-label {
  font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.5);
  letter-spacing: 0.3px; text-transform: uppercase; font-size: 0.7rem;
}
.required { color: #f87171; }

.form-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; padding: 10px 14px;
  color: #f1f5f9; font-size: 0.9rem; font-family: inherit;
  outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  width: 100%;
}
.form-input::placeholder { color: rgba(255,255,255,0.2); }
.form-input:focus {
  border-color: rgba(56,189,248,0.4);
  background: rgba(56,189,248,0.04);
  box-shadow: 0 0 0 3px rgba(56,189,248,0.06);
}
.form-group.error .form-input {
  border-color: rgba(248,113,113,0.4);
  background: rgba(248,113,113,0.04);
}
.form-group.error .form-input:focus {
  border-color: rgba(248,113,113,0.5);
  box-shadow: 0 0 0 3px rgba(248,113,113,0.06);
}
.form-error {
  font-size: 0.72rem; color: #f87171; margin: 0;
  display: flex; align-items: center; gap: 4px;
}
.form-error::before { content: '⚠'; font-size: 0.65rem; }

/* Gender toggle */
.gender-toggle { display: flex; gap: 8px; }
.gt-btn {
  flex: 1; padding: 10px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.45);
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.gt-btn.active {
  background: rgba(56,189,248,0.12);
  border-color: rgba(56,189,248,0.35);
  color: #38bdf8;
}
.gt-btn:hover:not(.active) { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }

/* Drawer footer */
.drawer-footer {
  display: flex; gap: 10px; padding: 20px 24px;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.cancel-btn {
  flex: 1; padding: 11px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6); border-radius: 10px;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.cancel-btn:hover:not(:disabled) { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.85); }
.cancel-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.submit-btn {
  flex: 2; padding: 11px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  color: #0f0f1a; border: none; border-radius: 10px;
  font-size: 0.875rem; font-weight: 700; cursor: pointer;
  transition: opacity 0.2s, transform 0.15s; font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  box-shadow: 0 4px 16px rgba(56,189,248,0.2);
}
.submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(15,15,26,0.3);
  border-top-color: #0f0f1a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Modal transitions ── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from,   .modal-leave-to     { opacity: 0; }

.drawer-enter-active { transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.drawer-leave-active { transition: transform 0.25s cubic-bezier(0.55, 0, 1, 0.45); }
.drawer-enter-from   { transform: translateX(100%); }
.drawer-leave-to     { transform: translateX(100%); }

/* ── Error field transition ── */
.err-enter-active { transition: all 0.2s ease; }
.err-enter-from   { opacity: 0; transform: translateY(-4px); }
.err-leave-active { transition: all 0.15s ease; }
.err-leave-to     { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .top-bar      { padding: 14px 16px; }
  .main-content { padding: 28px 14px 60px; }
  .stats-bar    { gap: 10px; padding: 12px 14px; }
  .stat-divider { display: none; }
  .user-grid    { grid-template-columns: 1fr; }
  .skeleton-grid { grid-template-columns: 1fr; }
  .hide-mobile  { display: none; }
  .vrow-right   { flex-direction: column; gap: 3px; align-items: flex-end; }
  .page-badge   { display: none; }
  .virtual-container { height: 400px; }
  .vt-btn       { padding: 6px 10px; font-size: 0.72rem; }
  .modal-drawer { max-width: 100%; }
  .form-row     { grid-template-columns: 1fr; }
  .add-user-btn span:last-child { display: none; }
}
</style>