<template>
  <div v-if="asset" class="container">
    <h2 class="title">แก้ไขครุภัณฑ์</h2>

    <!-- Camera Modal -->
    <div v-if="showCamera" class="camera-overlay">
      <video ref="video" autoplay playsinline class="video"></video>
      <div class="button-row">
        <button class="btn capture" @click="capturePhoto">📸 ถ่ายรูป</button>
        <button class="btn cancel" @click="closeCamera">❌ ยกเลิก</button>
      </div>
    </div>

    <!-- Main Form -->
    <div v-else class="asset-form">
      <!-- Image Preview -->
      <div class="asset-image-wrapper" @click="openCamera">
        <img
          v-if="previewImg || asset.photo_url"
          :src="previewImg ? previewImg : `http://localhost:3000${asset.photo_url}`"
          class="asset-image"
        />
        <div v-else class="placeholder-image">📷 คลิกเพื่อถ่ายรูป</div>
      </div>

      <!-- Asset Details -->
      <div class="asset-item">
        <span class="label">หมายเลขครุภัณฑ์:</span>
        <span class="value">{{ asset.inventory_number }}</span>
      </div>

      <div class="asset-item">
        <span class="label">รายละเอียด:</span>
        <span class="value">{{ asset.asset_description }}</span>
      </div>

      <div class="asset-item">
        <span class="label">สถานที่:</span>
        <input v-model="asset.location" class="value-input" />
      </div>

      <div class="asset-item">
        <span class="label">ห้อง:</span>
        <input v-model="asset.room" class="value-input" />
      </div>

      <div class="asset-item">
        <span class="label">หมายเหตุ:</span>
        <textarea v-model="asset.notes" class="value-input" rows="1"></textarea>
      </div>

      <div class="asset-item">
        <span class="label">สถานะ:</span>
        <select v-model="asset.status" :class="statusClass">
      <option value="Normal">ปกติ</option>
      <option value="Damaged">ชำรุด</option>
      <option value="Not use">ไม่ได้ใช้งาน</option>
        </select>
      </div>

      <!-- Buttons -->
      <div class="button-row">
        <button class="btn save" @click="saveAsset">💾 บันทึก</button>
        <button class="btn cancel" @click="goBack">❌ ยกเลิก</button>
      </div>
    </div>
  </div>

  <div v-else class="no-data">
    <p>ไม่พบข้อมูลครุภัณฑ์</p>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
import { endpoints } from './api.js'

const auditEndpoints = endpoints.audit
const shareEndpoints = endpoints.shared

// refs
const previewImg = ref(null)
const fileToUpload = ref(null)
const showCamera = ref(false)
const video = ref(null)
const email = ref(localStorage.getItem('userEmail') || 'Guest')

// router
const route = useRoute()
const router = useRouter()
const goBack = () => router.back()

// reactive asset
const asset = reactive({
  asset_id: null,
  status: 'Normal',
  location: '',
  room: '',
  notes: '',
  user_by: email.value,
  inspection_date: '',
  photo_url: ''
})

// คำนวณ class สำหรับ status
const statusClass = computed(() => {
  switch (asset.status) {
    case 'Normal': return 'status-normal'
    case 'Damaged': return 'status-damaged'
    case 'Not use': return 'status-notuse'
    default: return ''
  }
})

// โหลดข้อมูล asset เมื่อมี id
onMounted(async () => {
  const id = route.params.id
  if (!id) return

  try {
    const res = await axios.get(shareEndpoints.assetGet(id))
    Object.assign(asset, res.data)
    asset.status = 'Normal'
    asset.notes = asset.notes || ''
    asset.user_by = email.value

    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    asset.inspection_date = `${dd}/${mm}/${yyyy}`
  } catch (err) {
    console.error(err)
  }
})

// ================== กล้อง ==================
const openCamera = async () => {
  showCamera.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    video.value.srcObject = stream
  } catch {
    alert('ไม่สามารถเข้ากล้องได้')
  }
}

const closeCamera = () => {
  showCamera.value = false
  const stream = video.value.srcObject
  if (stream) stream.getTracks().forEach(t => t.stop())
}

const capturePhoto = async () => {
  const canvas = document.createElement('canvas')
  canvas.width = video.value.videoWidth
  canvas.height = video.value.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video.value, 0, 0)

  // ฟังก์ชันแปลง Blob โดยปรับ quality ให้ขนาดไม่เกิน 100 KB
  const getBlobUnderSize = async (canvas, maxSizeKB) => {
    let quality = 0.9 // เริ่มต้นคุณภาพ 90%
    let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    
    while (blob.size / 1024 > maxSizeKB && quality > 0.1) {
      quality -= 0.05
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    }
    return blob
  }

  const blob = await getBlobUnderSize(canvas, 100) // 100 KB
  previewImg.value = URL.createObjectURL(blob)
  fileToUpload.value = new File([blob], `${Date.now()}.jpeg`, { type: 'image/jpeg' })
  closeCamera()
}


// ================== Save Asset ==================
const saveAsset = async () => {
  if (!fileToUpload.value) {
    Swal.fire('ต้องอัพรูปก่อน ❌', 'กรุณาถ่ายหรือเลือกภาพครุภัณฑ์', 'warning')
    return
  }

  if (!asset.status || asset.status === 'Lost') {
    Swal.fire('สถานะไม่ถูกต้อง ❌', 'กรุณาเลือกสถานะที่ไม่ใช่ Lost', 'warning')
    return
  }

  const result = await Swal.fire({
    title: 'ต้องการแก้ไขครุภัณฑ์หรือไม่?',
    text: "กำลังจะแก้ไขข้อมูลครุภัณฑ์",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'ตกลง',
    cancelButtonText: 'ยกเลิก'
  })

  if (!result.isConfirmed) return

  try {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`

    const formData = new FormData()
    formData.append('location', asset.location)
    formData.append('room', asset.room)
    formData.append('status', asset.status)
    formData.append('inspection_date', todayStr)
    formData.append('notes', asset.notes || '')
    formData.append('email', email.value)
    if (fileToUpload.value) formData.append('image', fileToUpload.value)

    const res = await axios.post(
      auditEndpoints.assetUpdate(asset.asset_id),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    if (res.data.updatedFields?.photo_url) asset.photo_url = res.data.updatedFields.photo_url
    previewImg.value = null
    fileToUpload.value = null

    await Swal.fire('สำเร็จ!')
    router.back()
  } catch (err) {
    console.error(err)
    Swal.fire('ไม่อยู่ในช่วงเวลาตรวจนับ', 'ไม่สามารถบันทึกข้อมูลได้', 'error')
  }
}
</script>




<style scoped>
.container { max-width: 450px; margin: 20px auto; font-family: 'Segoe UI', sans-serif; }
.title { text-align: center; margin-bottom: 20px; color: #333; }

.camera-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center; /* จัดให้อยู่ตรงกลางแนวนอน */
  justify-content: center; /* จัดตรงกลางแนวตั้ง */
  margin-bottom: 15px;
}

.camera-wrapper video {
  width: 300px;   /* ปรับความกว้าง */
  height: 200px;  /* ปรับความสูง */
  border: 1px solid #ccc;
  border-radius: 8px;
  object-fit: cover; /* ครอบภาพให้เต็มกรอบ */
}
/* รูปที่แสดงหลังถ่าย */
.asset-image-wrapper img {
  width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}
.video, .asset-image {
  width: 350px;       /* ลดความกว้างลง */
  height: 260px;      /* ลดความสูงลง */
  border-radius: 8px;
  border: 2px solid #007bff;
  margin-bottom: 5px;
  object-fit: cover;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.placeholder-image {
  width: 300px; height: 200px; display: flex; justify-content: center; align-items: center;
  border: 2px dashed #aaa; border-radius: 8px; color: #555; cursor: pointer;
  transition: all 0.2s; font-size: 18px;
}
.placeholder-image:hover { border-color: #007bff; color: #007bff; }

.asset-info { margin-bottom: 15px; }
.asset-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
.label { font-weight: 500; color: #555; }
.value { color: #333; }
.status-buttons {
  display: flex;
  gap: 8px;
}

.status-buttons button {
  padding: 6px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

/* Normal button */
.status-buttons button:nth-child(1) {
  background-color: #b7e4c7; /* เขียวอ่อน */
  color: #0b3d0b;
}

.status-buttons button:nth-child(1).active {
  background-color: #4caf50; /* เขียวเข้ม */
  color: white;
}

/* Damaged button */
.status-buttons button:nth-child(2) {
  background-color: #f9d5d3; /* แดงอ่อน */
  color: #7f1d1d;
}

.status-buttons button:nth-child(2).active {
  background-color: #f0b429; /* เหลืองเข้ม */
  color: white;
}
.button-row { display: flex; justify-content: center; gap: 15px; margin-top: 10px; flex-wrap: wrap; }
.btn { padding: 8px 16px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.btn.capture { background-color: #28a745; color: #fff; }
.btn.capture:hover { background-color: #218838; }
.btn.save { background-color: #007bff; color: #fff; }
.btn.save:hover { background-color: #0056b3; }
.btn.cancel { background-color: #dc3545; color: #fff; }
.btn.cancel:hover { background-color: #c82333; }
.asset-card {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.asset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.label {
  font-weight: 600;
  color: #333;
}

.value {
  color: #555;
}

.value-input {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-width: 150px;
  outline: none;
  transition: border-color 0.2s;
}

.value-input:focus {
  border-color: #3b82f6; /* สีฟ้าเวลาตัวกรอกถูกเลือก */
}

select.value-input {
  background-color: #fff;
  cursor: pointer;
}
/* ==== Responsive for Mobile ==== */
@media (max-width: 768px) {
  .container, .asset-card {
    max-width: 95%;
    padding: 10px;
    margin: 10px auto;
    font-size: 11px;
  }

  .title {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .placeholder-image {
    width: 100%;
    height: 160px;
    font-size: 14px;
  }

  .asset-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 10px;
  }

  .label, .value {
    font-size: 11px;
  }

  .value-input {
    font-size: 11px;
    padding: 4px 8px;
    min-width: 100%;
  }

  .button-row {
    display: flex !important;          /* บังคับใช้ flex */
    flex-direction: row !important;    /* เรียงแนวนอน */
    justify-content: flex-start;       /* เริ่มจากซ้าย */
    gap: 10px;                          /* ช่องว่างระหว่างปุ่ม */
    margin-top: 15px;
  }

  .button-row .btn {
    flex: 1;                            /* ให้ปุ่มยาวเท่ากัน */
    min-width: 0;                       /* ป้องกัน overflow */
    padding: 6px 0;
    font-size: 11px;
  }

  .video, .asset-image {
    width: 100%;
    height: auto;
    border-radius: 6px;
  }

  .camera-wrapper, .asset-image-wrapper {
    margin-bottom: 10px;
  }
}

/* ปรับขนาด dropdown สถานะ */
select {
  padding: 4px 8px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: #fff;
  min-width: 120px; /* กำหนดความกว้างขั้นต่ำ */
  height: 32px; /* ปรับความสูงให้เล็กลง */
  box-sizing: border-box;
}

/* ตัวเลือกสีตามสถานะ */
.select-normal {
  color: green;
}

.select-damaged {
  color: orange;
}

.select-notuse {
  color: gray;
}

/* ถ้าอยากให้เลือกสีเปลี่ยนตามสถานะ */
select.Normal { color: green; }
select.Damaged { color: orange; }
select.Not use { color: gray; }

/* ==== Responsive for Mobile ==== */
@media (max-width: 768px) {
  .container, .asset-card {
    max-width: 95%;
    padding: 10px;
    margin: 10px auto;
    font-size: 11px;
  }

  .title {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .placeholder-image {
    width: 100%;
    height: 160px;
    font-size: 14px;
  }

  .asset-item {
    display: flex;           /* ใช้ flex */
    flex-direction: row;     /* แนวนอน */
    align-items: center;     
    gap:5px;                /* ช่องว่าง label - input */
    margin-bottom: 8px;
  }
  .label {
    font-weight: 600;
    flex: 0 0 40%;           /* กำหนด label fix 40% ของ row */
    text-align: left;
  }

  .value-input, .value {
    flex: 1 1 60%;           /* ขยายเต็มที่เหลือ 60% */
    font-size: 11px;
    padding: 2px 20px;
    box-sizing: border-box;  /* ป้องกัน padding ทำให้เกิน width */
    max-width: 100%;
  }
  .label, .value {
    font-size: 11px;
  }

  .value-input {
    font-size: 11px;
    padding: 4px 10px;
    min-width: 50%;
  }

  .button-row {
    display: flex;           /* ใช้ flex */
    flex-direction: row;     /* เรียงเป็นแนวนอน */
    justify-content: flex-start; /* เริ่มจากซ้าย หรือเปลี่ยนเป็น center/space-between ตามชอบ */
    gap: 8px;                /* ช่องว่างระหว่างปุ่ม */
    margin-top: 15px;
  }

  .btn {
    flex: 1 1 auto;          /* ให้ปุ่มขยายเท่ากัน */
    font-size: 11px;
    padding: 6px 0;
  }

  .video, .asset-image {
    width: 100%;
    height: auto;
    border-radius: 6px;
  }
  .camera-wrapper,
  .asset-image-wrapper {
    width: 100%;              /* ให้ wrapper เต็มความกว้าง */
    display: flex;            
    justify-content: center;  /* กลางแนวนอน */
    align-items: center;      /* กลางแนวตั้ง */
    margin-bottom: 10px;
  }

.asset-image-wrapper {
  width: 100%;        /* เต็มความกว้าง parent */
  max-width: 250px;   /* สูงสุดไม่เกิน 250px */
}


  .asset-image {
    width: 70%;              /* ขยายเต็ม wrapper */
    max-width: 70%;          /* ป้องกันเกิน container */
    height: auto;             /* รักษาสัดส่วน */
    display: block;
    margin: 0 auto;           /* กลางแนวนอน */
  }
  .asset-item {
  display: flex;           /* ใช้ flex */
  flex-direction: row;     /* แนวนอน */
  align-items: center;     /* จัดให้อยู่กึ่งกลางแนวตั้ง */
  gap: 5px;                /* ระยะห่างระหว่าง label กับ value */
  margin-bottom: 6px;
}

.label {
  font-weight: 600;        /* ตัวหนา ถ้าต้องการ */
}

.value {
  font-weight: normal;
}

}
</style>