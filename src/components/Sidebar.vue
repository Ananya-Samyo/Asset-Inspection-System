<template>
  <aside :class="isExpanded ? 'is-expanded' : ''">
    <div class="logo">
      <img :src="logoURL" alt="Logo" />
    </div>

    <div class="menu-toggle-wrap">
      <button class="menu-toggle" @click="toggleSidebar">
        <span class="material-icons">
          keyboard_double_arrow_right
        </span>
      </button>
    </div>

    <h3>Menu</h3>

    <div class="menu">
      <router-link
        v-for="item in menuLinks"
        :key="item.to"
        :to="item.to"
        class="button"
      >
        <span class="material-icons">{{ item.icon }}</span>
        <span class="text">{{ item.text }}</span>
      </router-link>
    </div>

    <div class="logout">
      <button class="logout-button" @click="handleLogout">
        <span class="material-icons">logout</span>
        <span class="text">ออกจากระบบ</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import logoURL from '../assets/img/logo.png'

const router = useRouter()
const isExpanded = ref(localStorage.getItem('is_expanded') === 'true')

// Toggle sidebar
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value
  localStorage.setItem('is_expanded', isExpanded.value)
  document.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: isExpanded.value }))
}

// Logout
const handleLogout = () => {
  Swal.fire({
    title: 'ออกจากระบบ?',
    text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ตกลง',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true
  }).then(result => {
    if (result.isConfirmed) {
      localStorage.clear()
      router.push({ name: 'Login' })
    }
  })
}

// Menu per role
const auditMenu = [
  { to: '/ad_home', icon: 'home', text: 'หน้าแรก' },
  { to: '/ad_dashboard', icon: 'data_thresholding', text: 'แดชบอร์ด' },
  { to: '/ad_listasset', icon: 'description', text: 'รายการครุภัณฑ์' },
  { to: '/ad_qrcode', icon: 'qr_code_scanner', text: 'สแกนคิวอาร์โค้ด' }
]

const adminMenu = [
  { to: '/Home', icon: 'home', text: 'หน้าแรก' },
  { to: '/Dashbord', icon: 'data_thresholding', text: 'แดชบอร์ด' },
  { to: '/settime', icon: 'edit_calendar', text: 'ระยะเวลาการตรวจสอบ' },
  { to: '/Listaudit', icon: 'group_add', text: 'รายชื่อผู้ตรวจสอบ' },
  { to: '/Listasset', icon: 'description', text: 'รายการครุภัณฑ์' },
  { to: '/Qrcode', icon: 'qr_code_scanner', text: 'สแกนคิวอาร์โค้ด' },
  { to: '/History', icon: 'history', text: 'ประวัติการแก้ไข' }
]

const role = ref((localStorage.getItem('userRole') || '').toLowerCase())
const menuLinks = computed(() => {
  if (role.value === 'admin') return adminMenu
  if (role.value === 'audit committee') return auditMenu
  return []
})
</script>

<style lang="scss">
aside {    
	  position: fixed;       /* ล็อค Sidebar ให้อยู่กับจอ */
  top: 0;                /* เริ่มจากบนสุด */
  left: 0;               /* ชิดซ้าย */
  height: 100vh;         /* เต็มความสูงหน้าจอ */
  width: 80px;           /* width ตอนหุบ */ 
  width: 80px;  
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #dedfe0;
  color: #1027ac;
  width: 80px;
  min-height: 100vh;
  overflow: hidden;
  padding: 1rem;
  transition: width 0.3s ease-in-out;
  z-index: 1001;

  .logo img {
    width: 17rem;
    margin-bottom: 1rem;
    transition: opacity 0.3s ease, width 0.3s ease;
  }

  .menu-toggle-wrap {
    display: flex; justify-content: flex-end;
    .menu-toggle {
      background: transparent; border: none; cursor: pointer;
      padding: 0.25rem; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s ease, transform 0.2s ease;
      .material-icons {
        font-size: 2rem; /* เพิ่มขนาด icon */
        color: #1027ac;
        transition: transform 0.2s ease, color 0.2s ease;
		
      }
      &:hover { background: rgba(29, 78, 216, 0.1); }
    }
  }

  h3 { opacity: 0; display: none; transition: all 0.3s ease-in-out;color: #1027ac; /* สีฟ้าเข้ม */ }

  .menu .button {
    display: flex; align-items: center; padding: 0.5rem 1rem; text-decoration: none;
    .material-icons { font-size: 2rem; } color: #1027ac; /* สีฟ้าเข้ม */ /* เพิ่มขนาด icon */
    .text { opacity: 0; display: none; margin-left: 1rem; transition: all 0.2s ease-in-out; color: #1027ac; /* สีฟ้าเข้ม */ }
    &:hover { background-color: #e0e7ff; .text { color: #11269c; } }
    &.router-link-exact-active { background-color: #e0e7ff; border-left: 5px solid #03126A; }
  }

  .logout { margin-top: auto; padding-top: 1rem; border-top: 1px solid #ccc;
    .logout-button {
      width: 100%; display: flex; align-items: center;
      background-color: #e53935; color: white; border: none;
      .material-icons { font-size: 1.5rem; } /* เพิ่มขนาด icon */
      .text { opacity: 0; display: none; transition: all 0.2s ease-in-out; }
    }
  }

  &.is-expanded {
    width: 270px;
    h3 { opacity: 1; display: block; }
    .logo img { opacity: 1; } /* แสดง logo เมื่อขยาย */
    .menu .text, .logout-button .text { opacity: 1; display: inline; }
  }

  &:not(.is-expanded) {
    .logo img { opacity: 0; width: 0; } /* ซ่อน logo ตอนหุบ */
  }
}
.app-container {
  display: flex;
  justify-content: flex-start; /* Sidebar ชิดซ้าย */
  align-items: flex-start;     /* ดันขึ้นบน */
}

/* Main content */
.main-content {
  margin-left: 80px;        /* เวลาหุบ sidebar */
}

aside.is-expanded ~ .main-content {
}
///////////////////มือถือ///////////////////////
@media (max-width: 768px) {
  aside h3 {
    display: none !important;  /* ซ่อน Menu บนมือถือ */
  }
  aside {
    position: fixed;
    top: 25px; /* ระยะจาก top */
    left: 0;
    width: 55px;
    height: calc(100vh - 50px);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* ปรับถ้าต้องการชิดบน */
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 100;
    gap: 1rem; /* เว้นระยะระหว่าง element */
  }
  .menu-toggle-wrap {
    margin-bottom: 0.5rem; /* เว้นระยะจากบน */
    display: flex; 
    justify-content: center; /* อยู่กึ่งกลางแนวนอน */
  }

  /* menu */
  aside .menu {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  aside .menu .button .material-icons {
    font-size: 1.5rem;
  }

  aside .menu .button .text {
    display: none;
  }
  aside .logout {
    margin-top: auto;      /* ดัน logout ไปด้านล่าง */
    margin-bottom: 1.5rem; /* เว้นระยะจาก bottom ให้สูงขึ้น */
    padding-top: 0;        /* ลบ padding บนถ้าไม่ต้องการ */
  }

  /* Logout ขึ้นมาอยู่กับ menu */
  aside .logout-button {
    display: flex;
    align-items: center;
    justify-content: flex-start; /* ชิดซ้ายเหมือน menu */       /* เว้นเล็กน้อย */
  }


  aside.is-expanded {
    width: 200px;
  }

  aside.is-expanded .menu .text,
  aside.is-expanded .logout-button .text {
    display: inline;
    font-size: 14px;
  }

  aside.is-expanded .logo img {
    display: none;
  }

  /* Main content ตาม sidebar */
  .main-content {
    margin-left: 55px;  
    margin-top: 0;
    height: 100vh;
    overflow-y: auto;
  }
}
</style>
