import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CancellationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

const CANCELLATION_REASONS = [
  'Emergency situation',
  'Change of plans',
  'Transportation issue',
  'Weather conditions',
  'Health concerns',
  'Schedule conflict',
  'Other (please specify)'
];

export const CancellationForm: React.FC<CancellationFormProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    setShowCustomInput(reason === 'Other (please specify)');
    if (reason !== 'Other (please specify)') {
      setCustomReason('');
    }
  };

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Other (please specify)' ? customReason : selectedReason;
    if (finalReason.trim()) {
      onConfirm(finalReason.trim());
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setShowCustomInput(false);
    onClose();
  };

  const isValid = selectedReason && (selectedReason !== 'Other (please specify)' || customReason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Please select a reason for cancellation:</Label>
            <div className="mt-2 space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReasonSelect(reason)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedReason === reason
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {showCustomInput && (
            <div>
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                Please specify the reason:
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Enter your reason for cancellation..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Keep
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            variant="destructive"
          >
            {isLoading ? 'Cancelling...' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};