import StudentSettingsPage from "./pages/student/settings/StudentSettingsPage";
import StudentExamResultPage from "./pages/student/examresult/StudentExamResultPage";
import StudentGradesPage from "./pages/student/grades/StudentGradesPage";
import StudentExamHistoryPage from "./pages/student/examhistory/StudentExamHistoryPage";
import { Navigate, Route, Routes } from 'react-router-dom'
import { SignInPage } from './pages/auth/SignInPage'
import { TeacherSignUpPage } from './pages/teacher/signup/TeacherSignUpPage'
import { StudentSignUpPage } from './pages/student/signup/StudentSignUpPage'
import { TeacherDashboardPage } from './pages/teacher/dashboard/TeacherDashboardPage'
import { ExamAlertsPage } from './pages/teacher/dashboard/ExamAlertsPage'
import { StudentDashboardPage } from './pages/student/dashboard/StudentDashboardPage'
import { StudentClassesPage } from './pages/student/classes/StudentClassesPage'
import { TeacherClassesPage } from './pages/teacher/classes/TeacherClassesPage'
import { TeacherClassDetailPage } from './pages/teacher/classes/TeacherClassDetailPage'
import { StudentExamDetailsPage } from './pages/student/examdetails/StudentExamDetailsPage'
import { TeacherExamsPage } from './pages/teacher/exams/TeacherExamsPage'
import { TeacherQuestionBankPage } from './pages/teacher/questionbank/TeacherQuestionBankPage'
import { TeacherLiveMonitoringPage } from './pages/teacher/livemonitoring/TeacherLiveMonitoringPage'
import { TeacherStudentMonitoringPage } from './pages/teacher/studentmonitoring/TeacherStudentMonitoringPage'
import { SubmissionsGradingPage } from './pages/teacher/grading/SubmissionsGradingPage'
import { GradebookPage } from './pages/teacher/gradebook/GradebookPage'
import { ReportsPage } from './pages/teacher/reports/ReportsPage'
import { SettingsPage } from './pages/teacher/settings/SettingsPage'
import { StudentExamTakingPage } from './pages/student/examtaking/StudentExamTakingPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup/teacher" element={<TeacherSignUpPage />} />
      <Route path="/signup/student" element={<StudentSignUpPage />} />
      <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
      <Route path="/teacher/exams/:examId/alerts" element={<ExamAlertsPage />} />
      <Route path="/student/dashboard" element={<StudentDashboardPage />} />
      <Route path="/student/classes" element={<StudentClassesPage />} />
      <Route path="/student/exams" element={<StudentExamDetailsPage />} />
      <Route path="/student/grades" element={<StudentGradesPage />} />
      <Route path="/student/exam-history" element={<StudentExamHistoryPage />} />
      <Route path="/student/exam-result" element={<StudentExamResultPage />} />
      <Route path="/student/settings" element={<StudentSettingsPage />} />
      <Route path="/student/exam-taking" element={<StudentExamTakingPage />} />
      <Route path="/teacher/classes" element={<TeacherClassesPage />} />
      <Route path="/teacher/classes/:classId" element={<TeacherClassDetailPage />} />
      <Route path="/student/exam-details" element={<StudentExamDetailsPage />} />
      <Route path="/teacher/exams" element={<TeacherExamsPage />} />
      <Route path="/teacher/question-bank" element={<TeacherQuestionBankPage />} />
      <Route path="/teacher/live-monitoring" element={<TeacherLiveMonitoringPage />} />
      <Route path="/teacher/live-monitoring/:studentId" element={<TeacherStudentMonitoringPage />} />
      <Route path="/grading" element={<SubmissionsGradingPage />} />
      <Route path="/gradebook" element={<GradebookPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  )
}

export default App
