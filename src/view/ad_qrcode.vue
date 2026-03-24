<!--    ===============================    Zeen   =============================== -->
<template>
  <div class="qr-code-container">
    <h2 class="title">Scan QRcode</h2>
    <div id="qr-reader"></div>

    <!-- Modal -->
    <div v-if="selectedItem" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3 class="modal-title">รายละเอียดครุภัณฑ์</h3>
        <div class="modal-body">
<img
  v-if="selectedItem.photo_url"
  :src="`${uploadsUrl}/${selectedItem.photo_url.split('/').pop()}`"
  alt="Asset"
  class="asset-img"
/>


          <template v-else>
            <span>ไม่มีรูป</span>
          </template>

          <div class="modal-item">
  <span class="label">หมายเลข:</span>
  <span class="value">{{ selectedItem.asset_number }}</span>
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
  <span class="value">{{ formatDate(selectedItem.receipt_date) }}</span>
</div>
<div class="modal-item">
  <span class="label">วันที่ตรวจสอบ:</span>
  <span class="value">{{ formatDate(selectedItem.inspection_date) }}</span>
</div>

          <div class="modal-item">
            <span class="label">ผู้ตรวจสอบ:</span>
            <span class="value">{{ selectedItem.auditor || '-' }}</span>
          </div>
          <div class="modal-item">
            <span class="label">สถานะ:</span>
            <span class="value" :class="statusClass(selectedItem.status)">
  {{ statusLabel(selectedItem.status) }}
</span>

          </div>
          <div class="modal-item">
            <span class="label">หมายเหตุ:</span>
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

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "vue-router";
import axios from "axios";
import Swal from "sweetalert2";
import { sharedEndpoints as endpoints } from './api.js';

const statusLabel = (status) => {
  const map = {
    "normal": "ปกติ",
    "damaged": "ชำรุด",
    "not use": "ไม่ได้ใช้งาน",
    "lost": "สูญหาย"
  }
  status = String(status || '').toLowerCase();
  return map[status] || status;
}


export default {
  name: "QrcodeScanner",
  setup() {
    const selectedItem = ref(null); // สำหรับ Modal
    let html5QrCode = null;
    const router = useRouter();
    const uploadsUrl = endpoints.audit ? endpoints.audit.uploads : endpoints.uploads;

    // แปลงวันที่ให้เป็น DD/MM/YYYY
    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const stopScan = async () => {
      if (html5QrCode) {
        try {
          await html5QrCode.stop();
          await html5QrCode.clear();
          html5QrCode = null;
        } catch (err) {
          console.error("Failed to stop camera:", err);
        }
      }
    };

    const startScan = async () => {
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) return;

      html5QrCode = new Html5Qrcode("qr-reader");

      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices.length) return;

        const cameraId = devices[0].id;
        await html5QrCode.start(
  cameraId,
  { fps: 10, qrbox: 400 }, // เพิ่ม qrbox ให้ใหญ่ขึ้น
  async (decodedText) => {
    // ใช้ decodedText ที่ scanner ส่งมาเลย
    const number = decodedText.replace(/\s/g,''); // ลบช่องว่างและ line break
    console.log("Calling API:", endpoints.assetByInventory(number));


    await stopScan();

            try {
  const res = await axios.get(endpoints.assetByInventory(number));
  const asset = res.data;

  const statusMap = { 0: 'Lost', 1: 'Normal', 2: 'Damaged', 3: 'Not use' };
  let statusStr = asset.status;
  if (typeof statusStr === "number") statusStr = statusMap[statusStr] || '';
  statusStr = String(statusStr || '').trim().toLowerCase();

  if (statusStr === 'lost') {
    // ถ้า Lost → redirect ไปหน้าแก้ไข
    router.push({ name: 'ad_editasset', params: { id: asset.asset_id } });

    return;
  }

  if (['normal', 'damaged', 'not use'].includes(statusStr)) {
    selectedItem.value = { ...asset, status: statusStr };
    return;
}

  // กรณีอื่นๆ สามารถ handle เพิ่มได้ถ้าต้องการ
} catch (err) {
  console.error("API error:", err);
  await Swal.fire({
    icon: "error",
    title: "ไม่พบข้อมูล",
    text: "❌ ไม่พบข้อมูลครุภัณฑ์เลขนี้",
    confirmButtonText: "ตกลง",
  });
}
          },
          (errorMessage) => console.warn("QR scan error:", errorMessage)
        );
      } catch (err) {
        console.error("Failed to start camera:", err);
        await Swal.fire({
          icon: "error",
          title: "ไม่สามารถเข้ากล้องได้",
          text: "❌ กรุณาตรวจสอบการอนุญาตกล้อง",
          confirmButtonText: "ตกลง",
        });
      }
    };

    const closeModal = async () => {
      selectedItem.value = null;
      await startScan(); // กลับมาสแกนต่อ
    };

    const statusClass = (status) => {
      if (!status) return '';
      switch (status.toLowerCase()) {
        case 'normal': return 'status-normal';
        case 'damaged': return 'status-damaged';
        case 'lost': return 'status-lost';
        default: return '';
      }
    };

    onMounted(() => startScan());
    onBeforeUnmount(() => stopScan());

    return { 
  selectedItem, 
  startScan, 
  stopScan, 
  closeModal, 
  statusClass, 
  formatDate, 
  uploadsUrl,
  statusLabel   // ⭐ ต้องมีอันนี้
};
  }
};
</script>




<style>
.qr-code-container {
  max-width: 500px;
  margin: 30px auto;
  text-align: center;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  color: #333;
  box-shadow: 0 0 15px rgba(0,0,0,0.1);
  border-radius: 12px;
  background-color: #fff;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #061C90;
  margin-bottom: 20px;
}

#qr-reader {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid #ddd;
  border-radius: 10px;
  margin: 0 auto 20px;
  overflow: hidden;
  background-color: #000;
}

#qr-reader video,
#qr-reader canvas {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}
/* ตัวอย่าง CSS Modal */
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
  z-index: 9999;
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
  width: 200px;
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

@media (max-width: 768px) {
  .asset-image-wrapper {
    width: 100%;        /* ปรับให้ mobile กว้างสุด 90% ของจอ */
  }
  .asset-image {
    max-width: 100%;   /* เต็ม container width */
    height: auto;
  }
}
</style>
