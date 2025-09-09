# Shared Components và Hooks cho Authentication Forms

## Tổng quan

Đã tối ưu hóa code bằng cách tách các phần chung giữa Register, ForgotPassword và ResetPassword thành các component và hook có thể tái sử dụng.

## Các file đã tạo

### 1. Utils - Validation (`src/utils/validation.ts`)
Chứa tất cả logic validation chung:
- `validateEmail()` - Kiểm tra email hợp lệ
- `validatePhoneNumber()` - Kiểm tra số điện thoại Việt Nam
- `validateFullName()` - Kiểm tra tên đầy đủ (hỗ trợ tiếng Việt)
- `validatePasswordStrength()` - Kiểm tra độ mạnh mật khẩu
- `validateOTP()` - Kiểm tra mã OTP 6 chữ số
- `validateConfirmPassword()` - Kiểm tra xác nhận mật khẩu
- `validateUsername()` - Kiểm tra tên người dùng
- `validateRegistrationForm()` - Validation toàn bộ form đăng ký
- `validatePasswordResetForm()` - Validation form đặt lại mật khẩu

### 2. Custom Hooks

#### `useOTPInput` (`src/hooks/useOTPInput.ts`)
Quản lý logic OTP input:
```typescript
const {
  otpDigits,
  inputRefs,
  handleDigitChange,
  handleKeyDown,
  handlePaste,
  clearOTP,
  focusFirstInput,
  otpCode,
  isComplete
} = useOTPInput({
  length: 6,
  onComplete: (otp) => console.log('OTP complete:', otp),
  onPaste: (otp) => console.log('Pasted OTP:', otp)
});
```

#### `usePasswordInput` (`src/hooks/usePasswordInput.ts`)
Quản lý logic password input:
```typescript
const {
  showPassword,
  showConfirmPassword,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
  password,
  confirmPassword,
  setPassword,
  setConfirmPassword,
  passwordValidation,
  confirmPasswordValidation,
  isFormValid,
  getFormErrors
} = usePasswordInput({
  showConfirmPassword: true,
  onPasswordChange: (password) => console.log('Password changed:', password)
});
```

### 3. Shared Components

#### `OTPInput` (`src/components/ui/OTPInput.tsx`)
Component OTP input có thể tái sử dụng:
```tsx
<OTPInput
  length={6}
  onComplete={(otp) => setOtpCode(otp)}
  onPaste={(otp) => console.log('Pasted:', otp)}
  showInfo={true}
  infoText="Nhập mã OTP 6 chữ số"
  showProgress={true}
  disabled={false}
/>
```

#### `PasswordInput` (`src/components/ui/PasswordInput.tsx`)
Component password input có thể tái sử dụng:
```tsx
<PasswordInput
  value={password}
  onChange={setPassword}
  label="Mật khẩu"
  placeholder="Nhập mật khẩu"
  showConfirmPassword={true}
  confirmPasswordValue={confirmPassword}
  onConfirmPasswordChange={setConfirmPassword}
  confirmPasswordLabel="Xác nhận mật khẩu"
  confirmPasswordPlaceholder="Nhập lại mật khẩu"
  showRequirements={true}
  disabled={false}
  required={true}
/>
```

## Cách sử dụng

### 1. Trong RegisterForm
```tsx
// Sử dụng validation chung
const validateForm = () => {
  const validation = validateRegistrationForm({
    ...formData,
    agreeTerms
  });

  if (!validation.isValid) {
    validation.errors.forEach(error => {
      toast.error(t(`error.${error}`));
    });
    return false;
  }
  return true;
};

// Sử dụng PasswordInput component
<PasswordInput
  value={formData.password}
  onChange={(value) => handleInputChange('password', value)}
  label={t('auth.password')}
  showConfirmPassword={true}
  confirmPasswordValue={formData.confirmPassword}
  onConfirmPasswordChange={(value) => handleInputChange('confirmPassword', value)}
  showRequirements={true}
/>
```

### 2. Trong VerifyOTPForm
```tsx
// Sử dụng OTPInput component
<OTPInput
  onComplete={handleOTPComplete}
  showInfo={true}
  showProgress={true}
/>
```

### 3. Ví dụ cho form mới trong tương lai (ChangePassword)
```tsx
// Khi cần tạo form đổi mật khẩu, chỉ cần sử dụng:
<PasswordInput
  value={formData.newPassword}
  onChange={(value) => handleInputChange('newPassword', value)}
  label={t('auth.new_password')}
  showConfirmPassword={true}
  confirmPasswordValue={formData.confirmPassword}
  onConfirmPasswordChange={(value) => handleInputChange('confirmPassword', value)}
  showRequirements={true}
/>
```

## Lợi ích

1. **Tái sử dụng code**: Các component và hook có thể dùng cho nhiều form khác nhau
2. **Dễ bảo trì**: Thay đổi logic ở một nơi, áp dụng cho tất cả
3. **Consistency**: Giao diện và behavior nhất quán
4. **Type Safety**: TypeScript đảm bảo type safety
5. **Validation tập trung**: Tất cả validation logic ở một nơi
6. **Dễ test**: Có thể test riêng từng component/hook

## Các form đã được refactor

- ✅ `RegisterForm` - Sử dụng `PasswordInput` và validation chung
- ✅ `VerifyOTPForm` - Sử dụng `OTPInput` component
- ✅ `VerifyForgotPasswordOTPForm` - Sử dụng `OTPInput` component
- ✅ `ResetPasswordForm` - Sử dụng `PasswordInput` và validation chung

## Sẵn sàng cho tương lai

Khi cần tạo form mới (ví dụ: ChangePassword), bạn có thể dễ dàng:

1. **Sử dụng các component có sẵn**:
   - `PasswordInput` cho password fields
   - `OTPInput` cho OTP verification
   - Validation functions từ `utils/validation.ts`

2. **Thêm API methods** khi cần:
   ```typescript
   // Thêm vào authApi.ts
   changePassword: async (data: ChangePasswordRequest) => {
     const response = await api.post('/users/change-password', data);
     return response.data;
   }
   ```

3. **Thêm translation keys** khi cần:
   ```json
   {
     "auth.change_password_title": "CHANGE PASSWORD",
     "auth.change_password_prompt": "Enter your current password...",
     // ...
   }
   ```
