import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const NotesField: React.FC<NotesFieldProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        <FileText className="inline h-4 w-4" /> {t('shared_form.notes_label')}
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('shared_form.notes_placeholder')}
        rows={3}
      />
    </div>
  );
};
