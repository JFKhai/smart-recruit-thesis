# ROUTES AUDIT

## 1) Tat ca route/page hien co

Du an dang dung `App Router` (`/app`), khong co thu muc `/pages`.

| Route | File |
|---|---|
| `/` | `app/page.tsx` |
| `/login` | `app/login/page.tsx` |
| `/register` | `app/register/page.tsx` |
| `/register/candidate` | `app/register/candidate/page.tsx` |
| `/register/employer` | `app/register/employer/page.tsx` |
| `/candidate/dashboard` | `app/candidate/dashboard/page.tsx` |
| `/candidate/matches` | `app/candidate/matches/page.tsx` |
| `/candidate/applications` | `app/candidate/applications/page.tsx` |
| `/candidate/cv` | `app/candidate/cv/page.tsx` |
| `/candidate/notifications` | `app/candidate/notifications/page.tsx` |
| `/candidate/notification-settings` | `app/candidate/notification-settings/page.tsx` (gộp Thông báo việc làm + Email) |
| `/candidate/job-alerts` | redirect → `/candidate/notification-settings?tab=alerts` |
| `/candidate/email-settings` | redirect → `/candidate/notification-settings?tab=email` |
| `/employer/dashboard` | `app/employer/dashboard/page.tsx` |
| `/employer/post-job` | `app/employer/post-job/page.tsx` |
| `/employer/company-profile` | `app/employer/company-profile/page.tsx` |
| `/employer/email-settings` | `app/employer/email-settings/page.tsx` |
| `/employer/candidates` | `app/employer/candidates/page.tsx` |
| `/fb-generator` | `app/fb-generator/page.tsx` |

Tong cong: **16 route page**.

## 2) Route dang loi (missing component/import error)

### 2.1 Route co loi build/runtime

- Da fix loi `/login` bang cach boc phan dung `useSearchParams()` trong `Suspense`.

### 2.2 Route duoc link toi nhung chua co page (missing page/component)

Da tao page placeholder cho cac route tung thieu:

- `/employer/candidates`
- `/fb-generator`

### 2.3 Import error

- Khong phat hien import error lam fail compile o cac page hien co.

## 3) Component dung chung nhung chua tao

### Chua phat hien component import bi thieu

- Cac component duoc import boi page/layout deu ton tai (`PublicNavbar`, `CandidateSidebar`, `EmployerSidebar`, `MobileDrawer`, `JobCard`, `StatusBadge`, ...).

### Thanh phan dung chung nen tach ra (hien dang lap lai)

Khong bat buoc, nhung co the tao them de nhat quan va de maintain:

- `DashboardMobileHeader` (dang lap lai trong `layouts/CandidateLayout.tsx` va `layouts/EmployerLayout.tsx`)
- `AppBrand` (logo "Smart Recruit" lap lai o navbar + sidebar)
- `DashboardShell` (khung desktop sidebar + mobile drawer + main content lap lai giua 2 layout)

## 4) Sidebar va Navbar co duoc dung nhat quan khong

### Navbar

- Public pages (`/`, `/login`, `/register`, `/register/*`) dung `PublicLayout` -> co `PublicNavbar` + `Footer`.
- Candidate/Employer pages dung layout rieng, **khong hien `PublicNavbar`** (chi co mobile header tu custom markup + sidebar/drawer).
- Da xoa import thua `PublicNavbar` khoi `CandidateLayout` va `EmployerLayout`.

Ket luan: **khong hoan toan nhat quan** giua public zone va dashboard zone (co the la chu dich UX, nhung hien tai import thua).

### Sidebar

- Candidate pages dung `CandidateLayout` -> `CandidateSidebar` + `MobileDrawer`.
- Employer pages dung `EmployerLayout` -> `EmployerSidebar` + `MobileDrawer`.
- Muc route trong `EmployerSidebar` da dong bo voi route that te.

Ket luan: khung dung sidebar nhat quan va menu employer da map dung route.
