import { createRouter, createWebHistory } from 'vue-router'
import Login from '../view/Login.vue'
import Home from '../view/admin/Home.vue'

// ---------------- Routes ----------------
const routes = [
  // หน้า Login
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  // หน้า Home (ต้อง login)
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  // สำหรับ admin
  {
    path: '/Dashbord',
    component: () => import('../view/admin/Dashbord.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settime',
    component: () => import('../view/admin/Settime.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/listaudit',
    component: () => import('../view/admin/Listaudit.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/History',
    component: () => import('../view/admin/History.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/News',
    component: () => import('../view/admin/News.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/Editasset/:id?',
    name: 'Editasset',
    component: () => import('../view/admin/Editasset.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/Qrcode',
    component: () => import('../view/admin/Qrcode.vue'),
    meta: { requiresAuth: true }
  },
  {
  path: '/Listasset',
  component: () => import('../view/admin/Listasset.vue'), // ถ้า router อยู่ใน src/router
  meta: { requiresAuth: true }
},

  // สำหรับ Audit Committee
  {
    path: '/ad_home',
    component: () => import('../view/ad_home.vue'),
    meta: { requiresAuth: true, roles: ['Audit Committee'] }
  },
  {
    path: '/ad_dashboard',
    component: () => import('../view/ad_dashboard.vue'),
    meta: { requiresAuth: true, roles: ['Audit Committee'] }
  },
  {
    path: '/ad_listasset',
    component: () => import('../view/ad_listasset.vue'),
    meta: { requiresAuth: true, roles: ['Audit Committee'] }
  },
  {
    path: '/ad_History',
    component: () => import('../view/ad_History.vue'),
    meta: { requiresAuth: true, roles: ['Audit Committee'] }
  },
  {
    path: '/ad_editasset/:id',
    name: 'ad_editasset',
    component: () => import('../view/ad_editasset.vue'),
    meta: { requiresAuth: true, roles: ['Audit Committee'] }
  },
  {
    path: '/ad_qrcode',
    component: () => import('../view/ad_qrcode.vue'),
    meta: { requiresAuth: true, roles: ['Audit Committee'] }
  }
]

// ---------------- Router ----------------
const router = createRouter({
  history: createWebHistory(),
  routes
})

// ---------------- ฟังก์ชันเช็คเวลา Audit ----------------
export function isAuditActive() {
  const startDate = localStorage.getItem('startDate')
  const endDate = localStorage.getItem('endDate')
  if (!startDate || !endDate) return false

  const today = new Date().setHours(0, 0, 0, 0)
  const start = new Date(startDate).setHours(0, 0, 0, 0)
  const end = new Date(endDate).setHours(23, 59, 59, 999)

  return today >= start && today <= end
}

// ---------------- Global Navigation Guard ----------------
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('userToken')
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase() // normalize

  // ยังไม่ได้ login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' })
  }

  // ถ้า user role ไม่ตรงกับ meta.roles ของ route
  if (to.meta.roles && !to.meta.roles.map(r => r.toLowerCase()).includes(userRole)) {
    Swal.fire({
      icon: 'error',
      title: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
      confirmButtonText: 'ตกลง'
    })
    // redirect กลับหน้าหลักของ role
    return next(userRole === 'audit committee' ? '/ad_home' : '/home')
  }

  // ถ้า Audit ไป /home → redirect
  if (to.path === '/home' && userRole === 'audit committee') {
    return next('/ad_home')
  }

  next()
})

export default router
