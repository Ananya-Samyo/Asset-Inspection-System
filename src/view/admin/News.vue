<template>
  <div class="container py-5">
    <!-- ================== หัวข้อใหญ่ ================== -->
    <div class="title-wrapper mx-auto">
      <h2 class="fw-bold title-text">
        ตรวจสอบครุภัณฑ์ประจำปี {{ currentYear + 543 }}
      </h2>
    </div>

    <!-- ================== กรอบข่าวประกาศ ================== -->
    <div class="content-center">
      <div class="notification-box mx-auto">

        <!-- ===== หัวข้อ + ปุ่มเพิ่มข่าว ===== -->
        <div class="header-news">
          <h2 class="announcement-title">ประกาศแจ้งเตือน</h2>
          <button class="btn-add-news" @click="openAddModal">+ เพิ่มข่าวประกาศ</button>
        </div>

        <!-- ===== เนื้อหาข่าว ===== -->
        <div v-if="paginatedNews.length === 0" class="alert alert-light text-center mb-0">
          <i class="bi bi-info-circle"></i> ยังไม่มีการกำหนดช่วงเวลาตรวจสอบ
        </div>

        <div v-else>
          <div
            v-for="(data, index) in paginatedNews"
            :key="data.news_id"
            class="announcement-item"
          >
            <div class="d-flex align-items-center gap-3">
              <!-- เลขลำดับ -->
              <div class="number-circle">
                {{ startIndex + index + 1 }}
              </div>

              <!-- ข้อมูลข่าว -->
              <div class="text-start news-content">
                <div class="fw-semibold text-dark-blue">{{ data.title }}</div>
                <p class="news-description mb-1">{{ data.description }}</p>
                <small class="text-muted d-block">
                  วันที่ {{ formatDate(data.start_date) }}
                </small>
              </div>
            </div>

            <!-- ปุ่มแก้ไข / ลบ -->
            <div class="action-btns">
              <div class="icon edit-icon" @click="openEditModal(data)" title="แก้ไข">
                <span class="material-icons">edit</span>
              </div>
              <div class="icon delete-icon" @click="deleteNews(data.news_id)" title="ลบ">
                <span class="material-icons">delete</span>
              </div>
            </div>
          </div>

          <!-- ===== Pagination ===== -->
          <nav class="pagination-nav mt-4">
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

    <!-- ================== Modal เพิ่ม/แก้ไขข่าว ================== -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ isEditMode ? 'แก้ไขข่าวประกาศ' : 'เพิ่มข่าวประกาศ' }}</h3>
        <form @submit.prevent="submitNews" novalidate>
          <div class="form-group">
            <label><strong>หัวข้อข่าวประกาศ</strong> <span class="text-danger">*</span></label>
            <input
              v-model="newNews.title"
              type="text"
              required
              @input="validateField('title')"
            />
            <span v-if="errors.title" class="error-text">*กรุณากรอกข้อความ</span>
          </div>

          <div class="form-group">
            <label><strong>รายละเอียดข่าวประกาศ</strong> <span class="text-danger">*</span></label>
            <textarea
              v-model="newNews.description"
              required
              @input="validateField('description')"
            ></textarea>
            <span v-if="errors.description" class="error-text">*กรุณากรอกข้อความ</span>
          </div>

          <div class="form-group">
            <label><strong>กำหนดวันเริ่มต้น</strong> <span class="text-danger">*</span></label>
            <input
              v-model="newNews.start_date"
              type="date"
             :min="today" 
              required
              @input="validateField('start_date')"
            />
            <span v-if="errors.start_date" class="error-text">*กรุณากรอกข้อความ</span>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-add-news">บันทึก</button>
            <button type="button" class="btn-cancel" @click="closeAddModal">ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
import { endpoints } from "../api"; 

export default {
  name: "Home",
  data() {
    return {
      currentYear: new Date().getFullYear(),
      news: [],
      loading: true,
      currentPage: 1,
      perPage: 10,
      showModal: false,
      isEditMode: false,
      editId: null,
      newNews: { title: "", description: "", start_date: "" },
      errors: { title: false, description: false, start_date: false },
      today: new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    };
  },
  computed: {
    sortedNews() {
      // ✅ กรองเฉพาะข่าวที่ยังไม่หมดอายุ
      const activeNews = this.news.filter((n) => this.isNewsActive(n));
      return activeNews
        .slice()
        .sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at);
          const dateB = new Date(b.updated_at || b.created_at);
          return dateB - dateA;
        });
    },
    paginatedNews() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.sortedNews.slice(start, start + this.perPage);
    },
    totalPages() {
      return Math.ceil(this.sortedNews.length / this.perPage);
    },
    startIndex() {
      return (this.currentPage - 1) * this.perPage;
    },
  },
  methods: {
    async fetchNews() {
      try {
        // ✅ ใช้ endpoint ฝั่ง admin ตามโครงสร้างใหม่
        const res = await axios.get(endpoints.admin.news);
        console.log("✅ Admin News:", res);
        this.news = Array.isArray(res.data.data) ? res.data.data : [];
        this.loading = false;
      } catch (err) {
        console.error("❌ Error fetching news:", err);
      }
    },

   isNewsActive(news) {
     if (!news.start_date) return false;
     const start = new Date(news.start_date);
     const expire = new Date(start);
     expire.setDate(start.getDate() + 365); // ✅ อายุ 1 วัน (ถ้าต้องการ 14 วัน แก้เป็น +14)
     const now = new Date();
     return now <= expire;
   },

    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    openAddModal() {
      this.showModal = true;
      this.isEditMode = false;
      this.newNews = { title: "", description: "", start_date: "" };
      this.errors = { title: false, description: false, start_date: false };
    },

    openEditModal(news) {
      this.showModal = true;
      this.isEditMode = true;
      this.editId = news.news_id;
      this.newNews = {
        title: news.title,
        description: news.description,
        start_date: news.start_date,
      };
      this.errors = { title: false, description: false, start_date: false };
    },

    closeAddModal() {
      this.showModal = false;
    },

    validateField(field) {
      this.errors[field] = !this.newNews[field];
    },

    async submitNews() {
      this.validateField("title");
      this.validateField("description");
      this.validateField("start_date");

      if (this.errors.title || this.errors.description || this.errors.start_date)
        return;

      const result = await Swal.fire({
        title: this.isEditMode ? "ยืนยันการแก้ไขข่าว?" : "ยืนยันการเพิ่มข่าว?",
        text: this.isEditMode
          ? "คุณต้องการบันทึกการแก้ไขข่าวนี้หรือไม่?"
          : "คุณต้องการบันทึกข่าวนี้หรือไม่?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
      });

      if (result.isConfirmed) {
        try {
          let res;
          if (this.isEditMode) {
            res = await axios.put(
              `${endpoints.admin.news}/${this.editId}`,
              this.newNews
            );
          } else {
            res = await axios.post(endpoints.admin.news, this.newNews);
          }

          if (res.data.success) {
            if (this.isEditMode) {
              const idx = this.news.findIndex(
                (n) => n.news_id === this.editId
              );
              if (idx !== -1)
                this.news[idx].updated_at = new Date().toISOString();
            }

            Swal.fire({
              icon: "success",
              title: this.isEditMode ? "แก้ไขข่าวสำเร็จ" : "เพิ่มข่าวสำเร็จ",
              timer: 1500,
              showConfirmButton: false,
            });

            this.fetchNews();
            this.closeAddModal();
          } else {
            Swal.fire("เกิดข้อผิดพลาด", res.data.message || "", "error");
          }
        } catch (err) {
          console.error("❌ Error:", err);
          Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข่าวได้", "error");
        }
      }
    },

    async deleteNews(id) {
      const result = await Swal.fire({
        title: "คุณต้องการลบข่าวนี้หรือไม่?",
        text: "คุณไม่สามารถย้อนกลับได้!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ลบ",
        cancelButtonText: "ยกเลิก",
      });

      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`${endpoints.admin.news}/${id}`);
          if (res.data.success === true) {
            Swal.fire({
              icon: "success",
              title: "ลบข่าวสำเร็จ",
              timer: 1500,
              showConfirmButton: false,
            });
            this.fetchNews();
          } else {
            Swal.fire("เกิดข้อผิดพลาด", res.data.message || "", "error");
          }
        } catch (err) {
          console.error(err);
          Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบข่าวได้", "error");
        }
      }
    },
  },
  mounted() {
    this.fetchNews();
  },
};
</script>


<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.text-dark-blue {
  color: #0a1a5c;
}

/* ================== TITLE ================== */
.title-wrapper {
  max-width: 900px;
  margin: 0 auto 2rem auto;
  text-align: left;
}

.title-text {
  color: #0a1a5c;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

/* ================== MAIN BOX ================== */
.content-center {
  display: flex;
  justify-content: center;
  width: 100%;
}

.notification-box {
  border: 2px solid #aab8e9;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 900px;
  background-color: #fff;
  box-sizing: border-box;
}

/* ================== HEADER ================== */
.header-news {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 10px;
}

.announcement-title {
  color: #000;
  font-weight: 600;
  font-size: 1.8rem;
  margin: 0;
}

.btn-add-news {
  background-color: #28a745;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.btn-add-news:hover {
  background-color: #218838;
}

/* ================== NEWS ITEM ================== */
.announcement-item {
  background-color: #e9f0ff;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.number-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #fff;
  border: 1.2px solid #0a1a5c;
  color: #0a1a5c;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* --- เนื้อหาข่าว --- */
.news-content {
  display: flex;
  flex-direction: column;
  gap: 7px; /* เพิ่มระยะห่างหัวข้อกับรายละเอียด */
  min-width: 0;
}

.news-content .fw-semibold {
  font-size: 1.2rem;
  margin-bottom: 4px; /* ห่างจากเลขลำดับ */
}

.news-description {
  color: #4a4a4a;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
  word-wrap: break-word;
}

.news-content small {
  color: #6c757d;
  font-size: 0.85rem;
  margin-top: 6px; /* เพิ่มระยะห่างจากรายละเอียดข่าว */
  display: block; /* เพื่อให้ margin-top ใช้งานได้ */
}

/* ================== ACTION BUTTONS ================== */
.action-btns {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.action-btns .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.edit-icon {
  background-color: #fff8e1;
}
.edit-icon .material-icons {
  color: #ffc107;
}
.edit-icon:hover {
  background-color: #f8eac3;
  transform: translateY(-2px);
}

.delete-icon {
  background-color: #f8d7da;
}
.delete-icon .material-icons {
  color: #dc3545;
}
.delete-icon:hover {
  background-color: #fac5ca;
  transform: translateY(-2px);
}

/* ================== PAGINATION ================== */
.pagination-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  flex-direction: row;
  margin-top: 20px;
  overflow-x: auto;
  scrollbar-width: none;
}
.pagination-nav::-webkit-scrollbar {
  display: none;
}

.btn-page {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  flex-shrink: 0;
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

/* ================== MODAL ================== */
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
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 20px 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-sizing: border-box;
}

.modal-content h3 {
  margin-top: 0;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.form-group input,
.form-group textarea {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.error-text {
  color: #d9534f;
  font-size: 0.875rem;
  margin-top: 2px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1rem;
}

.modal-actions .btn-add-news {
  background-color: #1d4ed8;
  border-radius: 6px;
  padding: 8px 16px;
}
.modal-actions .btn-add-news:hover {
  background-color: #1b40c4;
}

.btn-cancel {
  background: #ccc;
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
}
.btn-cancel:hover {
  background: #999;
}


/* ================== RESPONSIVE MOBILE ================== */
@media (max-width: 768px) {
  .title-text {
    font-size: 1.5rem;
    text-align: center;
  }

  .notification-box {
    padding: 1rem;
  }

  .announcement-title {
    font-size: 1.4rem;
  }

  .header-news {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .btn-add-news {
    width: 100%;
    text-align: center;
  }

  .announcement-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-btns {
    margin-left: 0;
  }

  .modal-content {
    width: 90%;
    padding: 15px 20px;
  }

  /* Pagination mobile */
  .pagination-nav {
    justify-content: flex-start;
    overflow-x: auto;
    gap: 6px;
    padding-bottom: 4px;
  }
  .btn-page {
    font-size: 0.9rem;
    padding: 5px 10px;
  }
}

/* มือถือเล็ก */
@media (max-width: 480px) {
  .title-text { font-size: 1.3rem; }
  .announcement-title { font-size: 1.2rem; }
  .news-description { font-size: 0.9rem; }
  .number-circle { width: 30px; height: 30px; font-size: 0.9rem; }
  .btn-add-news { font-size: 0.9rem; padding: 0.5rem 0.8rem; }
  .pagination-nav { gap: 5px; }
  .btn-page { font-size: 0.85rem; padding: 4px 8px; }
}

/* จอเล็กสุด */
@media (max-width: 360px) {
  .title-text { font-size: 1.1rem; }
  .announcement-title { font-size: 1rem; }
  .notification-box { padding: 0.75rem; }
  .announcement-item { padding: 0.75rem; }
  .btn-page { font-size: 0.8rem; padding: 3px 7px; }
}

</style>