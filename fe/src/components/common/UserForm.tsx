import React, { useState } from 'react';
import { TextField, Button, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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
      <FormControl fullWidth required>
        <InputLabel>Vai trò</InputLabel>
        <Select
          value={role}
          label="Vai trò"
          onChange={e => setRole(e.target.value as UserRole)}
        >
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="customer">Customer</MenuItem>
          <MenuItem value="teacher">Teacher</MenuItem>
        </Select>
      </FormControl>
      {!initialData._id && <TextField label="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} type="password" fullWidth required />}
      <Button type="submit" variant="contained">Lưu</Button>
    </Box>
  );
};

export default UserForm;