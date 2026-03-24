<template>
  <div class="inspectors-page">
    <h1>รายชื่อกรรมการตรวจสอบ ปี {{ currentYear }}</h1>

    <div class="top-bar">
      <div class="left-section">
        <span>รายชื่อกรรมการปี</span>
        <select v-model="selectedYearDropdown" @change="filterByYear">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <div class="right-section">
        <button class="filter-btn" @click="showImportModal = true">คัดลอกปีเก่า</button>
        <button class="add-btn" @click="showAddModal = true">เพิ่มรายชื่อ</button>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ชื่อ - นามสกุล</th>
            <th>Email</th>
            <th>การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(inspector, index) in currentInspectors" :key="inspector.user_id">
            <td>{{ index + 1 }}</td>
            <td>{{ inspector.username }}</td>
            <td>{{ inspector.email }}</td>
            <td>
              <button class="delete-btn" @click="deleteInspector(inspector.user_id)">ลบรายชื่อ</button>
              <button class="edit-btn" @click="openEditModal(inspector)">แก้ไข</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!currentInspectors.length" class="no-data">ไม่มีข้อมูลกรรมการในปีนี้</p>
    </div>

    <!-- Add Inspector Modal -->
    <div v-if="showAddModal" class="modal-backdrop">
      <div class="modal">
        <h3>เพิ่มรายชื่อกรรมการ</h3>

        <div class="modal-input">
          <label for="new-name">ชื่อ - นามสกุล :</label>
          <input id="new-name" v-model.trim="newInspectorName" type="text" placeholder="กรอกชื่อ - นามสกุล" />
        </div>

        <div class="modal-input">
          <label for="new-email">Email (Google) :</label>
          <input id="new-email" v-model.trim="newInspectorEmail" type="email" placeholder="กรอก Email Google" />
        </div>

        <div class="modal-buttons">
          <button class="cancel-btn" @click="showAddModal = false">ยกเลิก</button>
          <button class="import-btn" @click="addInspectorByEmail">เพิ่มรายชื่อ</button>
        </div>
      </div>
    </div>

    <!-- Popup คัดลอกรายชื่อ -->
    <div v-if="showImportModal" class="modal-backdrop">
      <div class="modal">
        <h3>คัดลอกรายชื่อกรรมการจากปีเก่า</h3>

        <div class="modal-input">
          <label for="select-year">เลือกปี:</label>
          <select id="select-year" v-model="selectedYear" @change="loadInspectorsFromYear">
            <option value="">-- เลือกปี --</option>
            <option v-for="year in academicYears" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>

        <div v-if="availableInspectors.length" class="checkbox-list">
          <div v-for="ins in availableInspectors" :key="ins.user_id" class="checkbox-row"
            @click="toggleInspector(ins.user_id)" style="cursor: pointer;">
            <input type="checkbox" :value="ins.user_id" v-model="selectedImportInspectors" style="margin-right: 0.5rem;"
              @click.stop />
            <span>
              <strong>{{ ins.username }}</strong> - {{ ins.position }} (ปี {{ ins.year }})
            </span>
          </div>
        </div>
        <p v-else style="margin-top:10px;">ไม่มีกรรมการในปีที่เลือก</p>

        <div class="modal-buttons">
          <button class="cancel-btn" @click="showImportModal = false">ยกเลิก</button>
          <button class="import-btn" @click="importSelectedInspectors">คัดลอก</button>
        </div>
      </div>
    </div>

    <!-- Edit Inspector Modal -->
    <div v-if="showEditModal" class="modal-backdrop">
      <div class="modal">
        <h3>แก้ไขข้อมูลกรรมการ</h3>

        <div class="modal-input">
          <label>ชื่อ - นามสกุล :</label>
          <input v-model.trim="editInspectorName" type="text" />
        </div>

        <div class="modal-input">
          <label>Email (Google) :</label>
          <input v-model.trim="editInspectorEmail" type="email" />
        </div>

        <div class="modal-buttons">
          <button class="cancel-btn" @click="showEditModal = false">ยกเลิก</button>
          <button class="import-btn" @click="saveInspectorEdit">บันทึก</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
import { endpoints } from "../api";

export default {
  data() {
    return {
      inspectors: [],
      currentYear: new Date().getFullYear() + 543,

      showImportModal: false,
      showAddModal: false,

      newInspectorEmail: "",
      newInspectorName: "",

      // 🔹 ตัวแปรสำหรับ Modal แก้ไข
      showEditModal: false,
      editInspectorId: null,
      editInspectorName: "",
      editInspectorEmail: "",

      selectedYear: "",
      selectedYearDropdown: new Date().getFullYear() + 543,

      availableInspectors: [],
      selectedImportInspectors: [],

      academicYears: [],
      years: []
    };
  },

  computed: {
    currentInspectors() {
      const targetYear = this.selectedYearDropdown || this.currentYear;
      return this.inspectors.filter(
        (ins) => Number(ins.year) === Number(targetYear)
      );
    }
  },

  mounted() {
    this.fetchYears();
    this.fetchInspectors(this.selectedYearDropdown);
  },

  methods: {
    parseYearToBE(yearFromApi) {
      const n = Number(yearFromApi);
      if (!n) return null;
      return n > 2400 ? n : n + 543;
    },
    toGregorianFromBE(yearBE) {
      const n = Number(yearBE);
      return n > 2400 ? n - 543 : n;
    },

    // =================================================================
    // 🔹 ดึงกรรมการตามปี
    // =================================================================
    async fetchInspectors(yearBE) {
      try {
        const year = yearBE ? this.toGregorianFromBE(yearBE) : undefined;
        const res = await axios.get(endpoints.admin.auditCommittee, {
          params: { year }
        });

        const data = Array.isArray(res.data) ? res.data : [];
        this.inspectors = data.map((item) => ({
          user_id: item.user_id,
          username: item.name,
          email: item.email,
          year: this.parseYearToBE(item.year || year)
        }));
      } catch (err) {
        console.error("fetchInspectors error:", err);
        Swal.fire({ icon: "error", title: "ไม่สามารถโหลดข้อมูลกรรมการได้" });
      }
    },

    // =================================================================
    // 🔹 โหลดปีทั้งหมด
    // =================================================================
    async fetchYears() {
      try {
        const res = await axios.get(endpoints.admin.auditCommitteeYears);
        const yearsFromApi = Array.isArray(res.data)
          ? res.data.map((y) => Number(y))
          : [];

        this.years = yearsFromApi.sort((a, b) => b - a);

        const yearsBE = this.years.map((y) => this.parseYearToBE(y));
        this.academicYears = yearsBE.filter((y) => y < this.currentYear);
      } catch (err) {
        console.error("Fetch Years Error:", err);
      }
    },

    filterByYear() {
      this.fetchInspectors(this.selectedYearDropdown);
    },

    // =================================================================
    // 🔹 เพิ่มกรรมการใหม่
    // =================================================================
    async addInspectorByEmail() {
      if (!this.newInspectorName) {
        Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อ - นามสกุล" });
        return;
      }
      if (!this.newInspectorEmail) {
        Swal.fire({ icon: "warning", title: "กรุณากรอก Email" });
        return;
      }

      try {
        const targetYear = this.toGregorianFromBE(this.currentYear);
        const res = await axios.post(endpoints.admin.addAuditCommittee, {
          name: this.newInspectorName.trim(),
          email: this.newInspectorEmail.trim().toLowerCase(),
          year: targetYear
        });

        Swal.fire({ icon: "success", title: res.data.message });

        this.newInspectorName = "";
        this.newInspectorEmail = "";
        this.showAddModal = false;

        this.fetchInspectors(this.selectedYearDropdown);
      } catch (err) {
        console.error("addInspector error:", err);
        Swal.fire({
          icon: "error",
          title: err.response?.data?.message || "ไม่สามารถเพิ่มกรรมการได้"
        });
      }
    },

    // =================================================================
    // 🔹 เปิด Modal แก้ไขกรรมการ
    // =================================================================
    openEditModal(inspector) {
      this.editInspectorId = inspector.user_id;
      this.editInspectorName = inspector.username;
      this.editInspectorEmail = inspector.email;
      this.showEditModal = true;
    },

    // =================================================================
    // 🔹 บันทึกการแก้ไขกรรมการ
    // =================================================================
    async saveInspectorEdit() {
      if (!this.editInspectorName || !this.editInspectorEmail) {
        Swal.fire({ icon: "warning", title: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        return;
      }

      try {
        const year = this.toGregorianFromBE(this.currentYear);

        const payload = {
          name: this.editInspectorName.trim(),
          email: this.editInspectorEmail.trim().toLowerCase(),
          year
        };

        // เรียก API update
        await axios.put(
          endpoints.admin.updateAuditCommittee(this.editInspectorId),
          payload
        );

        Swal.fire({ icon: "success", title: "แก้ไขข้อมูลสำเร็จ" });
        this.showEditModal = false;

        // fetch จาก backend → array จะเรียงตาม backend
        this.fetchInspectors(this.selectedYearDropdown);

      } catch (err) {
        console.error("saveInspectorEdit error:", err);
        Swal.fire({ icon: "error", title: "ไม่สามารถแก้ไขข้อมูลได้" });
      }
    },

    // =================================================================
    // 🔹 โหลดกรรมการจากปีเพื่อคัดลอก
    // =================================================================
    async loadInspectorsFromYear() {
      if (!this.selectedYear) {
        this.availableInspectors = [];
        return;
      }

      try {
        const targetYear = this.toGregorianFromBE(this.selectedYear);
        const res = await axios.get(endpoints.admin.auditCommittee, {
          params: { year: targetYear }
        });

        const data = Array.isArray(res.data) ? res.data : [];

        this.availableInspectors = data
          .map((item) => ({
            user_id: item.user_id,
            username: item.name || item.email.split("@")[0],
            email: item.email,
            position: "Audit Committee",
            year: this.selectedYear
          }))
          .filter(
            (ins) =>
              !this.currentInspectors.some(
                (curr) => Number(curr.user_id) === Number(ins.user_id)
              )
          );

        this.selectedImportInspectors = [];
      } catch (err) {
        console.error("loadInspectorsFromYear error:", err);
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถโหลดข้อมูลกรรมการจากปีที่เลือกได้"
        });
      }
    },

    // =================================================================
    // 🔹 คัดลอกกรรมการจากปีเก่า
    // =================================================================
    async importSelectedInspectors() {
      if (!this.selectedYear || this.selectedImportInspectors.length === 0) {
        Swal.fire({ icon: "warning", title: "กรุณาเลือกกรรมการที่ต้องการคัดลอก" });
        return;
      }

      try {
        const targetYear = this.toGregorianFromBE(this.currentYear);

        const requests = this.selectedImportInspectors.map((userId) => {
          const ins = this.availableInspectors.find(
            (x) => Number(x.user_id) === Number(userId)
          );
          return axios.post(endpoints.admin.copyAuditCommittee, {
            user_id: ins.user_id,
            year: targetYear
          });
        });

        await Promise.all(requests);

        Swal.fire({ icon: "success", title: "คัดลอกสำเร็จ" });

        this.showImportModal = false;
        this.selectedImportInspectors = [];
        this.selectedYear = "";

        this.fetchInspectors(this.selectedYearDropdown);
      } catch (err) {
        console.error("importSelectedInspectors error:", err);
        Swal.fire({ icon: "error", title: "คัดลอกไม่สำเร็จ" });
      }
    },

    // =================================================================
    // 🔹 ลบกรรมการ
    // =================================================================
    async deleteInspector(userId) {
      try {
        const result = await Swal.fire({
          title: "คุณแน่ใจหรือไม่?",
          text: "หากลบแล้วจะไม่สามารถกู้คืนได้",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "ลบรายชื่อ",
          cancelButtonText: "ยกเลิก",
          reverseButtons: false,
          buttonsStyling: true
        });


        if (!result.isConfirmed) return;

        const year = this.toGregorianFromBE(this.currentYear);

        const res = await axios.delete(
          endpoints.admin.deleteAuditCommittee(userId),
          { params: { year } }
        );

        Swal.fire({ icon: "success", title: "ลบสำเร็จ" });

        this.fetchInspectors(this.selectedYearDropdown);
      } catch (err) {
        console.error("deleteInspector error:", err);
        Swal.fire({
          icon: "warning",
          title: "ไม่สามารถลบรายชื่อได้",
          text: "อาจมีการตรวจนับครุภัณฑ์แล้ว",
          confirmButtonText: "ตกลง"
        });
      }
    },

    toggleInspector(userId) {
      const idx = this.selectedImportInspectors.indexOf(userId);
      if (idx >= 0) this.selectedImportInspectors.splice(idx, 1);
      else this.selectedImportInspectors.push(userId);
    }
  }
};
</script>

<style scoped>
.inspectors-page {
  font-family: 'Prompt', sans-serif;
  padding: 10px;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #0d47a1;
  font-size: 28px;
  font-weight: 700;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.left-section span {
  white-space: nowrap;
  font-weight: 600;
}

select {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.filter-btn,
.add-btn {
  padding: 10px 20px;
  margin-right: 10px;
  margin-bottom: 10px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.filter-btn {
  background: linear-gradient(135deg, #ffeb3b, #fbc02d);
  color: #000;
}

.add-btn {
  background: linear-gradient(135deg, #1565c0, #0d47a1);
  color: #fff;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 650px;
}

table th,
table td {
  padding: 12px 15px;
  text-align: center;
  border-bottom: 1px solid #eee;
  font-size: 15px;
}

table th {
  background: #e3f2fd;
  color: #0d47a1;
  font-weight: 700;
}

table tbody tr:hover {
  background: #f9f9f9;
}

button.delete-btn {
  background: #e53935;
  color: #fff;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
}

.no-data {
  text-align: center;
  margin-top: 15px;
  color: #757575;
  font-style: italic;
}

.edit-btn {
  background: #fb8c00;
  color: #fff;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  margin-left: 10px;
}

.edit-btn:hover {
  background: #ef6c00;
}

/* --- Modal --- */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal {
  background: #fff;
  padding: 30px 25px;
  border-radius: 15px;
  width: 480px;
  max-width: 95%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal h3 {
  margin-bottom: 20px;
  color: #0d47a1;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.modal-input {
  margin-bottom: 15px;
}

.modal-input label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
  font-size: 14px;
}

.modal-input input,
select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  outline: none;
  font-size: 14px;
}

.modal-input input:focus,
select:focus {
  border-color: #0d47a1;
  box-shadow: 0 0 6px rgba(13, 71, 161, 0.2);
}

.checkbox-list {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px;
  margin-top: 10px;
  background: #f9f9f9;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
  cursor: pointer;
}

.checkbox-row:hover {
  background: #e3f2fd;
}

.checkbox-row input[type="checkbox"] {
  margin: 0;
}

.checkbox-row span {
  font-size: 14px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.import-btn {
  background: linear-gradient(135deg, #43a047, #2e7d32);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.cancel-btn {
  background: #9e9e9e;
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.import-btn:hover {
  transform: translateY(-2px);
}

.cancel-btn:hover {
  background: #616161;
}

/* ✅ Responsive Design */
@media (max-width: 992px) {
  .top-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .filter-btn,
  .add-btn {
    width: 100%;
    margin-right: 0;
  }

  .table-container {
    padding: 15px;
  }

  table {
    min-width: 100%;
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .inspectors-page {
    padding: 15px;
  }

  h1 {
    font-size: 22px;
  }

  .top-bar {
    gap: 8px;
  }

  .filter-btn,
  .add-btn {
    font-size: 14px;
    padding: 8px 15px;
  }

  .modal {
    width: 90%;
    padding: 20px 15px;
  }

  .modal h3 {
    font-size: 18px;
  }

  .modal-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .import-btn,
  .cancel-btn {
    width: 100%;
  }
}
</style>

<style>
.swal2-actions .swal2-confirm {
  order: 2 !important;
}

.swal2-actions .swal2-cancel {
  order: 1 !important;
}
</style>