/**
 * FieldError - Inline validation message shown beneath a form field
 *
 * Validation belongs next to the field that failed, not in a toast that
 * disappears while the user is still looking at the input. Renders nothing
 * when there is no message, so callers can pass state directly.
 */

interface Props {
  /** Message to show, or null/undefined when the field is valid */
  message?: string | null;
  /** Wire this to the field's aria-describedby so screen readers announce it */
  id?: string;
}

const FieldError = ({ message, id }: Props) => {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-xs text-red-600 mt-1">
      {message}
    </p>
  );
};

export default FieldError;
