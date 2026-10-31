import { Navigate, Route, Routes } from 'react-router-dom'
import { SignInPage } from './pages/auth/SignInPage'
import { TeacherSignUpPage } from './pages/classification/teacher/TeacherSignUpPage'
import { StudentSignUpPage } from './pages/classification/student/StudentSignUpPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup/teacher" element={<TeacherSignUpPage />} />
      <Route path="/signup/student" element={<StudentSignUpPage />} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  )
}

export default App
