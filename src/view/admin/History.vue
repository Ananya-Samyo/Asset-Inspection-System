<!--    ===============================    Zeen   =============================== -->
<template>
  <div class="history-container">
    <h2 class="history-title">ประวัติการแก้ไข</h2>

    <!-- กรณีไม่มี logs -->
    <div v-if="logs.length === 0" class="no-logs">
      ยังไม่มีประวัติการแก้ไข
    </div>

    <!-- กรณีมี logs -->
    <div v-if="logs.length > 0">
      <!-- Filters -->
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
          ผู้ตรวจสอบ:
          <select v-model="filters.auditor" class="custom-select">
            <option value="">ทั้งหมด</option>
            <option v-for="item in uniqueAuditors" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <button @click="resetFilters" class="btn reset small-btn">รีเซ็ต</button>
      </div>

      <!-- Table -->
      <table class="history-table">
        <thead>
          <tr>
            <th>วันที่แก้ไข</th>
            <th>หมายเลขครุภัณฑ์</th>
            <th>วันที่รับ</th>
            <th>วันที่ตรวจสอบ</th>
            <th>ผู้ตรวจสอบ</th>
            <th>แก้ไขสถานะ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in paginatedLogs" :key="log.log_id">
            <td>{{ formatDate(log.changed_date) }}</td>
            <td>{{ log.inventory_number }}</td>
            <td>{{ log.receipt_date }}</td>
            <td>{{ log.inspection_date }}</td>
            <td>{{ log.auditor }}</td>
            <td>
              <span v-if="log.changes.status">
                <span :style="{ color: statusColor(log.changes.status.old) }">
  {{ statusLabel(log.changes.status.old) }}
</span>
→
<span :style="{ color: statusColor(log.changes.status.new) }">
  {{ statusLabel(log.changes.status.new) }}
</span>

              </span>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">ก่อนหน้า</button>
        <button
          v-for="page in totalPages"
          :key="page"
          @click="changePage(page)"
          :class="{ active: page === currentPage }"
        >
          {{ page }}
        </button>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">ถัดไป</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { endpoints } from '../api.js'
import axios from 'axios'

const logs = ref([])
const currentPage = ref(1)
const logsPerPage = 5
const filters = ref({
  assetNumber: '',
  location: '',
  status: '',
  auditor: '',
  year: ''
})
const statusLabel = (status) => {
  const map = {
    "0": "สูญหาย",
    "1": "ปกติ",
    "2": "ชำรุด",
    "3": "ไม่ได้ใช้งาน"
  }
  return map[status] || status
}

// Filtered logs
const filteredLogs = computed(() => {
  const search = filters.value.assetNumber.toLowerCase().trim()

  return logs.value.filter(log => {
    // รวมข้อมูลทุกช่องที่จะให้ค้นหา
    const combinedFields = [
      log.inventory_number,
      log.receipt_date,
      log.inspection_date,
      log.auditor,
      formatDate(log.changed_date)
    ]
      .join(' ')
      .toLowerCase()

    // ตรวจสอบว่า keyword ตรงกับข้อมูลในช่องไหนก็ได้
    const matchesSearch = !search || combinedFields.includes(search)

    // ฟิลเตอร์อื่นยังทำงานตามปกติ
    return (
      matchesSearch &&
      (!filters.value.location || log.location === filters.value.location) &&
      (!filters.value.status || log.changes.status?.new === filters.value.status) &&
      (!filters.value.auditor || log.auditor === filters.value.auditor) &&
      (!filters.value.year || new Date(log.inspection_date).getFullYear().toString() === filters.value.year)
    )
  })
})



// Pagination
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * logsPerPage
  const end = start + logsPerPage
  return filteredLogs.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / logsPerPage))

function changePage(page) {
  if (page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  currentPage.value = page
}

function resetFilters() {
  filters.value = {
    assetNumber: '',
    location: '',
    status: '',
    auditor: '',
    year: ''
  }
}

function formatStatus(status) {
  switch (status) {
    case 0: return 'Lost'
    case 1: return 'Normal'
    case 2: return 'Damaged'
    case 3: return 'Not used'
    default: return '-'
  }
}

function statusColor(status) {
  switch (status) {
    case 0: return 'red'
    case 1: return 'green'
    case 2: return 'orange'
    case 3: return 'gray'
    default: return 'black'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString()
}

// Unique values for filters
const uniqueLocations = computed(() => [...new Set(logs.value.map(l => l.location).filter(Boolean))])
const uniqueStatuses = computed(() => [...new Set([0,1,2])])
const uniqueAuditors = computed(() => [...new Set(logs.value.map(l => l.auditor).filter(Boolean))])
const uniqueYears = computed(() => [...new Set(logs.value.map(l => {
  return l.inspection_date ? new Date(l.inspection_date).getFullYear().toString() : ''
}).filter(Boolean))])

onMounted(async () => {
  try {
    const logsRes = await axios.get(endpoints.admin.assetLogs)
    logs.value = logsRes.data.map(log => ({
  ...log,
  changes: log.changes || {},
  changed_by_name: log.changed_by_name || 'Admin',
  changed_by_email: log.changed_by_email || '',
  receipt_date: log.receipt_date ?? '-',
  inspection_date: log.inspection_date ?? '-',
  auditor: log.auditor ?? '-',
  location: log.location ?? '-',
}))





    console.log('logs.value:', logs.value) // debug
  } catch (err) {
    console.error('Failed to fetch logs:', err)
  }
})


function searchAssets() {
  currentPage.value = 1
}
</script>

<style scoped>
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

.history-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Helvetica', sans-serif;
}

.history-title {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.no-logs {
  color: #888;
  font-style: italic;
  padding: 10px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
  align-items: center;
}

.custom-input, .custom-select {
  padding: 6px 10px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.btn.reset {
  padding: 6px 12px;
  border: none;
  background-color: #e74c3c;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.pagination button.active {
  background-color: #224688;
  color: white;
  font-weight: bold;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.container {
  padding: 20px;
  font-family: Arial, sans-serif;
}

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
/* ปรับปุ่มให้สูงพอดีกับ select */
.btn.reset.small-btn {
  padding: 0 16px;          /* ความกว้างของปุ่ม */
  font-size: 16px;           /* ให้ตรงกับ select */
  height: 38px;              /* ให้เท่ากับ select */
  line-height: 38px;         /* จัดข้อความตรงกลางแนวตั้ง */
  display: inline-flex;
  align-items: center;       /* จัดข้อความตรงกลางแนวตั้ง */
  justify-content: center;   /* จัดข้อความตรงกลางแนวนอน */
  margin-top: 30px;          /* เท่ากับ select */

}
.btn.reset {
  background-color: #e5e7eb;
  color: #374151;
}

.btn.reset.small-btn:hover {
  background-color: #b3b3b3; /* สีเทาเข้มเวลา hover */
}

</style>
