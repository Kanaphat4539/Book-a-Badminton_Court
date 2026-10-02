/**
 * Thai/English copy for the player-facing shell components that are mounted outside any single
 * page: the ban notice dialog, the full-screen loading overlay, and the shared dialog close label.
 * Brand tokens (KMITL BADMINTON) stay identical in both languages by design.
 */
const playerUiCopy = {
  en: {
    loadingAria: 'Preparing court data',
    loadingImageAlt: 'A badminton player stepping back, jumping and swinging the racket in a loop',
    loadingTitle: 'Loading',
    loadingDetail: 'Preparing court data',
    loadingDetailHint: 'Just a moment',
    dialogCloseLabel: 'Close',
    banTitle: 'Your account has been suspended',
    banBody: 'Your court booking access is temporarily suspended because two rule violations were recorded, for example a missed check-in or a cancellation after the allowed time.',
    banUntilLabel: 'Ban ends at:',
    banUntilUnknown: 'Not specified',
    banResetNote: 'After the ban ends, your strike count is reset to 0 automatically.',
    banAcknowledge: 'Acknowledge',
  },
  th: {
    loadingAria: 'กำลังเตรียมข้อมูลสนาม',
    loadingImageAlt: 'นักแบดถอยหลัง กระโดด และเหวี่ยงไม้ตบต่อเนื่อง',
    loadingTitle: 'กำลังโหลด',
    loadingDetail: 'กำลังเตรียมข้อมูลสนาม',
    loadingDetailHint: 'อีกสักครู่นะ',
    dialogCloseLabel: 'ปิด',
    banTitle: 'บัญชีของคุณถูกระงับการใช้งาน',
    banBody: 'คุณถูกระงับการจองคอร์ทชั่วคราว เนื่องจากมีการทำผิดกฎครบ 2 ครั้ง (เช่น ไม่มาเช็คอิน หรือยกเลิกหลังเวลาที่กำหนด)',
    banUntilLabel: 'ระยะเวลาพ้นแบน:',
    banUntilUnknown: 'ไม่ระบุ',
    banResetNote: 'หลังจากพ้นแบน จำนวนความผิดจะถูกรีเซ็ตเป็น 0 อัตโนมัติ',
    banAcknowledge: 'รับทราบ',
  },
};

module.exports = { playerUiCopy };
