// Example component using Tailwind CSS
const Example = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
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
    </div>
  );
};

export default Example;
