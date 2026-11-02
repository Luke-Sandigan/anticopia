import { Navigate, Route, Routes } from 'react-router-dom'
import { SignInPage } from './pages/auth/SignInPage'
import { TeacherSignUpPage } from './pages/classification/teacher/TeacherSignUpPage'
import { StudentSignUpPage } from './pages/classification/student/StudentSignUpPage'
import { TeacherDashboardPage } from './pages/classification/teacher/TeacherDashboardPage'
import { TeacherClassesPage } from './pages/classification/teacher/TeacherClassesPage'
import { TeacherClassDetailPage } from './pages/classification/teacher/TeacherClassDetailPage'
import { TeacherExamsPage } from './pages/classification/teacher/TeacherExamsPage'
import { TeacherQuestionBankPage } from './pages/classification/teacher/TeacherQuestionBankPage'
import { TeacherLiveMonitoringPage } from './pages/classification/teacher/TeacherLiveMonitoringPage'
import { TeacherStudentMonitoringPage } from './pages/classification/teacher/TeacherStudentMonitoringPage'
import { SubmissionsGradingPage } from './pages/teacher/grading/SubmissionsGradingPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/teacher/dashboard" replace />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup/teacher" element={<TeacherSignUpPage />} />
      <Route path="/signup/student" element={<StudentSignUpPage />} />
      <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
      <Route path="/teacher/classes" element={<TeacherClassesPage />} />
      <Route path="/teacher/classes/:classId" element={<TeacherClassDetailPage />} />
      <Route path="/teacher/exams" element={<TeacherExamsPage />} />
      <Route path="/teacher/question-bank" element={<TeacherQuestionBankPage />} />
      <Route path="/teacher/live-monitoring" element={<TeacherLiveMonitoringPage />} />
      <Route path="/teacher/live-monitoring/:studentId" element={<TeacherStudentMonitoringPage />} />
      <Route path="/grading" element={<SubmissionsGradingPage />} />
      <Route path="/grading/:attemptId" element={<Navigate to="/grading" replace />} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  )
}

export default App
