# Hướng Dẫn Sử Dụng Components và Utilities

## Tổng quan
File này hướng dẫn cách sử dụng các component UI và utilities trong dự án SGMS Frontend, dựa trên các ví dụ thực tế từ `Example.tsx`.

## 1. Cấu trúc Import

```typescript
// UI Components từ shadcn/ui
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar } from '../ui/calendar';

// Utilities
import { cn } from '../../utils/utils';

// React hooks
import { useState } from 'react';

// Custom hooks
import { useLanguage } from '../../hooks/useLanguage';
```

## 2. Tailwind CSS Classes

### Responsive Design
```typescript
// Sử dụng breakpoints: sm, md, lg, xl
className="p-2 sm:p-4 md:p-6"           // Padding responsive
className="text-xl sm:text-2xl"         // Text size responsive
className="grid grid-cols-1 md:grid-cols-3"  // Grid responsive
```

### Dark Mode Support
```typescript
// Luôn cung cấp cả light và dark mode
className="bg-white dark:bg-gray-900"
className="text-gray-800 dark:text-gray-100"
className="border-gray-200 dark:border-gray-700"
```

### Layout Classes
```typescript
// Container và spacing
className="max-w-full md:max-w-3xl mx-auto"  // Max width với center
className="mb-4 sm:mb-6"                     // Margin bottom responsive

// Flexbox
className="flex justify-between items-center"
className="flex flex-col sm:flex-row"        // Stack trên mobile, row trên desktop
className="flex space-x-2"                   // Horizontal spacing

// Grid
className="grid grid-cols-1 md:grid-cols-3 gap-4"
```

## 3. Shadcn/UI Components

### Button Component
```typescript
// Các variant cơ bản
<Button variant="default">Default Button</Button>
<Button variant="outline">Outline Button</Button>

// Sử dụng với custom classes
<Button className={cn('bg-yellow-500 hover:bg-yellow-600')}>
  Custom Button
</Button>
```

### Alert Component
```typescript
// Alert cơ bản
<Alert>
  <AlertDescription>Nội dung thông báo</AlertDescription>
</Alert>

// Alert với custom styling
<Alert className={cn('bg-yellow-100 border-yellow-300')}>
  <AlertDescription>Custom alert</AlertDescription>
</Alert>
```

### Calendar Component
```typescript
// Calendar đơn giản (chọn 1 ngày)
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-md border shadow-sm"
/>

// Calendar range (chọn khoảng thời gian)
<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
  className="rounded-md border shadow-sm"
/>

// Calendar với dropdown và localization
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  captionLayout="dropdown"
  formatters={{
    formatMonthDropdown: (date) => date.toLocaleString(language, { month: 'long' }),
    formatYearDropdown: (date) => date.toLocaleString(language, { year: 'numeric' })
  }}
/>
```

## 4. Hàm cn() Utility

### Mục đích
- Kết hợp nhiều className thành một chuỗi duy nhất
- Loại bỏ các class trùng lặp, ưu tiên class cuối cùng
- Hỗ trợ conditional classes

### Cách sử dụng

#### Kết hợp classes cơ bản:
```typescript
<Button className={cn('bg-blue-500', 'px-4 py-2', 'rounded-md')}>
  Button
</Button>
```

#### Conditional classes:
```typescript
const isActive = true;
<Button className={cn(
  'px-4 py-2 rounded-md transition-colors',
  isActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
)}>
  {isActive ? 'Active' : 'Inactive'}
</Button>
```

#### Override classes:
```typescript
// bg-blue-500 sẽ bị ghi đè bởi bg-green-500
<Button className={cn('bg-blue-500', isActive && 'bg-green-500', 'px-4')}>
  Button
</Button>
```

## 5. State Management với useState

```typescript
// Date state cho calendar
const [date, setDate] = useState<Date | undefined>(new Date());

// Range state cho calendar
const [range, setRange] = useState<{ from: Date | undefined; to?: Date | undefined }>();
```

## 6. Custom Hooks

### useLanguage Hook
```typescript
const { language = 'vi' } = useLanguage();

// Sử dụng trong formatters
formatters={{
  formatMonthDropdown: (date) => date.toLocaleString(language, { month: 'long' }),
  formatYearDropdown: (date) => date.toLocaleString(language, { year: 'numeric' })
}}
```

## 7. Best Practices

### 1. Responsive Design
- Luôn sử dụng mobile-first approach
- Sử dụng breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Test trên nhiều kích thước màn hình

### 2. Dark Mode
- Luôn cung cấp cả light và dark mode classes
- Sử dụng `dark:` prefix cho dark mode styles

### 3. Component Structure
```typescript
// Cấu trúc component tốt
<div className="container-classes">
  <h2 className="title-classes">Title</h2>
  <div className="content-wrapper-classes">
    {/* Content */}
  </div>
</div>
```

### 4. Class Naming Convention
```typescript
// Thứ tự classes: layout -> spacing -> colors -> effects
className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
```

## 8. Ví dụ Layout Patterns

### Card Layout:
```typescript
<div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
  <h2 className="text-2xl font-bold mb-2">Card Title</h2>
  <p className="text-gray-600 dark:text-gray-300 mb-4">Content</p>
  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
    Action
  </button>
</div>
```

### Grid Layout:
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg text-center">
    <span className="text-red-800 dark:text-red-200 font-semibold">Item 1</span>
  </div>
  {/* More items */}
</div>
```

### Flex Layout:
```typescript
<div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
  <span className="text-sm text-gray-600 dark:text-gray-300">Left content</span>
  <div className="flex space-x-2">
    <button>Cancel</button>
    <button>Save</button>
  </div>
</div>
```

## 9. Color Palette

### Primary Colors:
- Blue: `bg-blue-500`, `text-blue-500`, `border-blue-500`
- Green: `bg-green-500`, `text-green-500`, `border-green-500`
- Red: `bg-red-500`, `text-red-500`, `border-red-500`
- Yellow: `bg-yellow-500`, `text-yellow-500`, `border-yellow-500`

### Gray Scale:
- Light: `bg-gray-100`, `text-gray-600`, `border-gray-200`
- Medium: `bg-gray-500`, `text-gray-700`, `border-gray-500`
- Dark: `bg-gray-800`, `text-gray-100`, `border-gray-700`

## 10. Animation và Transitions

```typescript
// Hover effects
className="hover:bg-blue-600 transition-colors"

// Transform effects
className="transform hover:scale-105 transition-transform"

// Multiple transitions
className="transition-all duration-200 ease-in-out"
```

## 11. Accessibility

- Luôn sử dụng semantic HTML elements
- Thêm `aria-label` cho interactive elements
- Đảm bảo contrast ratio phù hợp
- Hỗ trợ keyboard navigation

## 12. Performance Tips

- Sử dụng `cn()` để tối ưu hóa class merging
- Tránh inline styles, ưu tiên Tailwind classes
- Sử dụng `useState` với default values phù hợp
- Lazy load components khi cần thiết

---

**Lưu ý**: File này dựa trên `Example.tsx` và sẽ được cập nhật khi có thêm patterns mới trong dự án. 