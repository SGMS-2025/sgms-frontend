import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../utils/utils';

const Example = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-500 mb-6 mt5 tracking-tight">Example normal Tailwindcss</h2>
      {/* Card with border and shadow */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Card Title</h2>
        <p className="text-gray-600 mb-4">This is the card content with gray text</p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
          Button
        </button>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <span className="text-red-800 font-semibold">Item 1</span>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <span className="text-green-800 font-semibold">Item 2</span>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <span className="text-blue-800 font-semibold">Item 3</span>
        </div>
      </div>

      {/* Flexbox */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <span className="text-sm text-gray-600">Left content</span>
        <div className="flex space-x-2">
          <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm">Cancel</button>
          <button className="bg-green-500 text-white px-3 py-1 rounded text-sm">Save</button>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-blue-500 mb-6 mt-10 tracking-tight">Example shadcn/ui UI Components</h2>
      {/* Section using shadcn/ui components */}
      <div className="mt-8 p-6 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Example using UI components</h3>
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="default">Shadcn Button</Button>
          <Button variant="outline">Outline Button</Button>
        </div>
        <Alert>
          <AlertDescription>This is an Alert from shadcn/ui!</AlertDescription>
        </Alert>
      </div>

      {/* Section: combine Button, Alert and cn function */}
      <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold mb-4 text-yellow-800">Example using cn function</h3>
        <div className="flex items-center space-x-4 mb-4">
          <Button className={cn('bg-yellow-500 hover:bg-yellow-600 text-white', 'px-4 py-2 rounded-md')}>
            Yellow Button (using cn)
          </Button>
          <Button variant="outline" className={cn('border-yellow-500 text-yellow-700 hover:bg-yellow-100')}>
            Yellow Outline (using cn)
          </Button>
        </div>
        <Alert className={cn('bg-yellow-100 text-yellow-800 border-yellow-300')}>
          <AlertDescription>This is a custom yellow Alert (using cn)!</AlertDescription>
        </Alert>
      </div>

      {/*
        NOTE:
        The cn function (imported from ../../lib/utils) helps merge multiple dynamic classNames for React components, especially when using Tailwind CSS.
        - Combines multiple classNames into a single string.
        - Removes duplicate classes, prioritizing the last one (according to tailwind-merge).
        - Supports conditional classes (e.g., isActive && 'bg-green-500').
        Helps keep code clean, readable, and avoids errors when combining many Tailwind classes.
        Example:
          <Button className={cn('bg-blue-500', isActive && 'bg-green-500', 'px-4')}>Click</Button>
        If isActive is true, the result will be: bg-green-500 px-4 (bg-blue-500 is overridden).
      */}
      {/* Example using isActive with cn */}
      {(() => {
        const isActive = true; // try changing to true/false to see the effect
        return (
          <div className="mt-8 p-4 rounded-lg border border-blue-200">
            <h4 className="text-base font-semibold mb-2 text-blue-800">Example Button color changes by isActive</h4>
            <Button
              className={cn(
                'px-4 py-2 rounded-md transition-colors',
                isActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
              )}
            >
              {isActive ? 'Active (isActive=true)' : 'Inactive (isActive=false)'}
            </Button>
          </div>
        );
      })()}
    </div>
  );
};

export default Example;
