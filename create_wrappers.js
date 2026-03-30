const fs = require('fs');
const path = require('path');

const routes = {
  'src/app/page.js': "import HomePage from '@/pages/HomePage';\n\nexport default function Page() { return <HomePage />; }",
  'src/app/login/page.js': "import LoginPage from '@/pages/LoginPage';\n\nexport default function Page() { return <LoginPage />; }",
  'src/app/signup/page.js': "import SignupPage from '@/pages/SignupPage';\n\nexport default function Page() { return <SignupPage />; }",
  'src/app/(dashboard)/dashboard/page.js': "import DashboardPage from '@/pages/DashboardPage';\n\nexport default function Page() { return <DashboardPage />; }",
  'src/app/(dashboard)/report/page.js': "import ReportPage from '@/pages/ReportPage';\n\nexport default function Page() { return <ReportPage />; }",
  'src/app/(dashboard)/track/page.js': "import TrackPage from '@/pages/TrackPage';\n\nexport default function Page() { return <TrackPage />; }",
  'src/app/(dashboard)/about/page.js': "import AboutPage from '@/pages/AboutPage';\n\nexport default function Page() { return <AboutPage />; }",
  'src/app/(dashboard)/notifications/page.js': "import NotificationsPage from '@/pages/NotificationsPage';\n\nexport default function Page() { return <NotificationsPage />; }",
  'src/app/(dashboard)/admin/dashboard/page.js': "import AdminDashboard from '@/pages/admin/AdminDashboard';\n\nexport default function Page() { return <AdminDashboard />; }",
  'src/app/(dashboard)/mentions/page.js': "import MentionsPage from '@/pages/MentionsPage';\n\nexport default function Page() { return <MentionsPage />; }",
  'src/app/(dashboard)/explore/page.js': "import ExplorePage from '@/pages/ExplorePage';\n\nexport default function Page() { return <ExplorePage />; }",
  'src/app/(dashboard)/settings/page.js': "import SettingsPage from '@/pages/SettingsPage';\n\nexport default function Page() { return <SettingsPage />; }"
};

Object.entries(routes).forEach(([file, content]) => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log('Created wrapper:', fullPath);
});
