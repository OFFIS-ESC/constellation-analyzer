import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useTimelineStore } from '../../stores/timelineStore';

interface CreateStateDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog for creating a new constellation state
 */
const CreateStateDialog: React.FC<CreateStateDialogProps> = ({ open, onClose }) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [cloneFromCurrent, setCloneFromCurrent] = useState(true);

  const { createState } = useTimelineStore();

  const handleCreate = () => {
    if (!label.trim()) return;

    createState(label.trim(), description.trim() || undefined, cloneFromCurrent);

    // Reset form
    setLabel('');
    setDescription('');
    setCloneFromCurrent(true);
    onClose();
  };

  const handleClose = () => {
    // Reset form on cancel
    setLabel('');
    setDescription('');
    setCloneFromCurrent(true);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New State</DialogTitle>
      <DialogContent>
        <div className="space-y-4 mt-2">
          <TextField
            autoFocus
            fullWidth
            label="State Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., 'January 2024' or 'Strategy A'"
            helperText="Give this state a descriptive name"
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes about this state..."
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={cloneFromCurrent}
                onChange={(e) => setCloneFromCurrent(e.target.checked)}
              />
            }
            label="Clone current graph (uncheck for empty state)"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!label.trim()}
        >
          Create State
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateStateDialog;
