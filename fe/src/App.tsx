// src/App.tsx

// 1. Import component quản lý routes của bạn
import AppRoutes from './routes'; 

function App() {
  // 2. Chỉ cần return duy nhất component AppRoutes
  return (
    <div>
      <AppRoutes />
    </div>
  )
}

export default App