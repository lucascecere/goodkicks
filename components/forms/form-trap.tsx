'use client';

/**
 * Bot trap for forms outside form-kit: off-screen (never display:none, which
 * smarter bots skip), skipped by keyboard and screen readers. Read its value
 * with trapValue(form) and post it as _hp.
 */
export const TRAP_NAME = 'homepage_url';

export function FormTrap() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Leave this empty
        <input type="text" name={TRAP_NAME} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export function trapValue(form: HTMLFormElement | null | undefined): string {
  const el = form?.querySelector(`input[name="${TRAP_NAME}"]`) as HTMLInputElement | null;
  return el?.value ?? '';
}
