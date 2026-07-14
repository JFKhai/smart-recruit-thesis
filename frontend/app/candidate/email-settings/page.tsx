import { redirect } from 'next/navigation'

export default function EmailSettingsRedirect() {
  redirect('/candidate/notification-settings?tab=email')
}
