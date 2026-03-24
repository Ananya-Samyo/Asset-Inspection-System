<template>
  <div class="app-container">
    <!-- แสดงเฉพาะถ้าไม่ใช่หน้า Login -->
    <Sidebar v-if="!isLoginPage" :is-expanded="isSidebarExpanded" @toggle="toggleSidebar" />
    
    <div class="main-content">
      <Navbar v-if="!isLoginPage" :is-sidebar-expanded="isSidebarExpanded" />
      
      <main>
        <router-view />
      </main>
    </div>
  </div>
</template>


<script setup>
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'

const route = useRoute()
const isSidebarExpanded = ref(localStorage.getItem('is_expanded') === 'true')
const isLoginPage = ref(false)  // ประกาศแค่ครั้งเดียว

// ฟังก์ชัน toggle sidebar ให้ Sidebar และ Navbar ใช้
const toggleSidebar = () => {
  isSidebarExpanded.value = !isSidebarExpanded.value
  localStorage.setItem('is_expanded', isSidebarExpanded.value)
}

// ตรวจสอบว่าอยู่หน้า Login หรือไม่
watchEffect(() => {
  isLoginPage.value = route.name === 'Login'
})
</script>


<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');

/* รีเซ็ต default browser */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

* {
  box-sizing: border-box;
  font-family: 'Kanit', sans-serif;
}

.app-container {
  display: flex;
}

/* Main content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s ease-in-out;
}

main {
  margin-top: 50px; /* navbar height */
  padding: 2rem;
  min-height: calc(100vh - 78px);
}

</style>
