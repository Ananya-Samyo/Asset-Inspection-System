<template>
  <div>
    <!-- Header -->
    <header class="navbar-custom d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center nav-left">
        <div class="logo-wrapper">
          <img :src="logo" alt="Logo" class="logo-img" />
        </div>
      </div>
      <h1 class="mb-0 fw-bold" style="color: white; font-size: 1.6rem; line-height: 1.2;">
          ระบบตรวจสอบครุภัณฑ์ปี {{ currentYear + 543 }}
        </h1>
      <div class="button-group">
        <button class="btn qrcode-button" @click="startScanner">Scan QRCode</button>
        <button class="btn login-button"
        style="
        margin-right: 10px;"
         @click="openLoginModal">Login</button>
      </div>
    </header>

    <!-- Modal Login -->
     <div class="container">
    <div v-if="showLogin" class="qr-scanner-modal-overlay">
      <div class="qr-scanner-modal">
        <div id="googleButton"></div>
        <p v-if="errorMessage" style="color:red">{{ errorMessage }}</p>
        <button class="btn close-scanner" @click="showLogin = false">ปิด</button>
      </div>
    </div>

    <!-- Modal QR Scanner -->
    <div v-if="showScanner" class="qr-scanner-modal-overlay">
      <div class="qr-scanner-modal">
        <div id="qr-reader" style="width: 300px; height: 300px;"></div>
        <button class="btn close-scanner" @click="stopScanner">ปิดกล้อง</button>
      </div>
    </div>

      <!-- Filters -->
      <div class="filters">
        <label class="search-label">
  ค้นหาเลขครุภัณฑ์:
  <div class="search-box">
    <input
      type="text"
      v-model="filters.assetNumber"
      class="custom-input search-input"
      placeholder="เช่น 0123456789"
      @keyup.enter="searchAssets"
    />
  </div>
</label>
        <label>
          สถานที่:
          <select v-model="filters.location" class="custom-select">
            <option value="">ทั้งหมด</option>
            <option v-for="loc in uniqueLocations" :key="loc" :value="loc">{{ loc }}</option>
          </select>
        </label>

        <label>
          ห้อง:
          <select v-model="filters.room" class="custom-select">
            <option value="">ทั้งหมด</option>
            <option v-for="status in uniqueRooms" :key="status" :value="status">{{ status }}</option>
          </select>
        </label>

        

        <button class="reset-button" @click="resetFilters">รีเซ็ต</button>
      </div>

      <!-- Asset Table -->
      <table>
        <thead>
          <tr>
            <th>รูปภาพ</th>
            <th>หมายเลขครุภัณฑ์</th>
            <th>รายละเอียด</th>
            <th>สถานที่</th>
            <th>ห้อง</th>
            <th>วันที่รับ</th>
            <th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedItems" :key="item.asset_id + index">
            <td>
  <template v-if="item.photo_url">
    <img
      :src="`${endpoints.audit.uploads}/${item.photo_url.split('/').pop()}`"
      alt="Asset"
      width="80"
      class="cursor-pointer hover:opacity-80 transition"
      @click="openImage(`${endpoints.audit.uploads}/${item.photo_url.split('/').pop()}`)"
    />
  </template>
  <template v-else>
    <span>ไม่มีรูป</span>
  </template>
</td>

            <td>
              <a href="#" @click.prevent="showDetails(item)" style="color: black; text-decoration: none;">
                {{ item.inventory_number }}
              </a>
            </td>
            <td>{{ item.asset_description }}</td>
            <td>{{ item.location }}</td>
            <td>{{ item.room }}</td>
            <td>{{ item.receipt_date }}</td>
            <td :class="statusClass(item.status)">{{ statusLabel(item.status) }}</td>
          </tr>
        </tbody>
      </table>
      <!-- ข้อความกรณีไม่มีรายการ -->
<div v-if="filteredItems.length === 0" class="no-data-message" style="margin-top: 10px; color: gray; text-align: center;">
  ยังไม่มีการตรวจนับ
</div>

      <!-- Image Popup Modal -->
    <div v-if="showImagePopup" class="popup-overlay" @click.self="closeImage">
      <div class="popup-content">
        <img :src="selectedImage" alt="Full Image" />
        <button class="close-btn" @click="closeImage">×</button>
      </div>
    </div>
  </div>
      <!-- Modal -->
      <div v-if="selectedItem" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <h3 class="modal-title">รายละเอียดครุภัณฑ์</h3>
          <div class="modal-body">
            <img
  v-if="selectedItem.photo_url"
  :src="`${endpoints.audit.uploads}/${selectedItem.photo_url.split('/').pop()}`"
  alt="Asset"
  width="80"
  class="cursor-pointer hover:opacity-80 transition"
  @click="openImage(`${endpoints.audit.uploads}/${selectedItem.photo_url.split('/').pop()}`)"
/>
<template v-else>
  <span>ไม่มีรูป</span>
</template>
            <div class="modal-item"><span class="label">หมายเลข:</span><span class="value">{{ selectedItem.asset_number }}</span></div>
            <div class="modal-item"><span class="label">รายละเอียด:</span><span class="value">{{ selectedItem.asset_description }}</span></div>
            <div class="modal-item"><span class="label">สถานที่:</span><span class="value">{{ selectedItem.location }}</span></div>
            <div class="modal-item"><span class="label">ห้อง:</span><span class="value">{{ selectedItem.room }}</span></div>
            <div class="modal-item"><span class="label">วันที่รับ:</span><span class="value">{{ selectedItem.receipt_date }}</span></div>
            <div class="modal-item"><span class="label">สถานะ:</span><span class="value" :class="statusClass(selectedItem.status)">{{ statusLabel(selectedItem.status) }}</span></div>
            <div class="modal-item"><span class="label">หมายเหตุ:</span><span class="value">{{ selectedItem.notes }}</span></div>
          </div>
          <div class="button-row">
            <button @click="closeModal" class="close-button">ปิด</button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">ก่อนหน้า</button>
        <button v-for="page in totalPages" :key="page" @click="changePage(page)" :class="{ active: page === currentPage }">
          {{ page }}
        </button>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">ถัดไป</button>
      </div>
    </div>

<footer class="footer-custom">
      <div class="footer-content">

        <!-- ฝั่งซ้าย -->
        <div class="footer-section">
          <h4 class="footer-title">ติดต่อเรา</h4>
          <p>สำนักวิชาเทคโนโลยีดิจิทัลประยุกต์ มหาวิทยาลัยแม่ฟ้าหลวง</p>
          <p>333 หมู่ 1 ตำบลท่าสุด อำเภอเมือง จังหวัดเชียงราย 57100</p>
          <p>โทรศัพท์: 0-5391-6741, 0-5391-6742</p>
          <p>โทรสาร: 0-5391-6743</p>
          <p>อีเมล: adtschool@mfu.ac.th</p>
        </div>

        <!-- ฝั่งขวา -->
        <div class="footer-section developer-info">
          <h4 class="footer-title">
            เว็บไซต์สำนักวิชา :
            <a href="https://adt.mfu.ac.th/adt-home.html" class="footer-link" target="_blank">
              School of ADT
            </a>
          </h4>

          <!-- YouTube -->
          <a href="https://www.youtube.com/channel/UCbvvlT0UyZHCYdPTXL7vHXQ/featured" class="youtube-icon"
            target="_blank" aria-label="YouTube ADT">
            <svg height="30" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M23.5 6.2s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-.9C16.9 3 12 3 12 3h-.1s-4.9 0-8.6.4c-.5 0-1.3.1-2.1.9-.6.7-.8 2.3-.8 2.3S0 8.2 0 10.2v1.6c0 2 .2 4 .2 4s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.3.4 7.3.4s4.9 0 8.6-.4c.5 0 1.3-.1 2.1-.9.6-.7.8-2.3.8-2.3s.2-2 .2-4v-1.6c-.1-2-.3-4-.3-4zM9.6 14.8V7.6l6.4 3.6-6.4 3.6z" />
            </svg>
          </a>

          <!-- ข้อความลิขสิทธิ์ -->
          <div class="copyright-text">
            &copy; {{ currentYear }} School of Applied Digital Technology. All Rights Reserved.
          </div>
        </div>

      </div>
    </footer>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Html5Qrcode } from 'html5-qrcode'
import logo from '../assets/img/logo.png'
import Swal from "sweetalert2"
import { endpoints } from './api' // แก้ตรงนี้


/* Router */
const router = useRouter()

/* Variables */
const url_login = '/api/login' 
const showLogin = ref(false)
const errorMessage = ref('')
const showScanner = ref(false)
const items = ref([])
const selectedItem = ref(null)
let html5QrCode = null
const filters = ref({ location: '', room: '', assetNumber: '' })
const currentPage = ref(1)
const itemsPerPage = 5
const currentYear = new Date().getFullYear()
const showImagePopup = ref(false)
const selectedImage = ref(null)
const statusLabel = (status) => {
  const map = {
    "Normal": "ปกติ",
    "Damaged": "ชำรุด",
    "Not use": "ไม่ได้ใช้งาน",
    "Lost": "สูญหาย"
  }
  return map[status] || status
}

function openImage(url) {
  selectedImage.value = url
  showImagePopup.value = true
}

function closeImage() {
  showImagePopup.value = false
  selectedImage.value = null
}

/* Modal */
const showDetails = (item) => { selectedItem.value = item }
const closeModal = () => { selectedItem.value = null }

/* Fetch assets */
const fetchAssets = async () => {
  try {
    // เปลี่ยนจาก endpoints.assetAll → endpoints.audit.asset
    const res = await axios.get(endpoints.audit.asset)
    console.log('📦 Response:', res.data)

    const payload = res.data?.data ?? res.data
    if (!Array.isArray(payload)) {
      console.error('Expected array but got:', payload)
      return
    }

    items.value = payload
      .filter(a => a.status === 'Normal')
      .map(a => ({ ...a, selected: false }))
  } catch (err) {
    console.error('❌ Error fetching assets:', err)
  }
}


/* Computed */
const filteredItems = computed(() => {
  return items.value.filter(item => {
    return (
      (!filters.value.location || item.location === filters.value.location) &&
      (!filters.value.room || item.room === filters.value.room) &&
      (!filters.value.assetNumber || item.asset_number.includes(filters.value.assetNumber))
    )
  })
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredItems.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage))
const uniqueLocations = computed(() => [...new Set(items.value.map(i => i.location))])
const uniqueRooms = computed(() => [...new Set(items.value.map(i => i.room))])


/* Methods */
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}
// รีเซ็ต
const resetFilters = () => {
  filters.value = { location: '', room: '', assetNumber: '' }
  currentPage.value = 1
}
const statusClass = (status) => {
  if (status === 'Normal') return 'normal'
  if (status === 'Damaged') return 'damaged'
  return ''
}

const startScanner = async () => {
  showScanner.value = true
  await nextTick()

  html5QrCode = new Html5Qrcode('qr-reader')
  const config = { fps: 10, qrbox: 250 }

  try {
    await html5QrCode.start(
      { facingMode: 'environment' }, // ใช้กล้องหลัง
      config,
      (decodedText) => {
        const asset = items.value.find(a => a.inventory_number === decodedText)

        if (asset) {
          selectedItem.value = asset
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'ไม่พบข้อมูล',
            text: `ไม่พบครุภัณฑ์หมายเลข: ${decodedText}`,
          })
        }

        stopScanner()
      }
    )
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: `ไม่สามารถเริ่มกล้องได้: ${err}`,
    })
    showScanner.value = false
  }
}

const stopScanner = async () => {
  if (html5QrCode) {
    try {
      await html5QrCode.stop()
      await html5QrCode.clear()
    } catch (err) {
      console.error("Failed to stop scanner:", err)
    }
    html5QrCode = null
  }
  showScanner.value = false
}

onUnmounted(() => {
  stopScanner()
})


/* Google Login */
const openLoginModal = async () => {
  showLogin.value = true
  await nextTick()
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: '936105386956-o0smbe184v7moldqkksmgp10592lkavu.apps.googleusercontent.com',
      callback: window.handleGoogleLogin,
      auto_select: false
    })
    window.google.accounts.id.renderButton(
      document.getElementById('googleButton'),
      { theme: 'outline', size: 'large', width: 240 }
    )
  }
}
window.handleGoogleLogin = async (response) => {
  try {
    const res = await fetch(url_login + "/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      errorMessage.value = data.message || "Login ไม่สำเร็จ"
      return
    }
    localStorage.setItem("userToken", data.token)
    localStorage.setItem("userRole", data.user.role)
    localStorage.setItem("userEmail", data.user.email)
    showLogin.value = false
    router.push({ name: "Home" })
  } catch (err) {
    errorMessage.value = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"
    console.error(err)
  }
}

/* Lifecycle */
onMounted(() => {
  fetchAssets()
  const script = document.createElement('script')
  script.src = "https://accounts.google.com/gsi/client"
  script.async = true
  script.defer = true
  document.head.appendChild(script)
})
</script>

<style scoped>
/* ──────────────────────────────── */
/* 🔹 1. Layout */
/* ──────────────────────────────── */
.container { 
  padding-top: 0px;
  font-family: Arial, sans-serif;
}

/* ──────────────────────────────── */
/* 🔹 2. Navbar */
/* ──────────────────────────────── */
.navbar-custom { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 80px; 
  background-color: #061C90; 
       /* ลด padding บน/ล่างให้ไม่ล้น */
  display: flex;          /* ต้องมี */
  align-items: center;    /* กึ่งกลางแนวตั้ง */
  justify-content: space-between;
  z-index: 1000; 
}

.logo { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  height: 50px;           /* ลดสูงลงให้พอดี navbar */
  padding: 0;             /* ลด padding */
}


.button-group { 
  display: flex; 
  gap: 12px; 
}

.btn { 
  padding: 8px 14px; 
  font-size: 14px; 
  border: none; 
  border-radius: 5px; 
  cursor: pointer; 
  font-weight: bold; 
}

.qrcode-button { background-color: #2764d4; color: white; }
.qrcode-button:hover { background-color: #2349b2; }

.login-button { background-color: #D9EDFA; color: #03126A; }
.login-button:hover { background-color: #6c7c87; }

/* 🔹 Logo & School Name Styles */
.logo-wrapper {
  background-color: white;
  border-radius: 5px;
  padding: 4px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 85px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.logo-img {
  height: 45px;
  width: auto;
  margin-bottom: 2px;
  display: block;
}


/* ──────────────────────────────── */
/* 🔹 3. Filters & Search */
/* ──────────────────────────────── */
.filters { 
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.filters label { 
  font-weight: bold; 
  display: flex; 
  flex-direction: column; 
}

.custom-input,
.custom-select { 
  padding: 10px; 
  font-size: 16px; 
  border-radius: 4px; 
  border: 1px solid #ccc; 
  margin-top: 8px; 
}

.reset-button { 
  padding: 10px 15px; 
  background-color: #2764d4; 
  color: white; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer; 
  margin-top: 22px; 
}
.reset-button:hover { background-color: #2349b2; }

/* --- Search box --- */
.search-label {
  display: flex;
  flex-direction: column;
  width: 400px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 16px;
  color: #666;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 32px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #2764d4;
  box-shadow: 0 0 4px rgba(39, 100, 212, 0.4);
}

.search-icon-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  cursor: pointer;
  color: #000;
  padding: 0;
}
.search-icon-button:hover { color: #2764d4; }

/* ──────────────────────────────── */
/* 🔹 4. Table */
/* ──────────────────────────────── */
table { 
  width: 100%; 
  border-collapse: collapse; 
  text-align: center; 
}

thead { background-color: #f5f5f5; }

th, td { 
  padding: 12px; 
  border: 1px solid #ccc; 
}

img { border-radius: 4px; }

/* ──────────────────────────────── */
/* 🔹 5. Status color */
/* ──────────────────────────────── */
.normal { color: green; font-weight: bold; }
.damaged { color: orange; font-weight: bold; }

/* ──────────────────────────────── */
/* 🔹 7. Modal (Asset Detail Popup) */
/* ──────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0; /* ครอบทั้งหน้าจอ */
  background: rgba(0, 0, 0, 0.6); /* มืดนิด ๆ */
  backdrop-filter: blur(6px); /* ✅ เบลอพื้นหลัง */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* ให้อยู่บนสุด */
  animation: fadeIn 0.3s ease; /* เปิดแบบเนียน ๆ */
}


.modal-content { 
  background: #fff; 
  border-radius: 12px; 
  width: 95%; 
  max-width: 480px; 
  padding: 25px 30px; 
  box-shadow: 0 6px 20px rgba(0,0,0,0.2); 
  animation: slideIn 0.3s ease; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  text-align: center; 
}

.modal-title { 
  font-size: 22px; 
  font-weight: 700; 
  color: #333; 
  margin-bottom: 20px; 
}

.modal-body { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 10px; 
  width: 100%; 
  margin-bottom: 20px; 
}

.asset-img { 
  width: 180px; 
  height: auto; 
  border-radius: 8px; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
  margin-bottom: 15px; 
}

.modal-item { 
  display: flex; 
  justify-content: space-between; 
  width: 100%; 
  padding: 6px 0; 
  border-bottom: 1px solid #eee; 
}

.label { font-weight: 600; color: #555; text-align: left; }
.value { font-weight: 500; text-align: right; word-break: break-word; }

.button-row { 
  display: flex; 
  justify-content: center; 
  gap: 15px; 
  width: 100%; 
}

.close-button { 
  flex: 1; 
  padding: 10px 0; 
  background-color: #6c757d; 
  color: #fff; 
  border: none; 
  border-radius: 8px; 
  font-weight: 600; 
  cursor: pointer; 
  transition: background 0.3s ease; 
}
.close-button:hover { background-color: #495057; }

/* ──────────────────────────────── */
/* 🔹 8. QR Scanner Modal */
/* ──────────────────────────────── */
.qr-scanner-modal-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  background-color: rgba(0, 0, 0, 0.7); 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  z-index: 9999; 
}

.qr-scanner-modal { 
  background-color: white; 
  padding: 20px; 
  border-radius: 10px; 
  text-align: center; 
}

.qr-scanner-modal .close-scanner { 
  background-color: #f44336; 
  color: white; 
  padding: 6px 20px; 
  border: none; 
  border-radius: 6px; 
  cursor: pointer; 
  margin-top: 5px; 
  font-size: 0.95rem; 
}

.qr-scanner-modal .close-scanner:hover { 
  background-color: #d32f2f; 
}

/* ──────────────────────────────── */
/* 🔹 9. Image Popup (เบลอพื้นหลังตอนคลิกดูรูป) */
/* ──────────────────────────────── */
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.popup-content {
  position: relative;
  max-width: 85%;
  max-height: 85%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  animation: zoomIn 0.3s ease;
  transition: all 0.3s ease;
}

.popup-content img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 16px;
  user-select: none;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #111;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.close-btn:hover {
  background: #0a2e73;
  color: #fff;
  transform: scale(1.05);
}

/* ──────────────────────────────── */
/* 🔹 10. Footer (Compact & Full Width) */
/* ──────────────────────────────── */
.footer-custom {
  width: 100%;
  background-color: #04146c;
  color: #ffffff;
  padding: 20px 0 20px 0;
  font-size: 0.8rem;
  margin-top: 135px;
  border-top: 3px solid #2764d4;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-section {
  flex: 1;
}

.footer-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #ffc107;
}

.footer-section p {
  margin: 2px 0;
  opacity: 0.9;
  line-height: 1.4;
}

.student-list {
  list-style: none;
  padding: 0;
  margin: 5px 0 0 0;
}

.student-list li {
  margin-bottom: 2px;
  font-size: 0.9em;
  opacity: 0.85;
}

.text-end {
  text-align: right;
}

.text-start {
  text-align: left;
}

.footer-copyright {
  text-align: center;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.7rem;
  opacity: 0.6;
}
.youtube-icon {
  color: #ff4c4c;
  /* สีแดง YouTube */
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
  transition: 0.2s ease;
}

.youtube-icon:hover {
  color: #ffffff;
  /* Hover เป็นสีขาว */
  transform: scale(1.15);
}
/* ──────────────────────────────── */
/* 🔹 11. Animations */
/* ──────────────────────────────── */
@keyframes slideIn { 
  from { transform: translateY(-30px); opacity: 0; } 
  to { transform: translateY(0); opacity: 1; } 
}

@keyframes fadeIn { 
  from { opacity: 0; } 
  to { opacity: 1; } 
}

@keyframes zoomIn { 
  from { transform: scale(0.92); opacity: 0; } 
  to { transform: scale(1); opacity: 1; } 
}
.no-data-message {
  margin-top: 15px;
  padding: 4%;
  text-align: center;
  color: #555;
  font-weight: 500;
  font-size: 20px;
  background-color: #f9f9f9;
  border: 1px dashed #ccc;
  border-radius: 8px;
}
/* ========================
   Mobile Responsive (≤768px)
======================== */

/* ── Navbar ── */
@media (max-width: 768px) {
  .navbar-custom {
    height: 80px;
    padding: 0 10px;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  .navbar-custom h1 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    flex: 1 1 100%;
    text-align: left;
    color: white;
  }

  .navbar-custom .logo-img {
    display: none; /* ซ่อนโลโก้บนมือถือ */
  }
  .logo-wrapper {
    display: none; /* ซ่อนโลโก้บนมือถือ */
  }

  .button-group {
    display: flex;
    gap: 5px;
    flex: 1 1 auto;
    justify-content: flex-start;

  }

  .button-group .btn {
    padding: 5px 8px;
    font-size: 0.85rem;
  }
}

/* ── Filters / Search ── */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    gap: 6px;
  }

  .filters label,
  .search-label {
    width: 100%;
  }

  .search-input,
  .custom-select {
    width: 100%;       /* เพิ่มบรรทัดนี้ */
    font-size: 0.9rem;
    height: 40px;
    box-sizing: border-box; /* กัน padding ทำให้เกินขนาด */
  }


  .reset-button {
    font-size: 0.85rem;
    padding: 6px 10px;
    margin-top: 8px;
  }
}

/* ── Table ── */
@media (max-width: 768px) {
  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
    width: 100%;
  }

  th, td {
    font-size: 0.8rem;
    padding: 4px 6px;
  }

  img {
    max-width: 60px;
  }
  .qr-scanner-modal {
  display: flex;
  flex-direction: column;
  align-items: center;     /* จัดทุกอย่างตรงกลาง */
  justify-content: center;
  padding: 20px;
  text-align: center;
}
}

/* ─────────── Image Popup Fullscreen ─────────── */
@media (max-width: 768px) {
  .popup-overlay {
    position: fixed;
    inset: 0; /* top:0; right:0; bottom:0; left:0 */
    background: rgba(0,0,0,0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 0;
  }

  .popup-content {
    position: relative;
    width: 100%;
    height:36%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .popup-content img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain; /* รักษาสัดส่วน */
  }

  .close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255,255,255,0.8);
    border: none;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    font-size: 1.5rem;
    font-weight: bold;
    cursor: pointer;
    z-index: 10000;
  }
}


</style>
