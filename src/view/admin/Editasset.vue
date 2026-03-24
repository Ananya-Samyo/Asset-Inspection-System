<!--    ===============================    Zeen   =============================== -->
<template>
  <div v-if="asset" class="container">
    <h2 class="title">แก้ไขครุภัณฑ์</h2>

    <!-- กล้อง -->
    <div v-if="showCamera" class="camera-wrapper">
      <video ref="video" autoplay playsinline width="300" height="200" class="video"></video>
      <div class="button-row">
        <button class="btn capture" @click="capturePhoto">📸 ถ่ายรูป</button>
        <button class="btn cancel" @click="closeCamera">❌ ยกเลิก</button>
      </div>
    </div>

    <!-- preview รูป -->
    <div v-else>
       <img
  v-if="asset.photo_url"
  :src="`${endpoints.shared.uploads}/${asset.photo_url.replace(/^\/?uploads\//, '')}`"
  alt="Asset Image"
  class="asset-image"
  width="400"
  height="300"
/>

        <div v-else class="placeholder-image">📷 คลิกเพื่อถ่ายรูป</div>
      <!-- ข้อมูลครุภัณฑ์ -->
      <div class="asset-item">
        <span class="label">หมายเลขครุภัณฑ์:</span>
        <span class="value">{{ asset.asset_number }}</span>
      </div>
      <div class="asset-item">
        <span class="label">รายละเอียด:</span>
        <span class="value">{{ asset.asset_description }}</span>
      </div>
      <div class="asset-item">
  <span class="label">สถานที่:</span>
  <input v-model="asset.location" class="value-input" readonly />
</div>
<div class="asset-item">
  <span class="label">ห้อง:</span>
  <input v-model="asset.room" class="value-input" readonly />
</div>
      <div class="asset-item">
        <span class="label">ผู้ตรวจสอบ:</span>
        <span class="value">{{ asset.auditor }}</span>
      </div>
      <div class="asset-row">
<div class="asset-item">
    <span class="label">สถานะ:</span>
    <select v-model="asset.status" :class="statusClass">
      <option value="Lost">สูญหาย</option>
      <option value="Normal">ปกติ</option>
      <option value="Damaged">ชำรุด</option>
      <option value="Not use">ไม่ได้ใช้งาน</option>
    </select>
</div>
</div>
<div class="asset-item">
  <span class="label">หมายเหตุ:</span>
  <textarea v-model="asset.notes" class="value-input" rows="1" readonly></textarea>
</div>


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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { endpoints } from '../api.js'
import axios from 'axios'
import Swal from 'sweetalert2'

const asset = ref({})
const previewImg = ref(null)
const fileToUpload = ref(null)
const showCamera = ref(false)
const video = ref(null)

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const id = route.params.id
  if (id) {
    try {
      const res = await axios.get(endpoints.shared.assetGet(id))
      asset.value = res.data

    } catch (err) { console.error(err) }
  }
})


const goBack = () => router.back()

// กล้อง
const openCamera = async () => {
  showCamera.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    video.value.srcObject = stream
  } catch { alert('ไม่สามารถเข้ากล้องได้') }
}
const closeCamera = () => {
  showCamera.value = false
  const stream = video.value.srcObject
  if (stream) stream.getTracks().forEach(t => t.stop())
}
const capturePhoto = () => {
  const canvas = document.createElement('canvas')
  canvas.width = video.value.videoWidth
  canvas.height = video.value.videoHeight
  canvas.getContext('2d').drawImage(video.value, 0, 0)
  canvas.toBlob(blob => {
    previewImg.value = URL.createObjectURL(blob)
    fileToUpload.value = new File([blob], `${Date.now()}.png`, { type: 'image/png' })
    closeCamera()
  }, 'image/png')
}

// ================= SAVE STATUS =================
const saveAsset = async () => {
  const result = await Swal.fire({
    title: 'ยืนยันการเปลี่ยนสถานะ?',
    text: 'คุณกำลังจะเปลี่ยนสถานะครุภัณฑ์!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'เปลี่ยนสถานะ',
    cancelButtonText: 'ยกเลิก'
  })
  if (!result.isConfirmed) return

  try {
    const formData = new FormData()
    formData.append('status', asset.value.status)
    formData.append('email', localStorage.getItem('userEmail') || '')

    await axios.post(
      endpoints.shared.assetUpdateStatus(asset.value.asset_id),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    await Swal.fire('สำเร็จ!', 'เปลี่ยนสถานะเรียบร้อย ✅', 'success')
    router.back()
  } catch (err) {
    console.error(err)
    Swal.fire('เกิดข้อผิดพลาด ❌', err.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะได้', 'error')
  }
}
</script>

<style scoped>
.container { max-width: 450px; margin: 20px auto; font-family: 'Segoe UI', sans-serif; }
.title { text-align: center; margin-bottom: 20px; color: #333; }

.camera-wrapper, .asset-image-wrapper { display: flex; flex-direction: column; align-items: center; margin-bottom: 15px; }
.video, .asset-image { border-radius: 8px; border: 2px solid #007bff; margin-bottom: 10px; object-fit: cover; }

.placeholder-image {
  width: 350px;
  height: 200px;
  margin: 0 auto;       /* ทำให้ชิดกลางแนวนอน */
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px dashed #aaa;
  border-radius: 8px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 20px;
}
.placeholder-image:hover { border-color: #007bff; color: #007bff; }

.asset-info { margin-bottom: 15px; }
.asset-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
.label { font-weight: 500; color: #555; }
.value { color: #333; }

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



/* Normal button */
.status-buttons {
display: flex;
gap: 8px; /* เว้นระยะระหว่างปุ่ม */
}
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
    flex-direction: column;
    gap: 8px;
    margin-top: 15px;
  }

  .btn {
    width: 100%;
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
    max-width: 90%;           /* ไม่เกิน 90% ของจอ */
    width: 100%;              /* เต็มความกว้าง wrapper */
  }

  .asset-image {
    width: 50%;              /* ขยายเต็ม wrapper */
    max-width: 50%;          /* ป้องกันเกิน container */
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