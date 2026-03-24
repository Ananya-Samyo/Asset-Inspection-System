<template>
  <div class="dashboard-container">
    <div class="dashboard">
      <div class="card all">
        <div class="label">ครุภัณฑ์ทั้งหมด</div>
        <div class="count">{{ formatNumber(stats.total) }}</div>
      </div>

      <div class="card normal">
        <div class="label">ครุภัณฑ์ปกติ</div>
        <div class="count">{{ formatNumber(stats.normal) }}</div>
      </div>

      <div class="card damaged">
        <div class="label">ครุภัณฑ์เสื่อมสภาพ</div>
        <div class="count">{{ formatNumber(stats.damaged) }}</div>
      </div>

      <div class="card lost">
        <div class="label">ครุภัณฑ์สูญหาย</div>
        <div class="count">{{ formatNumber(stats.lost) }}</div>
      </div>

      <div class="card notuse">
        <div class="label">ครุภัณฑ์ไม่ใช้งาน</div>
        <div class="count">{{ formatNumber(stats.not_use) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { endpoints } from "../api.js";

export default {
  data() {
    return {
      stats: {
        total: 0,
        normal: 0,
        damaged: 0,
        lost: 0,
        not_use: 0
      }
    };
  },
  methods: {
    formatNumber(value) {
      return Number(value).toLocaleString(); // แปลงเป็น number + ใส่ comma
    }
  },
  async mounted() {
    try {
      const res = await axios.get(endpoints.shared.dashboard); 
      this.stats = {
        total: Number(res.data.total) || 0,
        normal: Number(res.data.status.normal) || 0,
        damaged: Number(res.data.status.damaged) || 0,
        lost: Number(res.data.status.lost) || 0,
        not_use: Number(res.data.status.not_use) || 0
      };
    } catch(e) {
      console.error("❌ Error fetching dashboard:", e);
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  max-width: 900px;
  margin: auto;
  padding: 40px 20px;
  font-family: 'Prompt', sans-serif;
}

.dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr); 
  gap: 30px;
}

/* การ์ดพื้นฐาน */
.card {
  min-height: 200px; /* ✅ ปรับจาก fixed height → min-height */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
}

/* ข้อความในการ์ด */
.card .label {
  font-size: 20px;
  margin-bottom: 8px;
  text-align: center;
}

.card .count {
  font-size: 34px;
  font-weight: 700;
}

/* สีการ์ด */
.card.all { background: #d4def5; color: #1f3fa0; border: 1px solid #061C90; }
.card.normal { background: #D4F8D5; color: #1F8223; border: 1px solid #1F8223; }
.card.damaged { background: #f6d2a4; color: #EE6800; border: 1px solid #EE6800; }
.card.lost { background: #f9bbba; color: #A70704; border: 1px solid #A70704; }
.card.notuse { background:#E5E5E5;color:#555;border:1px solid #9A9A9A; }

@media (max-width: 992px) {
   .dashboard {
    grid-template-columns: repeat(2, 1fr); 
  }
  .dashboard-container {
    padding: 30px 15px;
  }
  .card .label {
    font-size: 18px;
  }
  .card .count {
    font-size: 30px;
  }
}

@media (max-width: 600px) {
  .dashboard {
    grid-template-columns: 1fr; 
  }
  .card {
    min-height: 160px;
    padding: 15px;
  }
  .card .label {
    font-size: 16px;
  }
  .card .count {
    font-size: 26px;
  }
}
</style>