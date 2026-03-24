<!--    ===============================    Zeen   =============================== -->
<template>
  <div class="qr-code-container">
    <h2 class="title">สแกนคิวอาร์โค้ด</h2>
    <div id="qr-reader"></div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "vue-router";
import { endpoints } from '../api.js'
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "QrcodeScanner",
  setup() {
    const qrCode = ref(null);
    let html5QrCode = null;
    const router = useRouter();

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

        // 🔹 Dynamic qrbox ตาม container
        const containerWidth = qrReaderElement.offsetWidth;
        const qrBoxSize = Math.min(containerWidth * 0.8, 300);

        await html5QrCode.start(
          cameraId,
          { fps: 15, qrbox: qrBoxSize, aspectRatio: 1.0 },
          async (decodedText) => {
            const number = decodedText.trim();
            await stopScan();
//เรียก api เพื่อตรวจสอบข้อมูลครุภัณฑ์
            try {
              const res = await axios.get(endpoints.shared.assetByInventory(number));
              const asset = res.data;

              router.push({ name: "Editasset", params: { id: asset.asset_id } });
            } catch (err) {
              Swal.fire({
                icon: 'error',
                title: 'ไม่พบข้อมูลครุภัณฑ์',
                text: `เลข QR: ${number} ❌`,
              });
              console.error(err);
            }
          },
          (errorMessage) => console.warn("QR scan error:", errorMessage)
        );
      } catch (err) {
        console.error("Failed to start camera:", err);
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถเปิดกล้องได้',
          text: 'ตรวจสอบ permission หรือใช้ HTTPS บนมือถือ',
        });
      }
    };

    onMounted(() => startScan());
    onBeforeUnmount(() => stopScan());

    return { qrCode };
  },
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
</style>
