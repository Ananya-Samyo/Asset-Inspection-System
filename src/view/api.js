// =======================
// BASE URL
// =======================
const BASE_URL = "http://localhost:3000/api";
const ADMIN_BASE = `${BASE_URL}/admin`;
const AUDIT_BASE = `${BASE_URL}/audit`;

// =======================
// ADMIN API
// =======================
export const adminEndpoints = {
    //  คณะกรรมการตรวจสอบ
    auditCommittee: `${ADMIN_BASE}/audit_committee`,
    auditCommitteeYears: `${ADMIN_BASE}/audit-committee/years`,
    addAuditCommittee: `${ADMIN_BASE}/add_audit_committee`,
    deleteAuditCommittee: (user_id) => `${ADMIN_BASE}/audit_committee/${user_id}`,
    copyAuditCommittee: `${ADMIN_BASE}/audit_committee/copy`,

    //  ครุภัณฑ์
    assetLogs: `${ADMIN_BASE}/asset/logs`,
    
    assetUpdateStatus: (id) => `${ADMIN_BASE}/asset/${id}/update-status`,
    assetGet: (id) => `${ADMIN_BASE}/asset/${id}`,
    assetImport: `${ADMIN_BASE}/asset/import`,
    assetClear: `${ADMIN_BASE}/asset/clear`,

    //  ข่าวและเวลาเปิดทำการ
    news: `${ADMIN_BASE}/news`,
    openingTimes: `${ADMIN_BASE}/opening_times`,
};

// =======================
// AUDIT API
// =======================
export const auditEndpoints = {
    //  ข่าวประกาศฝั่ง Audit
    assetAll: `${AUDIT_BASE}/asset`,
    news: `${AUDIT_BASE}/news`,

    //  ข้อมูลครุภัณฑ์
    asset: `${AUDIT_BASE}/asset`,
    assetUpdate: (id) => `${AUDIT_BASE}/asset/${id}/update`,

    //  โหลดรูปภาพจาก uploads
    uploads: `${AUDIT_BASE}/uploads`,
};

// =======================
//  SHARE API (ใช้ร่วมกัน)
/// =======================
export const sharedEndpoints = {
    //  ข้อมูลครุภัณฑ์
    assetGet: (id) => `${BASE_URL}/asset/${id}`,
    assetByInventory: (inventory_number) => `${BASE_URL}/asset/inventory/${inventory_number}`,
    
    //  อัปเดตสถานะครุภัณฑ์ (ฝั่งแอดมิน)
    assetUpdateStatus: (id) => `${BASE_URL}/admin/asset/${id}/update-status`,

    //  โหลดรูปภาพจาก Audit
    uploads: `${BASE_URL}/audit/uploads`,

    //  Dashboard
    dashboard: `${BASE_URL}/dashboard`,
};

// =======================
//  รวม Export เดียว
// =======================
export const endpoints = {
    admin: adminEndpoints,
    audit: auditEndpoints,
    shared: sharedEndpoints,
};
