import { useDriver } from '@/hooks/useDriver';
import { Button } from '@/components/ui/button';

/**
 * Example component demonstrating how to use driver.js
 *
 * This component shows:
 * 1. How to highlight a single element
 * 2. How to create and start a multi-step tour
 */
export function DriverExample() {
  const { highlight, startTour } = useDriver({
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    allowClose: true
  });

  // Example: Highlight a single element
  const handleHighlight = () => {
    highlight({
      element: '#example-element',
      popover: {
        title: 'Example Element',
        description: 'This is an example element that you can highlight with driver.js'
      }
    });
  };

  // Example: Start a multi-step tour
  const handleStartTour = () => {
    startTour([
      {
        element: '#step-1',
        popover: {
          title: 'Step 1',
          description: 'This is the first step of the tour'
        }
      },
      {
        element: '#step-2',
        popover: {
          title: 'Step 2',
          description: 'This is the second step of the tour'
        }
      },
      {
        element: '#step-3',
        popover: {
          title: 'Step 3',
          description: 'This is the third step of the tour'
        }
      }
    ]);
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Driver.js Examples</h1>

      <div className="space-x-4">
        <Button onClick={handleHighlight}>Highlight Element</Button>
        <Button onClick={handleStartTour}>Start Tour</Button>
      </div>

      {/* Example elements for highlighting */}
      <div id="example-element" className="p-4 border rounded">
        Example Element - Click "Highlight Element" to see it highlighted
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div id="step-1" className="p-4 border rounded">
          Step 1
        </div>
        <div id="step-2" className="p-4 border rounded">
          Step 2
        </div>
        <div id="step-3" className="p-4 border rounded">
          Step 3
        </div>
      </div>
    </div>
  );
}
