/**
 * Thai/English copy for the STUDENT (player) view of /dashboard.
 *
 * Same shape as the other localization modules: locale-keyed dictionaries with identical
 * key sets. Brand tokens (KMITL Badminton, Main Sports Complex) and machine values
 * (status codes, booking ids, court numbers) stay language-neutral; `{placeholders}` are
 * filled by the page so the copy stays a single source of truth.
 */
const playerDashboardCopy = {
  en: {
    bannerEyebrow: 'Ready to play',
    bannerTitle: 'Hi, {name}',
    bannerSubtitle: 'Welcome back to your personal KMITL Badminton portal. Book a court, check your schedule, and get ready to smash.',
    bannerPortalLabel: 'Player Dashboard',
    roleStudent: 'STUDENT',
    roleAdmin: 'ADMIN',

    upcomingTitle: 'Upcoming Booking',
    upcomingSubtitle: 'Your next court reservation',
    confirmedBadge: 'CONFIRMED',
    reservedCourtLabel: 'Reserved Court',
    timeLabel: 'Time',
    dateLabel: 'Date',
    venueLabel: 'Main Sports Complex • Gymnasium 1',
    checkInAction: 'Check-in',
    cancelAction: 'Cancel',
    courtFallback: 'Court',
    courtPrefix: 'Court {court}',

    playingTitle: 'Currently Playing',
    playingSubtitle: 'You are checked in',
    activeBadge: 'ACTIVE',
    activeCourtLabel: 'Active Court',
    timeRemaining: 'TIME REMAINING (ENDS AT {time})',

    bookCourtTitle: 'Book Court',
    bookCourtSubtitle: 'Reserve a badminton court',
    scanQrTitle: 'Scan QR',
    scanQrSubtitle: 'Scan to enter the court',

    recentTitle: 'Recent Bookings',
    viewAll: 'View all',
    noBookingsYet: 'No bookings yet.',

    rulesTitle: 'Court access and check-in rules',
    rulesBody: 'Scan the QR code at the court to check in. If you cancel late or arrive more than 15 minutes after your start time, the system records one strike; two strikes ban your account for 24 hours.',

    historyTitle: 'Booking History',
    historySubtitle: 'All of your badminton court bookings ({count} records)',
    historyTabAll: 'All',
    historyTabActive: 'In progress',
    historyTabPending: 'Awaiting check-in',
    historyTabCompleted: 'Completed',
    historyTabCancelled: 'Cancelled',
    historyEmpty: 'No bookings in this category.',
    historyEmptyHint: 'You can book a new court from the “Book Court” menu.',
    historyTimeLabel: 'Time',
    historyDurationLabel: 'Duration',
    historyDurationValue: '1 hour',
    historySystemStatusLabel: 'System status',
    historyClose: 'Close',

    cancelDialogTitle: 'Cancel this booking',
    cancelDialogQuestion: 'Do you want to cancel this court booking?',
    cancelDialogRuleOne: 'You must cancel before the first 15 minutes after your start time.',
    cancelDialogRuleTwo: 'If you cancel in time, you can book one more court today.',
    cancelDialogClose: 'Close',
    cancelDialogConfirm: 'Confirm cancel',
  },
  th: {
    bannerEyebrow: 'พร้อมลงสนาม',
    bannerTitle: 'สวัสดี {name}',
    bannerSubtitle: 'ยินดีต้อนรับกลับสู่พอร์ทัล KMITL Badminton ของคุณ จองสนาม ดูตารางของคุณ แล้วเตรียมตบให้สนุก',
    bannerPortalLabel: 'แดชบอร์ดผู้เล่น',
    roleStudent: 'นักศึกษา',
    roleAdmin: 'ผู้ดูแล',

    upcomingTitle: 'รายการจองถัดไป',
    upcomingSubtitle: 'การจองสนามครั้งถัดไปของคุณ',
    confirmedBadge: 'ยืนยันแล้ว',
    reservedCourtLabel: 'สนามที่จองไว้',
    timeLabel: 'เวลา',
    dateLabel: 'วันที่',
    venueLabel: 'ศูนย์กีฬาหลัก • อาคารยิมเนเซียม 1',
    checkInAction: 'เช็กอิน',
    cancelAction: 'ยกเลิก',
    courtFallback: 'สนาม',
    courtPrefix: 'สนาม {court}',

    playingTitle: 'กำลังใช้งานอยู่',
    playingSubtitle: 'คุณเช็กอินแล้ว',
    activeBadge: 'กำลังใช้งาน',
    activeCourtLabel: 'สนามที่ใช้งาน',
    timeRemaining: 'เวลาที่เหลือ (สิ้นสุด {time})',

    bookCourtTitle: 'จองสนาม',
    bookCourtSubtitle: 'จองคอร์ทแบดมินตัน',
    scanQrTitle: 'สแกน QR',
    scanQrSubtitle: 'สแกนเพื่อเข้าสนาม',

    recentTitle: 'ประวัติการจองล่าสุด',
    viewAll: 'ดูทั้งหมด',
    noBookingsYet: 'ยังไม่มีรายการจอง',

    rulesTitle: 'กฎการเข้าใช้คอร์ทและเช็กอิน',
    rulesBody: 'กรุณาสแกน QR หน้าสนามเพื่อเช็กอิน หากยกเลิกช้าหรือมาสายเกิน 15 นาที ระบบจะนับว่าผิดกฎ 1 ครั้ง (สะสมความผิดครบ 2 ครั้งจะถูกแบน 24 ชั่วโมง)',

    historyTitle: 'ประวัติการจองทั้งหมด',
    historySubtitle: 'รายการประวัติการจองคอร์ทแบดมินตันทั้งหมดของคุณ ({count} รายการ)',
    historyTabAll: 'ทั้งหมด',
    historyTabActive: 'กำลังเล่น',
    historyTabPending: 'รอเช็คอิน',
    historyTabCompleted: 'สำเร็จ',
    historyTabCancelled: 'ยกเลิกแล้ว',
    historyEmpty: 'ไม่พบประวัติการจองในหมวดนี้',
    historyEmptyHint: 'คุณสามารถจองคอร์ทใหม่ได้ที่เมนู “จองสนาม”',
    historyTimeLabel: 'ช่วงเวลา',
    historyDurationLabel: 'ระยะเวลา',
    historyDurationValue: '1 ชั่วโมง',
    historySystemStatusLabel: 'สถานะระบบ',
    historyClose: 'ปิดหน้าต่าง',

    cancelDialogTitle: 'ยืนยันการยกเลิกจองคอร์ท',
    cancelDialogQuestion: 'คุณต้องการยกเลิกการจองคอร์ทนี้ใช่หรือไม่?',
    cancelDialogRuleOne: 'ต้องยกเลิกก่อนครบ 15 นาทีหลังเวลาเริ่มจอง',
    cancelDialogRuleTwo: 'หากยกเลิกทันเวลา คุณสามารถจองคอร์ทใหม่ในวันนี้ได้ 1 ครั้ง',
    cancelDialogClose: 'ปิด',
    cancelDialogConfirm: 'ยืนยันยกเลิก',
  },
};

module.exports = { playerDashboardCopy };
