<!--    ===============================    Zeen   =============================== -->
<template> 
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

  <!-- ปุ่มนำเข้า Excel -->
  <div class="top-controls" style="display: flex; align-items: center; gap: 10px;">
   <button 
  @click="downloadSample"
  class="sampl-btn"
  title="คลิกเพื่อดูตัวอย่างไฟล์"
  style="background-color: #bdc3c7; color: white; border: none; padding: 10px 12px; border-radius: 6px; cursor: pointer;"
>
  ดูตัวอย่างไฟล์นำเข้า
</button>



  <label 
  class="btn import"
  style="background-color: #3b82f6; color: white; padding: 10px 12px; border-radius: 6px; cursor: pointer;"
>
  นำเข้า Excel
  <input type="file" @change="importExcel" accept=".xlsx,.xls" hidden>
</label>

  <div class="button-group-top" style="display: flex; gap: 5px;">
    <button @click="exportFile" class="btn danger">นำไฟล์ออก</button>
    <button @click="generatePDF" class="btn primary">สร้าง QRcode</button>
  </div>

  <!-- Progress bar -->
  <div id="progress-container" style="display:none; width:200px; background:#eee; border-radius:8px; overflow:hidden;">
    <div id="progress-bar" style="width:0%; height:25px; background:#4caf50; color:#fff; text-align:center; line-height:25px; transition:width 0.3s;">
      0%
    </div>
  </div>
</div>


  
<div class="container">
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
        <label>
          ปีที่ตรวจสอบ:
          <select v-model="filters.YEAR" class="custom-select">
          <option value="">ทั้งหมด</option>
          <option v-for="item in uniqueYears" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <button @click="resetFilters" class="btn reset small-btn">รีเซ็ต</button>
      </div>
      <!-- Image Popup -->
<div v-if="showImagePopup" class="popup-overlay" @click.self="closeImage">
  <div class="popup-content">
    <img :src="selectedImage" alt="Asset" />
    <button class="close-btn" @click="closeImage">&times;</button>
  </div>
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
            <th>สถานะ</th>
            <th>แก้ไข</th>
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

            <td><a href="#" @click.prevent="showDetails(item)" style="color:black; text-decoration:none;"> {{ item.inventory_number }} </a></td>
            <td>{{ item.asset_description }}</td>
            <td>{{ item.location }}</td>
            <td>{{ item.room }}</td>
            <td>{{ item.receipt_date }}</td>
            <td>{{ item.inspection_date }}</td>
            <td :class="statusClass(item.status)">{{ statusLabel(item.status) }}</td>
            <td>
  <button @click="goToEdit(item)" class="edit-icon-btn" title="แก้ไข">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1.147 1.147-2.121-2.12L13.38.526a.5.5 0 0 1 .706 0l1.416 1.414zM1 13.5V16h2.5l7.396-7.396-2.121-2.121L1 13.5z"/>
    </svg>
  </button>
</td>
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

  <!-- เพิ่มตัวหนังสือที่แสดงว่า ตอนนที่มีทั้งหมดกี่รายการ นับตามรายการที่มีทั้งหมด -->
   <!-- ตัวอย่างการแสดงจำนวนรายการ -->
<div class="pagination-info">
  กำลังแสดง {{ paginatedItems.length }} จากทั้งหมด {{ filteredItems.length }} รายการ
</div>

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
      <div class="modal-item">
        <span class="label">หมายเลข:</span>
        <span class="value">{{ selectedItem.inventory_number }}</span>
      </div>
      <div class="modal-item">
        <span class="label">รายละเอียด:</span>
        <span class="value">{{ selectedItem.asset_description }}</span>
      </div>
      <div class="modal-item">
        <span class="label">สถานที่:</span>
        <span class="value">{{ selectedItem.location }}</span>
      </div>
      <div class="modal-item">
        <span class="label">ห้อง:</span>
        <span class="value">{{ selectedItem.room }}</span>
      </div>
      <div class="modal-item">
        <span class="label">วันที่รับ:</span>
        <span class="value">{{ selectedItem.receipt_date }}</span>
      </div>
      <div class="modal-item">
        <span class="label">วันที่ตรวจสอบ:</span>
        <span class="value">{{ selectedItem.inspection_date }}</span>
      </div>
      <div class="modal-item">
        <span class="label">ผู้ตรวจสอบ:</span>
        <span class="value">{{ selectedItem.auditor }}</span>
      </div>
      <div class="modal-item">
        <span class="label">สถานะ:</span>
        <span class="value" :class="statusClass(selectedItem.status)">
  {{ statusLabel(selectedItem.status) }}
</span>

      </div>
      <div class="modal-item">
        <span class="label">หมายเหตุ</span>
        <span class="value">{{ selectedItem.notes }}</span>
      </div>
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
import axios from 'axios'                    // ✅ ต้องอยู่ก่อนใช้งาน
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
// import API จาก path ถูกต้อง
import { endpoints } from '../api.js'

const auditEndpoints = endpoints.audit
const adminEndpoints = endpoints.admin


// ==================== Refs & State ====================
const items = ref([])
const filters = ref({
  assetNumber: '',  // ช่องค้นหา
  location: '',
  status: '',
  auditor: '',
  YEAR: ''
})

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
    const res = await axios.get(auditEndpoints.asset)
    const data = res.data

    items.value = res.data.map(a => ({
      asset_id: a.asset_id,
      number: a.asset_number, // <-- เพิ่มตรงนี้
      photo_url: a.photo_url ? `http://localhost:3000${a.photo_url}` : null,
      inventory_number: a.inventory_number,
      asset_description: a.asset_description,
      model: a.model,
      Serial_number: a.Serial_number,
      location: a.location,
      room: a.room,
      receipt_date: a.receipt_date,
      inspection_date: a.inspection_date || '',
      auditor: a.auditor || '',
      YEAR: a.YEAR || '',
      status: a.status,
      notes: a.notes || '',
      selected: false
    }))
  } catch (err) {
    console.error('❌ Error fetching assets:', err)
  }
}

onMounted(() => { fetchAssets() })

// ==================== Image Popup ====================
function openImage(url) {
  selectedImage.value = url
  showImagePopup.value = true
}

function closeImage() {
  showImagePopup.value = false
  selectedImage.value = null
}
// ==================== Computed ====================
const filteredItems = computed(() => {
  return items.value.filter(item => {
    const keyword = filters.value.assetNumber?.toLowerCase() || ''

    const matchKeyword =
      keyword === '' ||
      [
        item.inventory_number,              // หมายเลขครุภัณฑ์
        item.asset_description,   // รายละเอียด
        item.location,            // สถานที่
        item.room,                // ห้อง
        item.receipt_date,        // วันที่รับ
        item.inspection_date,     // วันที่ตรวจสอบ
        item.status               // สถานะ
      ].some(field => field?.toString().toLowerCase().includes(keyword))

    const matchLocation = !filters.value.location || item.location === filters.value.location
    const matchStatus = !filters.value.status || item.status === filters.value.status
    const matchAuditor = !filters.value.auditor || item.auditor === filters.value.auditor
    const matchYear = !filters.value.YEAR || item.YEAR === filters.value.YEAR

    return matchKeyword && matchLocation && matchStatus && matchAuditor && matchYear
  })
})


const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredItems.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage))
const uniqueLocations = computed(() => [...new Set(items.value.map(i => i.location))])
const uniqueStatuses = computed(() => [...new Set(items.value.map(i => i.status))].filter(Boolean))
const uniqueAuditors = computed(() => [...new Set(items.value.map(i => i.auditor))])
const uniqueYears = computed(() => [...new Set(items.value.map(i => i.YEAR))].filter(Boolean).sort((a,b)=>b-a))
const isAllSelected = computed(() => items.value.every(item => item.selected))

// ==================== Methods ====================
const toggleSelectAll = (event) => { items.value.forEach(item => item.selected = event.target.checked) }
const resetFilters = () => {
  filters.value = {
    assetNumber: '',
    location: '',
    status: '',
    auditor: '',
    YEAR: ''
  }
  currentPage.value = 1
}

const changePage = (page) => { if(page>=1 && page<=totalPages.value) currentPage.value=page }
const statusClass = (status) => { return status==='Normal'?'normal':status==='Damaged'?'damaged':status==='Lost'?'Lost': status === 'Not use' ? 'notuse' : '' }
const closeModal = () => selectedItem.value = null
const showDetails = (item) => selectedItem.value = item
const goToEdit = (item) => {
  if (!item) return
  router.push({
    name: 'Editasset',
    params: { id: item.asset_id }
  })
}

// ==================== Export Excel ====================
const exportFile = async () => {
  try {
    // 1️⃣ ดึงข้อมูลทั้งหมดจาก backend
    // const res = await axios.get('http://localhost:3000/api/asset')
    const res = await axios.get(endpoints.audit.asset)
    const data = res.data

    if (data.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'ไม่มีข้อมูลสำหรับนำออก',
      })
      return
    }

    // 2️⃣ ให้ผู้ใช้ตั้งชื่อไฟล์ด้วย Swal
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

// ==================== ดาวโหลดไฟล์นำเข้า ====================
const downloadSample = () => {
  const link = document.createElement("a")
  link.href = "/sample.xlsx"  //อยู่ใน public folder (/public/sample.xlsx)
  link.download = "ตัวอย่างไฟล์นำเข้า.xlsx"
  link.click()
}


// ==================== Pagination Logic ====================
const pageWindow = 5; // จำนวนหน้าที่แสดงรอบ currentPage

const paginatedPages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  let start = Math.max(current - Math.floor(pageWindow / 2), 1);
  let end = start + pageWindow - 1;

  if (end > total) {
    end = total;
    start = Math.max(end - pageWindow + 1, 1);
  }

  // ถ้า start > 1 ให้แสดงหน้าแรก + …
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }

  // แสดงหน้ากลาง
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // ถ้า end < total ให้แสดง … + หน้า total
  if (end < total) {
    if (end < total - 1) pages.push('...');
    pages.push(total);
  }

  return pages;
});
// ==================== Generate QR ====================
const generatePDF = async () => {
  const selected = items.value.filter(item => item.selected)
  if(selected.length===0){ alert("กรุณาเลือกรายการก่อนสร้าง QR"); return }

  const pdf = new jsPDF()
  const margin = 10, qrSize = 70
  let x = margin, y = margin, count = 0
  const perRow = 2

  for(const item of selected){
    try{
      const qrDataUrl = await QRCode.toDataURL(item.inventory_number)
      pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize)
      pdf.setFontSize(10)
      pdf.text(item.inventory_number, x + qrSize/2, y + qrSize + 7, { align: 'center' })

      x += qrSize + margin
      count++
      if(count%perRow===0){ x=margin; y+=qrSize+20 }
      if(y + qrSize + margin > pdf.internal.pageSize.height){ pdf.addPage(); x=margin; y=margin }
    }catch(err){ console.error('Error generating QR', err) }
  }

  pdf.save('qrcodes.pdf')
}

// ==================== Progress Bar ====================
const updateProgress = (current, total) => {
  const progressContainer = document.getElementById("progress-container")
  const progressBar = document.getElementById("progress-bar")
  
  progressContainer.style.display = "block"

  const percent = Math.round((current / total) * 100)
  progressBar.style.width = percent + "%"
  progressBar.innerText = percent + "%"

  if (percent >= 100) {
    setTimeout(() => {
      progressContainer.style.display = "none"
      progressBar.style.width = "0%"
      progressBar.innerText = "0%"
    }, 500) // หน่วงสัก 0.5 วิ เพื่อให้เห็น 100% ก่อนหาย
  }
}

// ==================== Batch Insert ====================
const chunkArray = (arr, size) => {
    const result = []
    for (let i=0; i<arr.length; i+=size) result.push(arr.slice(i,i+size))
    return result
}

// ==================== Batch Insert ====================
const importInBatches = async (assets, batchSize=100) => {
    const batches = chunkArray(assets, batchSize)
    for (let i=0; i<batches.length; i++) {
        try {
            console.log(`ส่ง batch ${i+1}/${batches.length}:`, batches[i].length)
            await axios.post(adminEndpoints.assetImport, { assets: batches[i] })
            console.log(`✅ Batch ${i+1} สำเร็จ`)
        } catch (err) {
            console.error(`❌ Batch ${i+1} ไม่สำเร็จ`, err.response?.data || err)
            throw err
        }
    }
}

// ==================== Import Excel ====================
const importExcel = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // ===== ฟังก์ชันตรวจสอบ Header =====
  const validateExcelHeaders = (sheet) => {
    const headerRows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    const headers = headerRows[0] || []

    const requiredHeaders = [
      "Company Code",
      "Asset",
      "Subnumber",
      "Inventory number",
      "Asset description",
      "ยี่ห้อ/รุ่น",
      "Serial number",
      "Location",
      "Room",
      "วันที่รับทรัพย์สิน",
      "Original value",
      "Cost Center",
      "หน่วยงาน",
      "Vendor Name1"
    ]

    const missing = requiredHeaders.filter(h => !headers.includes(h))

    return missing.length === 0
      ? { valid: true }
      : { valid: false, missing }
  }

  // ======= เช็คสถานะในตารางก่อน =======
  const hasInvalidStatus = items.value.some(item => item.status !== "Lost");

if (hasInvalidStatus) {
  Swal.fire({
    icon: "error",
    title: "ไม่สามารถนำเข้าได้",
    text: "❌ พบรายการที่ไม่ใช่ Lost ไม่สามารถนำเข้า Excel ได้"
  });
  return;
}

  // ======= ถ้ามีข้อมูลเดิมในตาราง =======
  if (items.value.length > 0) {
    const result = await Swal.fire({
      title: "⚠️ พบข้อมูลเก่าในระบบ",
      text: "คุณต้องการลบข้อมูลเก่าทั้งหมดก่อนนำเข้าใหม่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบทั้งหมด",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6"
    })

    if (!result.isConfirmed) return

    try {
      await axios.delete(adminEndpoints.assetClear)
      await Swal.fire({
        icon: "success",
        title: "ลบข้อมูลเก่าเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      })
    } catch (err) {
      console.error("ลบข้อมูลเก่าไม่สำเร็จ:", err)
      Swal.fire({
        icon: "error",
        title: "ลบข้อมูลเก่าไม่สำเร็จ",
        text: "โปรดลองอีกครั้ง"
      })
      return
    }
  }

  // ======= อ่านไฟล์ Excel =======
  const reader = new FileReader()
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    // ===== ตรวจสอบ Header ก่อน =====
    const headerCheck = validateExcelHeaders(sheet)
    if (!headerCheck.valid) {
      Swal.fire({
        icon: "error",
        title: "นำเข้าไม่สำเร็จ",
        html: `
          ❌ หัวข้อในไฟล์ Excel ไม่ครบ<br><br>
          <b>หัวข้อที่ขาด:</b><br>
          ${headerCheck.missing.join("<br>")}
        `
      })
      return
    }

    // อ่านข้อมูลจริง
    const jsonData = XLSX.utils.sheet_to_json(sheet)

    // ----------------------------------------------------
    //        🔥 ตรวจสอบเลข Inventory number ซ้ำ 🔥
    // ----------------------------------------------------
    const inventoryList = jsonData.map((r, index) => ({
      value: r["Inventory number"],
      row: index + 2  // Excel row index
    })).filter(r => r.value !== "")

    // หาเลขที่ซ้ำภายในไฟล์
    const duplicateInFile = []
    const seen = new Map()

    inventoryList.forEach(item => {
      if (seen.has(item.value)) {
        duplicateInFile.push({
          value: item.value,
          rows: [seen.get(item.value), item.row]
        })
      } else {
        seen.set(item.value, item.row)
      }
    })

    // หาเลขที่ซ้ำกับข้อมูลในระบบ
    const existingInventory = items.value.map(i => i.inventory_number)
    const duplicateWithExisting = inventoryList
      .filter(i => existingInventory.includes(i.value))
      .map(i => ({
        value: i.value,
        row: i.row
      }))

    // ถ้ามีเลขซ้ำ ให้หยุดและแจ้งเตือน
    if (duplicateInFile.length > 0 || duplicateWithExisting.length > 0) {
      let html = `❌ พบเลข Inventory number ซ้ำ<br><br>`

      if (duplicateInFile.length > 0) {
        html += `<b>ซ้ำภายในไฟล์:</b><br>`
        duplicateInFile.forEach(d => {
          html += `• ${d.value} (แถว ${d.rows.join(", ")})<br>`
        })
        html += `<br>`
      }

      if (duplicateWithExisting.length > 0) {
        html += `<b>ซ้ำกับข้อมูลที่มีอยู่ในระบบ:</b><br>`
        duplicateWithExisting.forEach(d => {
          html += `• ${d.value} (แถว ${d.row})<br>`
        })
      }

      Swal.fire({
        icon: "error",
        title: "ไม่สามารถนำเข้าได้",
        html
      })

      return
    }
    // ----------------------------------------------------
    //                  ✔️ จบตรวจเลขซ้ำ
    // ----------------------------------------------------
    const safeNumber = (val) => {
      const n = Number(val)
      return isNaN(n) ? 0 : n
    }

    const importedAssets = jsonData.map(row => ({
      Company_Code: safeNumber(row["Company Code"]),
      asset_number: safeNumber(row["Asset"]),
      Subnumber: safeNumber(row["Subnumber"]),
      inventory_number: row["Inventory number"] || "",
      asset_description: row["Asset description"] || "",
      model: row["ยี่ห้อ/รุ่น"] || "",
      Serial_number: safeNumber(row["Serial number"]),
      location: row["Location"] || "",
      room: row["Room"] || "",
      receipt_date: formatDate(row["วันที่รับทรัพย์สิน"]),
      inspection_date: formatDate(row["วันที่ตรวจสอบ"]),
      auditor: row["ผู้ตรวจสอบ"] || "",
      status: row["สถานะ"] || "Normal",
      original_value: safeNumber(row["Original value"]),
      Cost_Center: safeNumber(row["Cost Center"]),
      agency: row["หน่วยงาน"] || "",
      vendor_name: row["Vendor Name1"] || ""
    })).reverse()

    try {
      await importInBatches(importedAssets, 100)
      Swal.fire({
        icon: "success",
        title: "✅ บันทึกทั้งหมดสำเร็จ",
        showConfirmButton: false,
        timer: 1500
      })
      fetchAssets()
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: "error",
        title: "❌ บันทึกไม่สำเร็จ",
        text: "กรุณาตรวจสอบไฟล์และลองใหม่อีกครั้ง"
      })
    }
  }

  reader.readAsArrayBuffer(file)
}


const formatDate = (val) => {
  if (!val) return null
  if (typeof val === "string" && val.includes("/")) {
    const [d, m, y] = val.split("/")
    return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  return val
}

</script>

<style scoped>
/* ==================== Container & Filters ==================== */
.container {
  padding: 3px;
  font-family: Arial, sans-serif;
}

.edit-icon-btn {
  background-color: #007BFF; /* น้ำเงิน */
  border: none;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: white; /* ไอคอนจะเป็นสีขาว */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s ease;
}

.edit-icon-btn:hover {
  background-color: #0056b3; /* น้ำเงินเข้มตอน hover */
  transform: scale(1.05);
}

.edit-icon-btn:disabled {
  background-color: #9bbce3;
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
}


.filters {
  display: flex;
  gap: 30px;
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

/* ==================== Buttons ==================== */
.button-group-bottom {
  display: flex;
  gap: 15px;
  margin: 20px 0 25px 0;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.btn.reset {
  background-color: #e5e7eb;
  color: #374151;
}
.btn.reset:hover { background-color: #d1d5db; }

.btn.danger {
  background-color: #ef4444;
  color: white;
}
.btn.danger:hover { background-color: #dc2626; }

.btn.primary {
  background-color: #10b981;
  color: white;
}
.btn.primary:hover { background-color: #059669; }

.btn.import {
  background-color: #3b82f6;
  color: white;
}
.btn.import:hover { background-color: #2563eb; }

/* ปรับปุ่มให้สูงพอดีกับ select */
.btn.reset.small-btn {
  padding: 0 16px;          /* ความกว้างของปุ่ม */
  font-size: 16px;           /* ให้ตรงกับ select */
  height: 38px;              /* ให้เท่ากับ select */
  line-height: 38px;         /* จัดข้อความตรงกลางแนวตั้ง */
  display: inline-flex;
  align-items: center;       /* จัดข้อความตรงกลางแนวตั้ง */
  justify-content: center;   /* จัดข้อความตรงกลางแนวนอน */
  margin-top: 30px;           /* เท่ากับ select */
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


/* ==================== Table ==================== */
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

.normal { color: green; font-weight: bold; }
.damaged { color: orange; font-weight: bold; }
.Lost { color: red; font-weight: bold; }
.notuse { color: gray; font-weight: bold; }


/* ==================== Modal ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
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
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateY(-30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
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
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.modal-item {
  display: flex;
  justify-content: space-between;
}

.label { font-weight: 600; color: #555; }
.value { font-weight: 500; }

.status-normal { color: #0b7e3f; font-weight: bold; }
.status-damaged { color: #fd7e14; font-weight: bold; }
.status-notused { color: #6c757d; font-weight: bold; }
.status-lost { color: #dc3545; font-weight: bold; }

.button-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.close-button {
  flex: 1;
  padding: 10px 0;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.close-button:hover { background-color: #495057; }

.edit-button {
  flex: 1;
  padding: 10px 0;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.edit-button:hover { background-color: #0056b3; }

/* ==================== QR Code ==================== */
.qr-code-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  text-align: center;
}

.qr-code-container img {
  width: 150px;
  height: 150px;
  border: 1px solid #ccc;
  padding: 5px;
  border-radius: 6px;
}

.qr-item { text-align: center; width: 160px; }
.qr-text { margin-top: 8px; font-size: 14px; font-weight: bold; color: #333; }

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
/* ──────────────────────────────── */
/* 🔹 9. Image Popup (เบลอพื้นหลังตอนคลิกดูรูป) */
/* ──────────────────────────────── */
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(110, 107, 107, 0.008);
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

/* ─────────── Image Popup Fullscreen ─────────── */
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


  .filters label,
  .search-label {
    width: 100%;
    margin-bottom:1px; /* ลดช่องว่างระหว่าง label กับ input */
  }

  .search-input,
  .custom-select {
    width: 100%;
    font-size: 0.8rem;
    height: 35px;
    box-sizing: border-box;
    margin-bottom: 4px; /* ลดช่องว่างระหว่างฟิลเตอร์ */
  }

  .reset-button {
    font-size: 0.85rem;
  }
  .popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75); /* ความเข้มพื้นหลัง */
    backdrop-filter: blur(6px); /* เพิ่ม blur ให้พื้นหลัง */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 0;
    animation: fadeIn 0.3s ease;
  }

  .popup-content {
    position: relative;
    width: 100%;
    max-height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border-radius: 16px;
  }

  .popup-content img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
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
  .btn {
    font-size: 11px;      /* ตัวหนังสือเล็กลง */
    padding: 6px 10px;    /* ปรับขนาดปุ่มเล็กลง */
  }

  .button-group-bottom {
    flex-direction: column;  /* ปรับเรียงแนวตั้ง */
    gap: 10px;               /* ระยะห่างเล็กลง */
    margin: 15px 0; 
  }
}

</style>