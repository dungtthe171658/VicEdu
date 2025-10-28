import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import type { UserDto, UserRole } from '../../types/user';

interface UserFormProps {
  initialData?: Partial<UserDto>;
  onSubmit: (data: Partial<UserDto>) => void;
}

const UserForm: React.FC<UserFormProps> = ({ initialData = {}, onSubmit }) => {
  const [name, setName] = useState(initialData.name || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [role, setRole] = useState<UserRole>(initialData.role || 'customer');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, role, password });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
      <TextField label="Họ & Tên" value={name} onChange={e => setName(e.target.value)} fullWidth required />
      <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} fullWidth required />
      <TextField label="Vai trò" value={role} onChange={e => setRole(e.target.value as UserRole)} fullWidth required />
      {!initialData._id && <TextField label="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} type="password" fullWidth required />}
      <Button type="submit" variant="contained">Lưu</Button>
    </Box>
  );
};

export default UserForm;