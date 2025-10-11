import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

interface RenameStateDialogProps {
  open: boolean;
  currentLabel: string;
  onClose: () => void;
  onRename: (newLabel: string) => void;
}

/**
 * RenameStateDialog - Dialog for renaming timeline states
 */
const RenameStateDialog: React.FC<RenameStateDialogProps> = ({
  open,
  currentLabel,
  onClose,
  onRename,
}) => {
  const [label, setLabel] = useState(currentLabel);

  // Update label when currentLabel changes
  useEffect(() => {
    setLabel(currentLabel);
  }, [currentLabel]);

  const handleRename = () => {
    if (label.trim()) {
      onRename(label.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rename State</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="State Label"
          type="text"
          fullWidth
          variant="outlined"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter state label"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleRename}
          variant="contained"
          disabled={!label.trim()}
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameStateDialog;
