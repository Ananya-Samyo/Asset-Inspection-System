<template>
  <div class="container py-5">
    <!-- ================== หัวข้อใหญ่ ================== -->
    <h2 class="fw-bold title-text">
      ตรวจสอบครุภัณฑ์ประจำปี {{ currentYear + 543 }}
    </h2>

    <!-- ================== กรอบข่าวประกาศ ================== -->
    <div class="content-wrapper">
      <div class="announcement-box mx-auto">
        <!-- หัวข้อประกาศ -->
        <h4 class="announcement-header">ประกาศแจ้งเตือน</h4>

        <!-- ข่าวไม่มี -->
        <div v-if="news.length === 0" class="alert alert-light text-center mb-0">
          <i class="bi bi-info-circle"></i> ยังไม่มีการกำหนดช่วงเวลาตรวจสอบ
        </div>

        <!-- ข่าวมี -->
        <div v-else>
          <div
            v-for="(data, index) in paginatedNews"
            :key="data.news_id"
            class="announcement-item d-flex align-items-start justify-content-between flex-wrap"
          >
            <div class="d-flex align-items-start flex-wrap gap-3 w-100">
              <div class="number-circle flex-shrink-0">
                {{ startIndex + index + 1 }}
              </div>

              <div class="text-start flex-grow-1">
                <div class="fw-semibold text-dark-blue news-title">{{ data.title }}</div>
                <p class="news-description">{{ data.description }}</p>
                <small class="text-muted d-block news-date">
                  วันที่ {{ formatDate(data.start_date) }}
                </small>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <nav class="pagination-nav mt-4 flex-wrap">
            <button
              class="btn-page"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              ก่อนหน้า
            </button>

            <button
              v-for="page in totalPages"
              :key="page"
              class="btn-page"
              :class="{ active: currentPage === page }"
              @click="currentPage = page"
            >
              {{ page }}
            </button>

            <button
              class="btn-page"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              ถัดไป
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { endpoints } from "./api"; 
// const url = 'http://localhost:3000';
// const url_audit = '/api/audit'

export default {
  name: "AdHome",
  data() {
    return {
      currentYear: new Date().getFullYear(),
      news: [],
      loading: true,
      currentPage: 1,
      perPage: 10,
    };
  },
  computed: {
    sortedNews() {
      return this.news.slice().sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA;
      });
    },
    paginatedNews() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.sortedNews.slice(start, start + this.perPage);
    },
    //totalPages() {
     // return Math.ceil(this.news.length / this.perPage);
    //},
     totalPages() {
      return Math.ceil(this.sortedNews.length / this.perPage);
    },
    startIndex() {
      return (this.currentPage - 1) * this.perPage;
    },
  },
  methods: {
    sortedNews() {
      // กรองเฉพาะข่าวที่ยังไม่หมดอายุ (14 วัน)
      const activeNews = this.news.filter(n => this.isNewsActive(n));
      return activeNews.slice().sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB - dateA;
      });
    },
    async fetchNews() {
      try {
        // const res = await axios.get(url + url_audit + "/Getnews",{});
        this.loading = true;
        const res = await axios.get(endpoints.audit.news);
        console.log('audit',res)
        const data = res.data.data;
        this.loading = false;
        this.news = Array.isArray(res.data.data) ? res.data.data : [];
      } catch (err) {
        console.error("❌ Error fetching news:", err);
      }
    },
    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
  },
  mounted() {
    this.fetchNews();
  },
};
</script>


<style scoped>
/* Typography & Colors */
.text-dark-blue {
  font-size: 1.2rem;
  color: #0a1a5c;
}
.news-title {
  margin-bottom: 0.5rem; /* ระยะห่างหัวข้อ */
}
.title-text {
  color: #0a1a5c;
  font-size: 2rem;
  text-align: left;
  /* กำหนดให้เท่ากับ padding ของกล่องข่าว */
  padding-left: 12.5rem;
  padding-right: 1.5rem;
  box-sizing: border-box;
  margin-bottom: 2rem; /* เพิ่มระยะห่างจากกรอบ */
}

/* Layout */
.content-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}
.announcement-box {
  border: 2px solid #aab8e9;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 900px;
  background-color: #ffffff;
  box-sizing: border-box;
}

/* Header ประกาศ */
.announcement-header {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #000;
  text-align: left;
}

/* Announcement Item */
.announcement-item {
  background-color: #e9f0ff;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Number Circle */
.number-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 1.5px solid #0a1a5c;
  color: #0a1a5c;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Text & Description */
.news-description {
  color: #4a4a4a;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}
.news-date {
  color: #6c757d;
  font-size: 0.85rem;
  margin-top: 18px;
  display: block;
}

/* Pagination */
.pagination-nav {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}
.btn-page {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.btn-page:hover {
  background-color: #2563eb;
}
.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-page.active {
  background-color: #1d4ed8;
}

/* Responsive */
@media (max-width: 768px) {
  .title-text { font-size: 1.5rem; padding-left: 1rem; padding-right: 1rem; }
  .text-dark-blue { font-size: 1rem; }
  .announcement-item { padding: 0.75rem 1rem; }
  .number-circle { width: 30px; height: 30px; font-size: 0.9rem; }
  .news-description { font-size: 0.9rem; }
  .announcement-header { font-size: 1.5rem; }
}
@media (max-width: 480px) {
  .title-text { font-size: 1.3rem; padding-left: 0.75rem; padding-right: 0.75rem; }
  .text-dark-blue { font-size: 0.95rem; }
  .number-circle { width: 28px; height: 28px; font-size: 0.85rem; }
  .news-description { font-size: 0.85rem; }
  .announcement-header { font-size: 1.3rem; }
}
</style>