import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaLock, FaUnlock, FaEdit, FaTrashAlt } from 'react-icons/fa';
import userApi from '../../../api/userApi';
import type { UserDto, UserRole } from '../../../types/user.d'; 
import UserForm from "../../../components/common/UserForm";

// --- THÊM IMPORT MUI ---
import { 
    Button, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, Typography, Box, Dialog, 
    DialogTitle, DialogContent, DialogActions, Chip, IconButton 
} from '@mui/material';
// Mới (Sử dụng LockOpen cho "Mở khóa"):
import { Lock as LockIcon, LockOpen as UnlockIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
// import UserForm from "../../../components/common/UserForm"; // Cần import UserForm cho thao tác Create/Edit
// -----------------------


const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State cho Modal/Dialog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserDto> | null>(null); // Dùng để lưu user đang được sửa/thêm

  // --- Logic Gọi API (Read & Refresh) ---
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // userApi.getAll() phải trả về { data: UserDto[] } theo cấu trúc API HttpClient bạn đã thiết lập trước đó
      // const res = await userApi.getAll(); 
      // if (Array.isArray(res.data)) {
      //   setUsers(res.data);
      // }


      const res = await userApi.getAll();

// 3 trường hợp phổ biến: axios chưa unwrap, đã unwrap 1 lần, hoặc custom
const payload = res?.data ?? res;                // nếu axios trả { data: {...} }
const items = payload?.data ?? payload?.items ?? payload;

if (Array.isArray(items)) {
  setUsers(items);
} else {
  setUsers([]); // hoặc throw error
  console.warn("Unexpected users payload:", res);
}


    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
      setError("Không thể tải danh sách người dùng. Vui lòng kiểm tra kết nối API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // --- Thao tác Form (Create/Edit) ---
  const handleSaveUser = async (data: Partial<UserDto>) => {
      try {
          if (editingUser?._id) {
              // Edit (UC: Update User)
              await userApi.update(editingUser._id, data);
          } else {
              // Create (UC01: Create New User)
              // Lưu ý: API create user thường cần password, bạn cần đảm bảo UserForm cung cấp đủ
              await userApi.create(data); 
          }
          setIsModalOpen(false);
          setEditingUser(null);
          loadUsers();
      } catch (e) {
          console.error("Lỗi khi lưu người dùng:", e);
          setError("Lỗi khi thao tác: " + e.message);
      }
  }

  const handleOpenCreateModal = () => {
    setEditingUser(null); // Tạo mới
    setIsModalOpen(true);
  }

  const handleOpenEditModal = (user: UserDto) => {
    setEditingUser(user); // Sửa
    setIsModalOpen(true);
  }

  // --- Thao tác Lock/Unlock (UC: Lock/Unlock Account) ---
  const handleLockUnlock = async (userId: string, isLocked: boolean) => {
      try {
          if (isLocked) {
              // Giả sử khóa 1 giờ nếu đang mở khóa
              await userApi.lock(userId, 1); 
              alert("User đã bị khóa.");
          } else {
              await userApi.unlock(userId);
              alert("User đã được mở khóa.");
          }
          loadUsers();
      } catch (err) {
          console.error("Lỗi khóa/mở khóa:", err);
          setError("Thao tác thất bại.");
      }
  }

  // --- Thao tác Xóa mềm (UC: Delete User - Soft Delete) ---
  const handleDelete = async (userId: string) => {
    if (window.confirm("Bạn chắc chắn muốn xóa mềm người dùng này?")) {
      try {
        await userApi.softDelete(userId); // Dùng softDelete API đã có
        loadUsers();
      } catch (error) {
        console.error("Lỗi xóa người dùng:", error);
        setError("Không thể xóa người dùng. Vui lòng thử lại.");
      }
    }
  };

  // --- Helper để định dạng UI (Dùng MUI Chip thay cho Span) ---
  const getRoleBadge = (role: UserRole) => {
    let color: "primary" | "secondary" | "error" | "warning" | "success" = 'success';
    if (role === 'admin') color = 'error';
    if (role === 'teacher') color = 'primary';
    
    return <Chip label={role.toUpperCase()} size="small" color={color} variant="filled" />;
  };

  const getUserStatus = (user: UserDto) => {
    if (user.deletedAt) {
      return <Chip label="Đã xóa mềm" color="error" size="small" />;
    }
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return <Chip label="Đã khóa" color="warning" size="small" />;
    }
    return <Chip label="Hoạt động" color="success" size="small" />;
  };


  // --- Render UI ---
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Đang tải danh sách người dùng...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Box sx={{ p: 3, color: 'error.main' }}><Typography>{error}</Typography></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>Quản lý Người dùng (UC01)</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<FaPlus />} 
          onClick={handleOpenCreateModal}
        >
          Thêm người dùng mới
        </Button>
      </Box>

      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table aria-label="user management table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Tên đầy đủ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vai trò</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getUserStatus(user)}</TableCell>
                  <TableCell align="right">
                    
                    {/* Thao tác Sửa */}
                    <IconButton title="Sửa thông tin" color="secondary" onClick={() => handleOpenEditModal(user)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    
                    {/* Thao tác Khóa/Mở Khóa */}
                    {!user.deletedAt && (
                        <IconButton 
                            title={user.lockedUntil ? "Mở khóa tài khoản" : "Khóa tài khoản"} 
                            color={user.lockedUntil ? "success" : "warning"}
                            onClick={() => handleLockUnlock(user._id, !!user.lockedUntil)}
                        >
                            {user.lockedUntil ? <UnlockIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                        </IconButton>
                    )}

                    {/* Thao tác Xóa mềm */}
                    <IconButton title="Xóa tài khoản" color="error" onClick={() => handleDelete(user._id)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {users.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">Không có người dùng nào được tìm thấy.</Typography>
            </Box>
        )}
      </Paper>
      
      {/* --- Modal/Dialog cho Create/Edit (UC01) --- */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? `Chỉnh sửa: ${editingUser.name}` : "Tạo Người dùng Mới"}</DialogTitle>
        <DialogContent dividers>
          
            ⚠️ Cần phải có UserForm.tsx để truyền vào đây.
            <UserForm 
                initialData={editingUser || {}} 
                onSubmit={handleSaveUser} 
            /> 
         
          <Typography color="text.secondary">
              (UserForm component needs to be implemented here to handle UC01: Create User)
          </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            {/* Nút Submit sẽ được đặt bên trong UserForm */}
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ManageUsersPage;