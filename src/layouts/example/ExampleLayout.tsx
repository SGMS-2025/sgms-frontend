import { Outlet } from 'react-router-dom';

// Renamed to be consistent with component name
function ExampleLayout() {
  return (
    <div className="example-layout">
      {/* Add header here */}
      <header className="bg-blue-600 p-4 text-white">
        <h1 className="text-xl font-bold">Example Section</h1>
      </header>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Add footer here if needed */}
      <footer className="bg-gray-200 p-4 mt-auto">
        <p className="text-center text-gray-600">© 2025 Example Layout</p>
      </footer>
    </div>
  );
}

export default ExampleLayout;
