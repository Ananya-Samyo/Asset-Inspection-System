<template>
  <header
    class="navbar-custom"
    :style="{ left: sidebarLeft, width: sidebarWidth }"
  >
    <div class="navbar-content">
      <h1 class="navbar-title">ระบบตรวจสอบครุภัณฑ์ {{ currentYear + 543 }}</h1>
      <div class="user-info">
        <h2 class="email">{{ email }}</h2>
        <p class="role">{{ role }}</p>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const email = ref(localStorage.getItem('userEmail') || 'Guest')
const role = ref(localStorage.getItem('userRole') || 'Unknown Role')
const currentYear = new Date().getFullYear()

const collapsedWidth = 80
const expandedWidth = 270
const isSidebarExpanded = ref(localStorage.getItem('is_expanded') === 'true')
const sidebarLeft = ref(isSidebarExpanded.value ? `${expandedWidth}px` : `${collapsedWidth}px`)
const sidebarWidth = ref(
  isSidebarExpanded.value
    ? `calc(100% - ${expandedWidth}px)`
    : `calc(100% - ${collapsedWidth}px)`
)

const onSidebarToggle = (e) => {
  isSidebarExpanded.value = e.detail
  sidebarLeft.value = isSidebarExpanded.value ? `${expandedWidth}px` : `${collapsedWidth}px`
  sidebarWidth.value = isSidebarExpanded.value
    ? `calc(100% - ${expandedWidth}px)`
    : `calc(100% - ${collapsedWidth}px)`
}

onMounted(() => {
  document.addEventListener('sidebar-toggle', onSidebarToggle)
})

onBeforeUnmount(() => {
  document.removeEventListener('sidebar-toggle', onSidebarToggle)
})
</script>

<style scoped>
.navbar-custom {
  position: fixed;
  top: 0;
  height: 78px;
  background-color: #03126A;
  color: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  z-index: 1001;
  transition: left 0.3s ease, width 0.3s ease;
}

.navbar-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 20px;
}

.navbar-title {
  font-size: 25px;
  font-weight: 600;
  margin: 0;
  line-height: 78px;
}

.user-info {
  margin-left: auto;
  text-align: right;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.email {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.role {
  font-size: 14px;
  font-weight: 400;
  margin: 0;
  opacity: 0.85;
}

/* มือถือ / tablet (≤768px) */
@media (max-width: 768px) {
  .navbar-custom {
    height: 60px;
    padding: 0 12px;
    width: 100% !important;
    left: 0 !important;
  }

  .navbar-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .navbar-title {
    font-size: 13px;
    line-height: 1.3;
  }

  .user-info {
    align-items: flex-start;
    margin-left: 0;
    text-align: left;
  }

  .email {
    font-size: 12px;
  }

  .role {
    font-size: 11px;
  }
}
</style>