# SGMS Frontend

A modern React frontend application for the Smart Gym Management System (SGMS). This project is built with React, TypeScript, Vite, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js (latest LTS recommended)
- npm or yarn

### Setup
1. Clone the repository
```bash
git clone https://github.com/SGMS-2025/sgms-frontend.git
cd sgms-frontend
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit the `.env` file and set your environment variables:
```
VITE_API_URL=your_api_url_here
VITE_PORT=your_port_here
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:your_port_here](http://localhost:your_port_here) in your browser (default is 5173 if not specified)

## 🛠️ Tech Stack

- **React**: Modern React with hooks and functional components
- **TypeScript**: For type safety and better developer experience
- **Vite**: Next-generation frontend tooling
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: For application routing
- **Axios**: HTTP client for API requests
- **ESLint & Prettier**: For consistent code style

## 📁 Project Structure

```
sgms-frontend/
├── public/                      # Static files
├── src/
│   ├── assets/                  # Images, fonts, and other assets
│   ├── components/              # Reusable UI components
│   ├── configs/                 # App configurations
│   ├── constants/               # Constants and enums
│   ├── contexts/                # React contexts (auth, etc.)
│   ├── hooks/                   # Custom React hooks
│   ├── layouts/                 # Page layouts
│   ├── pages/                   # Application pages
│   ├── routes/                  # Route configurations
│   ├── services/                # API services and utilities
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   ├── App.tsx                  # Main App component
│   ├── App.css                  # App-specific styles
│   ├── index.css                # Global styles
│   ├── main.tsx                 # Application entry point
│   └── vite-env.d.ts           # Vite environment type declarations
├── .env.example                 # Example environment variables
├── eslint.config.js             # ESLint configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Project dependencies and scripts
├── vite.config.ts               # Vite configuration
└── ...other config files
```

## 📝 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix linting errors automatically
- `npm run prettier` - Check for formatting issues
- `npm run prettier:fix` - Fix formatting issues automatically

## 🔄 API Integration & Routing

### API Integration

The application uses Axios for API communication. The base API configuration is in `src/services/api/api.ts`.

Example usage:
```typescript
import { api } from '@/services/api';

// GET request
api.get('/users')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

// POST request
api.post('/users', { name: 'John Doe', email: 'john@example.com' })
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

### React Router Setup

The application uses React Router v7 for navigation. Routes are defined in `src/routes/AppRoutes.tsx`:

```typescript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ExamplePage from '@/pages/example/ExamplePage';
import ExampleLayout from '@/layouts/example/ExampleLayout';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Route */}
      <Route path="/" element={<Navigate to="/example" replace />} />

      {/* Example Routes */}
      <Route path="/example/*" element={<ExampleLayout />}>
        <Route path="" element={<ExamplePage />} />
        {/* Add more example routes here */}
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
```

The project uses a nested routing approach with layouts and features:

1. **Route Groups**: Routes are organized by feature/section
2. **Layout Components**: Using layout components (like `ExampleLayout`) as parent routes
3. **Redirection**: Default routes and catch-all routes use `<Navigate>`
4. **Nested Routes**: The `/*` syntax allows for nested routes within a section

The router is integrated in `App.tsx`:

```typescript
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
```

## 🧰 Custom Hooks

The project includes several useful custom hooks:

- `useLocalStorage` - Persist state in localStorage
- `useToggle` - Easily toggle boolean values
- `useDebounce` - Debounce values for search inputs, etc.

## 🗃️ State Management

The project uses React's built-in state management solutions for optimal performance and simplicity:

### Current Setup
- **React Context API**: For global state management (auth, theme, etc.)
- **useState & useReducer**: For local component state
- **Custom Hooks**: For reusable state logic
- **useReducer in Context**: Write reducers in the same context file (create separate 'reducers' folder for large projects)

### Context API Example
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### useReducer Example
```typescript
// For complex state logic
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

type TodoAction = 
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'completed' };

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return { ...state, todos: [...state.todos, action.payload] };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload 
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    default:
      return state;
  }
}
```

### Usage in Components
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useReducer } from 'react';

function TodoApp() {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    filter: 'all'
  });

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      {/* Todo implementation */}
    </div>
  );
}
```

## 📐 Styling

The project uses Tailwind CSS for styling with a consistent design system. Component styles are applied using Tailwind's utility classes directly in the JSX, as demonstrated in the Example component:

```tsx
// From src/components/Example/Example.tsx
<div className="p-6 bg-white rounded-lg shadow-lg">
  {/* Card with border and shadow */}
  <div className="border border-gray-200 rounded-lg p-4 mb-4">
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Card Title</h2>
    <p className="text-gray-600 mb-4">This is the card content with gray text</p>
    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
      Button
    </button>
  </div>
  {/* Additional styling examples... */}
</div>
```

## 🔧 Development Guidelines

- Follow the ESLint and Prettier configurations
- Create reusable components in the `components` directory
- Use custom hooks for shared logic
- Keep components small and focused on a single responsibility
- Use TypeScript types for props and state

## 🏗️ Building for Production

```bash
npm run build
# or
yarn build
```

The build output will be in the `dist` directory.

## 📚 Learn More

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/docs)