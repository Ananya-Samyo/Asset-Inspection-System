<template>
  <div class="container">
    <!-- Button Group Section -->
    <div class="button-group-bottom">
      <button @click="exportFile" class="btn danger">นำไฟล์ออก</button>
      <button @click="generatePDF" class="btn primary">สร้าง QRcode</button>
    </div>
    <!-- Filters Section -->
    <div class="filters">
      <label class="search-label">
        <span class="search-text">ค้นหาครุภัณฑ์:</span>
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
          <option v-for="item in uniqueLocations" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label>
        สถานะ:
        <select v-model="filters.status" class="custom-select">
          <option value="">ทั้งหมด</option>
          <option v-for="item in uniqueStatuses" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <label>
        ผู้ตรวจสอบ:
        <select v-model="filters.auditor" class="custom-select">
          <option value="">ทั้งหมด</option>
          <option v-for="item in uniqueAuditors" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>

      <button @click="resetFilters" class="btn reset small-btn">รีเซ็ต</button>
    </div>

    

    <!-- Table Section -->
    <table>
      <thead>
        <tr>
          <th><input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" /></th> 
          <th>รูปภาพ</th>
          <th>หมายเลขครุภัณฑ์</th>
          <th>รายละเอียด</th>
          <th>สถานที่</th>
          <th>ห้อง</th>
          <th>วันที่รับ</th>
          <th>วันที่ตรวจสอบ</th>
          <th>ผู้ตรวจสอบ</th>
          <th>สถานะ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in paginatedItems" :key="item.asset_id + index">
          <td><input type="checkbox" v-model="item.selected" /></td>
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

          <td><a href="#" @click.prevent="showDetails(item)" style="color: black; text-decoration: none;">{{ item.inventory_number }}</a></td>
          <td>{{ item.asset_description }}</td>
          <td>{{ item.location }}</td>
          <td>{{ item.room }}</td>
          <td>{{ item.receipt_date }}</td>
          <td>{{ item.inspection_date }}</td>
          <td>{{ item.auditor }}</td>
          <td :class="statusClass(item.status)">{{ statusLabel(item.status) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="pagination">
      <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">ก่อนหน้า</button>

      <button
        v-for="page in paginatedPages"
        :key="page + Math.random()"
        @click="typeof page === 'number' && changePage(page)"
        :class="{ active: page === currentPage, disabled: page === '...' }"
        :disabled="page === '...'"
      >
        {{ page }}
      </button>

      <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">ถัดไป</button>
    </div>

<div class="pagination-info">
  กำลังแสดง {{ paginatedItems.length }} จากทั้งหมด {{ filteredItems.length }} รายการ
</div>

      <!-- Image Popup Modal -->
    <div v-if="showImagePopup" class="popup-overlay" @click.self="closeImage">
      <div class="popup-content">
        <img :src="selectedImage" alt="Full Image" />
        <button class="close-btn" @click="closeImage">×</button>
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
          <div class="modal-item"><span class="label">หมายเลข:</span><span class="value">{{ selectedItem.inventory_number }}</span></div>
          <div class="modal-item"><span class="label">รายละเอียด:</span><span class="value">{{ selectedItem.asset_description }}</span></div>
          <div class="modal-item"><span class="label">สถานที่:</span><span class="value">{{ selectedItem.location }}</span></div>
          <div class="modal-item"><span class="label">ห้อง:</span><span class="value">{{ selectedItem.room }}</span></div>
          <div class="modal-item"><span class="label">วันที่รับ:</span><span class="value">{{ selectedItem.receipt_date }}</span></div>
          <div class="modal-item"><span class="label">วันที่ตรวจสอบ:</span><span class="value">{{ selectedItem.inspection_date }}</span></div>
          <div class="modal-item"><span class="label">ผู้ตรวจสอบ:</span><span class="value">{{ selectedItem.auditor }}</span></div>
          <div class="modal-item"><span class="label">สถานะ:</span><span class="value" :class="statusClass(selectedItem.status)">{{ statusLabel(selectedItem.status) }}</span></div>
          <div class="modal-item"><span class="label">หมายเหตุ</span><span class="value">{{ selectedItem.notes }}</span></div>
        </div>

        <div class="button-row">
          <button @click="closeModal" class="close-button">ปิด</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import axios from 'axios'
import Swal from 'sweetalert2'
import { endpoints } from './api.js'

const auditEndpoints = endpoints.audit

// ==================== State ====================
const items = ref([])
const filters = ref({ assetNumber: '', location: '', status: '', auditor: '' })
const currentPage = ref(1)
const itemsPerPage = 20
const selectedItem = ref(null)
const router = useRouter()
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

// ==================== Fetch API ====================
const fetchAssets = async () => {
  try {
    // ✅ ใช้ endpoints.asset แทน URL ตรง
    const res = await axios.get(auditEndpoints.asset)
    const data = res.data

    items.value = res.data.map(a => ({
      asset_id: a.asset_id,
      photo_url: a.photo_url || null,
      inventory_number: a.inventory_number,
      number: a.asset_number,
      asset_description: a.asset_description,
      location: a.location,
      room: a.room,
      receipt_date: a.receipt_date,
      inspection_date: a.inspection_date || '',
      auditor: a.auditor || '',
      status: a.status,
      notes: a.notes || '',
      selected: false
    }))
  } catch (err) { console.error(err) }
}
onMounted(fetchAssets)

// ==================== Computed ====================
const filteredItems = computed(() => {
  const keyword = filters.value.assetNumber.trim().toLowerCase()
  return items.value.filter(item => {
    const matchesKeyword = !keyword || Object.values(item).some(v => String(v).toLowerCase().includes(keyword))
    const matchesLocation = !filters.value.location || item.location === filters.value.location
    const matchesStatus = !filters.value.status || item.status === filters.value.status
    const matchesAuditor = !filters.value.auditor || item.auditor === filters.value.auditor
    return matchesKeyword && matchesLocation && matchesStatus && matchesAuditor
  })
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage))
const paginatedItems = computed(() => filteredItems.value.slice((currentPage.value-1)*itemsPerPage, currentPage.value*itemsPerPage))

const uniqueLocations = computed(() => [...new Set(items.value.map(i => i.location))])
const uniqueStatuses = computed(() => [...new Set(items.value.map(i => i.status))].filter(Boolean))
const uniqueAuditors = computed(() => [...new Set(items.value.map(i => i.auditor))])

// ==================== Methods ====================
const toggleSelectAll = (event) => { items.value.forEach(i => i.selected = event.target.checked) }
const resetFilters = () => { Object.keys(filters.value).forEach(k => filters.value[k] = ''); currentPage.value = 1 }
const changePage = (page) => { if(page >= 1 && page <= totalPages.value) currentPage.value = page }
const statusClass = (status) => status === 'Normal' ? 'normal' : status === 'Damaged' ? 'damaged' : status === 'Lost' ? 'Lost' : status === 'Not use' ? 'notuse' : ''

// ==================== Image Popup ====================
function openImage(url) {
  selectedImage.value = url
  showImagePopup.value = true
}

function closeImage() {
  showImagePopup.value = false
  selectedImage.value = null
}
// ==================== Modal ====================
const closeModal = () => selectedItem.value = null
const showDetails = (item) => selectedItem.value = item

// ==================== Export Excel ====================
const exportFile = async () => {
  try {
    // 1️⃣ ดึงข้อมูลทั้งหมดจาก backend
    const res = await axios.get(auditEndpoints.asset)
    const data = res.data

    if (data.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'ไม่มีข้อมูลสำหรับนำออก',
      })
      return
    }


    Swal.fire({
      title: 'ตั้งชื่อไฟล์ Excel',
      input: 'text',
      html: `
    <p style="font-size:14px; color:#555; margin-bottom:10px;">
      ⚠️ การนำออกจะเป็นข้อมูลทั้งหมด ไม่สามารถเลือกเฉพาะรายการได้
    </p>
  `,
      inputValue: 'Asset_Report', // ค่า default
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => {
        if (!value) {
          return 'กรุณากรอกชื่อไฟล์!'
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const fileName = result.value.endsWith(".xlsx") ? result.value : result.value + ".xlsx"

    // 3️⃣ แปลงข้อมูลเป็น sheet
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      asset_id: item.asset_id,
      Company_code: item.Company_Code,
      asset_number: item.asset_number,
      Subnumber: item.Subnumber,
      inventory_number: item.inventory_number,
      asset_description: item.asset_description,
      model: item.model,
      Serial_number: item.Serial_Number,
      location: item.location,
      room: item.room,
      receipt_date: item.receipt_date,
      original_value: item.original_value,
      Cost_Center: item.Cost_Center,
      agency: item.agency,
      vendor_name: item.vendor_name,
      status: item.status,
      user_by: item.user_by_email,
      inspection_date: item.inspection_date,
      notes: item.notes,
      photo_url: item.photo_url,
      YEAR: item.YEAR
    })))

    // 4️⃣ สร้าง workbook และเขียนไฟล์
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, worksheet, "Assets")
        XLSX.writeFile(wb, fileName)

        Swal.fire({
          icon: 'success',
          title: '✅ Export สำเร็จ',
          text: `ไฟล์ถูกบันทึกเป็น ${fileName}`
        })
      }
    })

  } catch (err) {
    console.error(err)
    Swal.fire({
      icon: 'error',
      title: '❌ เกิดข้อผิดพลาดในการนำออกข้อมูล'
    })
  }
}


// ==================== QR PDF ====================
const generatePDF = async () => {
  const selected = items.value.filter(i => i.selected)
  
  if(!selected.length){
    Swal.fire({
      icon: 'warning',
      title: '⚠️ ยังไม่ได้เลือกรายการ',
      text: 'กรุณาเลือกรายการก่อนสร้าง QR'
    })
    return
  }

  const pdf = new jsPDF()
  const margin = 10, qrSize = 70
  let x = margin, y = margin, count = 0, perRow = 2

  for(const item of selected){
    try {
      const qrDataUrl = await QRCode.toDataURL(item.inventory_number)
      pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize)
      pdf.setFontSize(10)
      pdf.text(item.inventory_number, x + qrSize/2, y + qrSize + 7, { align: 'center' })
      x += qrSize + margin
      count++
      if(count % perRow === 0){ x = margin; y += qrSize + 20 }
      if(y + qrSize + margin > pdf.internal.pageSize.height){ pdf.addPage(); x = margin; y = margin }
    } catch(err){ console.error(err) }
  }

  // ดาวน์โหลดไฟล์ พร้อมแจ้ง success ด้วย Swal
  pdf.save('qrcodes.pdf')
  Swal.fire({
    icon: 'success',
    title: '✅ สร้าง QR PDF สำเร็จ',
    text: 'ไฟล์ถูกบันทึกเป็น qrcodes.pdf'
  })
}


// ==================== Pagination Pages ====================
const pageWindow = 5
const paginatedPages = computed(() => {
  const pages = [], total = totalPages.value, current = currentPage.value
  let start = Math.max(current - Math.floor(pageWindow/2), 1)
  let end = start + pageWindow - 1
  if(end > total){ end = total; start = Math.max(end - pageWindow + 1, 1) }
  if(start > 1){ pages.push(1); if(start>2) pages.push('...') }
  for(let i = start; i<=end; i++) pages.push(i)
  if(end<total){ if(end<total-1) pages.push('...'); pages.push(total) }
  return pages
})

const goToEdit = () => {
  if (!selectedItem.value) return
  if (selectedItem.value.status !== 'Lost') {
    Swal.fire({
      icon: 'error',
      title: 'ไม่สามารถแก้ไขได้',
      text: 'รายการนี้ถูกตรวจนับแล้ว ไม่สามารถแก้ไขได้'
    })
    return
  }

  router.push({
    name: 'ad_editasset',
    params: { id: selectedItem.value.asset_id }
  })
}

</script>

<style scoped>
.container {
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* ========================
   FILTER SECTION
======================== */
.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.filters label {
  font-weight: bold;
  display: flex;
  flex-direction: column;
  width: 180px;
}
.custom-select {
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
  margin-top: 8px;
}

/* ========================
   BUTTON GROUP
======================== */
.button-group-bottom {
  display: flex;
  gap: 15px;
  margin: 20px 0 25px 0;
  flex-wrap: wrap;
}
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.25s;
}
.btn.reset {
  background: #e5e7eb;
  color: #374151;
}
.btn.reset:hover {
  background: #d1d5db;
}
.btn.danger {
  background: #ef4444;
  color: white;
}
.btn.danger:hover {
  background: #dc2626;
}
.btn.primary {
  background: #10b981;
  color: white;
}
.btn.primary:hover {
  background: #059669;
}
.pagination-info {
  position: fixed;       /* fixed จะชิดขอบหน้าจอเลย */
  bottom: 20px;          /* เว้นจากขอบล่าง */
  right: 20px;           /* ชิดขอบขวา */
  color: #888888;
  font-size: 14px;
  background: rgba(255,255,255,0.8); /* optional มีพื้นหลังบางๆ */
  padding: 5px 10px;     /* เว้นขอบสวยๆ */
  border-radius: 5px;    /* มุมโค้งเล็กน้อย */
  z-index: 999;          /* ให้อยู่บน element อื่น */
}

/* ========================
   TABLE
======================== */
table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  overflow-x: auto;
}
thead {
  background-color: #f5f5f5;
}
th,
td {
  padding: 12px;
  border: 1px solid #ccc;
  word-break: break-word;
}
img {
  border-radius: 4px;
  max-width: 100%;
  height: auto;
}
.normal {
  color: green;
  font-weight: bold;
}
.damaged {
  color: orange;
  font-weight: bold;
}
.notuse {
  color: gray;
  font-weight: bold;
}
.Lost {
  color: red;
  font-weight: bold;
}

/* ========================
   MODAL
======================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  padding: 25px 30px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.modal-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.asset-img {
  width: 150px;
  height: auto;
  display: block;
  margin: 0 auto 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.modal-item {
  display: flex;
  justify-content: space-between;
}
.label {
  font-weight: 600;
  color: #555;
}
.value {
  font-weight: 500;
}
.button-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.close-button,
.edit-button {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}
.close-button {
  background-color: #6c757d;
  color: white;
}
.close-button:hover {
  background-color: #495057;
}
.edit-button {
  background-color: #007bff;
  color: white;
}
.edit-button:hover {
  background-color: #0056b3;
}

/* ========================
   SEARCH BOX
======================== */
.search-label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 400px;
}
.search-text {
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  min-width: 180px;
  font-size: 17px;
}
.search-box {
  position: relative;
  flex: 2;
}
.search-input {
  width: 200px;
  padding: 5px 30px 5px 8px;
  font-size: 12px;
  border-radius: 5px;
  border: 1px solid #ccc;
  height: 48px;
  box-sizing: border-box;
}
.btn.reset.small-btn {
  padding: 0 16px;
  font-size: 16px;
  height: 38px;
  line-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
}

/* ========================
   RESPONSIVE (MOBILE)
======================== */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    gap: 5px;
  }

  .filters label {
    width: 100%;
  }

  .search-label {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
  }

  .search-text {
    font-size: 15px;
    min-width: auto;
  }

  .search-input {
    width: 100%;
    font-size: 14px;
    height: 40px;
  }

  .button-group-bottom {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap; /* ✅ ไม่ให้ขึ้นบรรทัดใหม่ */
}

.btn {
  flex: 1;
  min-width: 80px;
  font-size: 13px;
  padding: 10px;
  text-align: center;
  border-radius: 6px;
}

  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  .modal-content {
    width: 95%;
    padding: 20px;
  }

  .modal-title {
    font-size: 20px;
  }

  .asset-img {
    width: 100px;
  }

  th, td {
    font-size: 14px;
    padding: 10px;
  }
}


/* Mobile Full-Screen Modal */
/* Compact Full-Screen Modal สำหรับมือถือ */
@media (max-width: 768px) {
  .modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start; /* เริ่มจากบนสุด */
  z-index: 1000;
  padding: 5px; /* ช่องว่างรอบ modal */
  overflow-y: auto;
}

/* Modal content */
.modal-content {
  background-color: #fff;
  width: 80%;
  max-width: 480px;
  border-radius: 12px;
  margin-top: 70px;
  padding: 15px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

  .modal-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
}

/* Modal body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Modal item */
.modal-item {
  display: flex;
  flex-direction: column; /* stack label/value */
  gap: 2px;
}

.label {
  font-weight: 500;
  color: #555;
}

.value {
  font-weight: 400;
  color: #333;
  word-break: break-word;
}

/* Asset image */
.modal-body img {
  width: 100px;
  height: auto;
  margin: 0 auto 8px auto;
  border-radius: 8px;
  object-fit: contain;
  cursor: pointer;
  transition: 0.2s all;
}

.modal-body img:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

/* Button row */
.button-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.close-button,
.edit-button {
  width: 100%;
  padding: 10px 0;
  font-size: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button {
  background-color: #f56565;
  color: #fff;
}

.close-button:hover {
  background-color: #e53e3e;
}

/* Status class example */
.status-normal { color: green; }
.status-damaged { color: red; }
.status-repair { color: orange; }

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
  box-shadow: 0 8px 40px rgba(86, 85, 85, 0.5);
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

</style>