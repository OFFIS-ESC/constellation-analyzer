import type { TangibleMode, FilterConfig } from "../../types";

/**
 * Validation shared by the add and edit tangible forms.
 *
 * Both forms enforce the same rules, so they share one implementation rather
 * than drifting apart. Errors are keyed by field so each message can be
 * rendered next to the input it belongs to.
 *
 * The hardware ID is deliberately absent: uniqueness can only be checked
 * against the whole document, so the store decides that one and the forms
 * surface whatever it returns.
 */

export interface TangibleFormErrors {
  name?: string;
  hardwareId?: string;
  filters?: string;
  state?: string;
}

interface TangibleFormValues {
  name: string;
  mode: TangibleMode;
  filters: FilterConfig;
  stateId: string;
}

/** Returns the errors found, or null when the form is valid. */
export const validateTangibleForm = ({
  name,
  mode,
  filters,
  stateId,
}: TangibleFormValues): TangibleFormErrors | null => {
  const errors: TangibleFormErrors = {};

  if (!name.trim()) {
    errors.name = "Name is required";
  }

  if (mode === "filter") {
    const hasFilters =
      (filters.labels && filters.labels.length > 0) ||
      (filters.actorTypes && filters.actorTypes.length > 0) ||
      (filters.relationTypes && filters.relationTypes.length > 0);

    if (!hasFilters) {
      errors.filters =
        "Pick at least one label, actor type, or relation type for this token to filter by";
    }
  }

  if ((mode === "state" || mode === "stateDial") && !stateId) {
    errors.state = "Pick the state this token switches to";
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
