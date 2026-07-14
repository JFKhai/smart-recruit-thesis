import { redirect } from 'next/navigation'

// Trang này đã được gộp vào "Cài đặt thông báo" (tab Thông báo việc làm).
// Giữ route để các link/bookmark cũ vẫn hoạt động.
export default function JobAlertsRedirect() {
  redirect('/candidate/notification-settings?tab=alerts')
}
