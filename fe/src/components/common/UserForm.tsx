import React, { useState } from 'react';
import { TextField, Button, Box, Select, MenuItem, FormControl, InputLabel,Typography  } from '@mui/material';
import type { UserDto, UserRole } from '../../types/user';

interface UserFormProps {
  initialData?: Partial<UserDto>;
  onSubmit: (data: Partial<UserDto>) => void;
  errors?: Record<string, string>;
}

const UserForm: React.FC<UserFormProps> = ({ initialData = {}, onSubmit, errors = {} }) => {
  const [name, setName] = useState(initialData.name || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [role, setRole] = useState<UserRole>(initialData.role || 'customer');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<UserDto> = { name, email, role };

    if (!initialData._id) {
      payload.password = password;        // Tạo mới thì phải có password
    }

    onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>

      <TextField 
        label="Họ & Tên"
        value={name}
        onChange={e => setName(e.target.value)}
        fullWidth
        required
        error={!!errors.name} 
        helperText={errors.name}
      />

      <TextField 
        label="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        fullWidth
        required
        error={!!errors.email}
        helperText={errors.email}
      />

      <FormControl fullWidth required error={!!errors.role}>
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

      {/* Chỉ hiển thị Password khi tạo mới */}
      {!initialData._id && (
        <TextField 
          label="Mật khẩu"
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          fullWidth
          required
          error={!!errors.password}
          helperText={errors.password}
        />
      )}

      {errors.general && (
        <Typography color="error">{errors.general}</Typography>
      )}

      <Button type="submit" variant="contained">Lưu</Button>
    </Box>
  );
};

export default UserForm;
