/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePendingCustomers } from '@/hooks/usePendingCustomers';
import { useClassEnrollment } from '@/hooks/useClassEnrollment';
import { toast } from 'sonner';

// Helper function to convert MongoDB Decimal to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value?.$numberDecimal) return parseFloat(value.$numberDecimal);
  return 0;
};

interface EnrollStudentsModalProps {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * ============================================
 * EnrollStudentsModal Component
 * ============================================
 *
 * Modal for bulk enrolling students in a class.
 * Features:
 * - Fetches pending customers (eligible for enrollment)
 * - Displays with session info (10/20 used)
 * - Checkbox selection (multi-select)
 * - Select All / Deselect All buttons
 * - Search customers by name
 * - Pagination support
 * - Enroll button with bulk operation
 * - Success/error handling
 * - Auto-refetch class on success
 */

export const EnrollStudentsModal: React.FC<EnrollStudentsModalProps> = ({ classId, isOpen, onClose, onSuccess }) => {
  const [search, setSearch] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'sessions'>('name');

  // Fetch pending customers
  const {
    customers: pendingCustomers,
    classInfo,
    pagination,
    loading,
    error,
    refetch,
    nextPage,
    prevPage
  } = usePendingCustomers(classId, { limit: 10 });

  // Enrollment operation
  const { enrollStudents, loading: enrollLoading } = useClassEnrollment({
    onSuccess: () => {
      toast.success(`${selectedCustomers.length} student(s) enrolled successfully`);
      setSelectedCustomers([]);
      onClose();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to enroll students');
    }
  });

  // Auto-refetch when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
      setSelectedCustomers([]);
      setSearch('');
    }
  }, [isOpen, classId, refetch]);

  // Filter customers by search
  const filteredCustomers = pendingCustomers.filter((customer) => {
    const searchLower = search.toLowerCase();
    return customer.customer.userId.fullName.toLowerCase().includes(searchLower);
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'name') {
      return a.customer.userId.fullName.localeCompare(b.customer.userId.fullName);
    } else {
      return a.sessionsRemaining - b.sessionsRemaining;
    }
  });

  // Select/Deselect all
  const handleSelectAll = () => {
    if (selectedCustomers.length === sortedCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(sortedCustomers.map((c) => c.customer._id));
    }
  };

  // Toggle single customer
  const handleToggleCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  };

  // Enroll students
  const handleEnroll = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    await enrollStudents(classId, selectedCustomers);
  };

  const isAllSelected = sortedCustomers.length > 0 && selectedCustomers.length === sortedCustomers.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Enroll Students in Class
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Info */}
          {classInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Class Capacity:</span> {toNumber(classInfo.currentEnrollment)}/
                {toNumber(classInfo.capacity)}
                {classInfo.isFull && <Badge className="ml-2 bg-red-500">Full</Badge>}
                {!classInfo.isFull && (
                  <Badge className="ml-2 bg-green-500">{classInfo.availableSlots} slots available</Badge>
                )}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            {/* Search */}
            <Input
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] h-9"
            />

            {/* Sort */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as 'name' | 'sessions')}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="sessions">Sort by Sessions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
              <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && sortedCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No eligible students found</p>
              {search && (
                <Button variant="outline" size="sm" onClick={() => setSearch('')} className="mt-3">
                  Clear Search
                </Button>
              )}
            </div>
          )}

          {/* Student List */}
          {!loading && !error && sortedCustomers.length > 0 && (
            <>
              {/* Select All Button */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} id="select-all" />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer flex-1">
                  {isAllSelected ? 'Deselect All' : `Select All (${sortedCustomers.length})`}
                </label>
                <span className="text-xs text-gray-500">{selectedCustomers.length} selected</span>
              </div>

              {/* Student Items */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sortedCustomers.map((customer) => {
                  const customerId = customer.customer._id;
                  return (
                    <div
                      key={customerId}
                      className="flex items-center gap-2 p-2 bg-white border rounded hover:bg-gray-50 transition"
                    >
                      <Checkbox
                        checked={selectedCustomers.includes(customerId)}
                        onCheckedChange={() => handleToggleCustomer(customerId)}
                        id={`customer-${customerId}`}
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`customer-${customerId}`}
                          className="block text-sm font-medium truncate cursor-pointer"
                        >
                          {customer.customer.userId.fullName}
                        </label>
                        <p className="text-xs text-gray-500 truncate">{customer.customer.userId.email}</p>
                        <p className="text-xs text-blue-600 mt-0.5 truncate">
                          Package: {typeof customer.package === 'object' ? customer.package.name : 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex justify-between items-center text-sm border-t pt-3">
                  <p className="text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={prevPage} disabled={!pagination.hasPrevPage}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextPage} disabled={!pagination.hasNextPage}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={enrollLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={selectedCustomers.length === 0 || enrollLoading || classInfo?.isFull}
            className="min-w-[120px]"
          >
            {enrollLoading ? 'Enrolling...' : `Enroll ${selectedCustomers.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
