// src/api/authApi.ts


const MOCK_USERS = {
  'admin@gmail.com': {
    id: '1',
    fullName: 'Admin User',
    email: 'admin@gmail.com',
    role: 'admin',
    password: '123'
  },
  'teacher@gmail.com': {
    id: '2',
    fullName: 'Teacher User',
    email: 'teacher@gmail.com',
    role: 'teacher',
    password: '123'
  }
};

export const loginApi = async (email, password) => {
  console.log(`Attempting to login with ${email}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Giả lập độ trễ mạng
      const user = MOCK_USERS[email];
      if (user && user.password === password) {
        const { password, ...userData } = user; // Bỏ password ra khỏi data trả về
        const token = `mock-token-for-${user.id}`; // Tạo token giả
        console.log("Login successful");
        resolve({ user: userData, token });
      } else {
        console.error("Invalid email or password");
        reject(new Error("Invalid email or password"));
      }
    }, 1000);
  });
};

export const verifyTokenApi = async (token) => {
  console.log(`Verifying token ${token}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (token.startsWith('mock-token-for-')) {
        const userId = token.replace('mock-token-for-', '');
        const user = Object.values(MOCK_USERS).find(u => u.id === userId);
        if (user) {
          const { password, ...userData } = user;
          console.log("Token verification successful");
          resolve(userData);
        } else {
          reject(new Error("Invalid token"));
        }
      } else {
        reject(new Error("Invalid token"));
      }
    }, 500);
  });
};