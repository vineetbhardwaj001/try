import { Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import VerifyOTP from './pages/VerifyOTP'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/home'
import UploadAudio from './pages/UploadAudio'
import Playground from "./pages/Playground";
import Feedback from './pages/Feedback';
import UploadIdeal from "./pages/UploadIdeal";

function App() {
  return (
   
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/Home" element={<Home />} />  
              <Route path="/upload-audio" element={<UploadAudio />} />
              <Route path="/feedback" element={<Playground />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/upload-ideal" element={<UploadIdeal />} />
         </Routes>
    
  )
}

export default App
