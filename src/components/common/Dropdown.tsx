'use client';

import { Check, ChevronDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  /** Trigger id, so an external `<label htmlFor>` names the control. */
  id?: string;
  /** Accessible name when no external label points at `id`. */
  label?: string;
  /** Shown when no option matches `value` (an empty "none" entry). */
  placeholder?: string;
  disabled?: boolean;
  /** Root wrapper: width and layout. */
  className?: string;
  /** Replaces the default trigger chrome (the field canon). */
  triggerClassName?: string;
  /** Extra classes for the portalled menu. */
  menuClassName?: string;
}

/** Field canon (docs/DESIGN.md §3): the trigger matches its sibling inputs. */
const triggerCanon =
  'w-full rounded-lg border border-border-subtle bg-surface-base px-3 py-2.5 font-mono text-xs text-text-main focus:border-accent-violet/60 focus:outline-none';

/** Floating panel: the card surface plus the shadow that lifts it. */
const menuCanon =
  'overflow-y-auto overscroll-contain rounded-xl border border-border-subtle bg-surface-card py-1 shadow-xl';

const optionCanon =
  'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left';

const typeaheadResetMs = 500;
const viewportMargin = 8;
const triggerGap = 4;
const menuMaxWidth = 352;

interface Placement {
  top: number;
  left?: number;
  right?: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
}

/**
 * Design-system dropdown (docs/DESIGN.md §5.4). The trigger wears the site's
 * field canon and the menu is a real listbox — portalled to the body, because
 * the card that owns this form clips (`overflow-hidden`) and a scroll pane
 * would cut an in-place menu off.
 *
 * Keyboard and ARIA follow the APG select-only combobox: focus stays on the
 * trigger, the active row is announced through `aria-activedescendant`, and
 * Enter/Space, arrow keys, Home/End, Escape, Tab and letter typeahead all
 * behave as a visitor expects from a native select.
 */
export default function Dropdown({
  value,
  options,
  onChange,
  id,
  label,
  placeholder,
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef('');
  const typeaheadTimer = useRef<number | undefined>(undefined);
  const listId = `list${useId().replace(/:/g, '')}`;

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
  const enabled = options
    .map((option, index) => (option.disabled ? -1 : index))
    .filter((index) => index >= 0);

  // Anchored to the trigger and re-measured while the page scrolls, so the
  // menu stays with its control inside a scrolling pane.
  const position = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const maxWidth = Math.min(
      menuMaxWidth,
      window.innerWidth - 2 * viewportMargin
    );
    const minWidth = Math.min(rect.width, maxWidth);
    const below =
      window.innerHeight - rect.bottom - triggerGap - viewportMargin;
    const above = rect.top - triggerGap - viewportMargin;
    const flip = menuHeight > below && above > below;
    const alignRight =
      rect.left + minWidth > window.innerWidth - viewportMargin;

    setPlacement({
      top: flip
        ? Math.max(viewportMargin, rect.top - triggerGap - menuHeight)
        : rect.bottom + triggerGap,
      left: alignRight ? undefined : Math.max(viewportMargin, rect.left),
      right: alignRight
        ? Math.max(viewportMargin, window.innerWidth - rect.right)
        : undefined,
      minWidth,
      maxWidth,
      maxHeight: Math.max(96, flip ? above : below),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    position();
    // The first pass runs before the menu has a height, so settle once it does.
    const frame = window.requestAnimationFrame(position);
    return () => window.cancelAnimationFrame(frame);
  }, [open, position]);

  useEffect(() => {
    if (!open) return;

    const onScroll = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false);
        setPlacement(null);
        return;
      }
      position();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setPlacement(null);
    };

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    document.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, position]);

  function openAt(edge: 'selected' | 'first' | 'last') {
    const selectedUsable =
      selectedIndex >= 0 && options[selectedIndex]?.disabled !== true;
    const fallback = selectedUsable ? selectedIndex : (enabled[0] ?? 0);
    setActive(
      edge === 'first'
        ? (enabled[0] ?? fallback)
        : edge === 'last'
          ? (enabled[enabled.length - 1] ?? fallback)
          : fallback
    );
    typeahead.current = '';
    position();
    setOpen(true);
  }

  function close(refocus: boolean) {
    setOpen(false);
    setPlacement(null);
    if (refocus) triggerRef.current?.focus();
  }

  function move(step: number) {
    if (enabled.length === 0) return;
    const current = enabled.indexOf(active);
    const next = Math.min(
      enabled.length - 1,
      Math.max(0, (current === -1 ? 0 : current) + step)
    );
    setActive(enabled[next]);
  }

  function select(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    close(true);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (open) move(event.key === 'ArrowDown' ? 1 : -1);
        else openAt(event.key === 'ArrowUp' ? 'last' : 'first');
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) select(active);
        else openAt('selected');
        return;
      case 'Home':
        if (!open) return;
        event.preventDefault();
        setActive(enabled[0] ?? 0);
        return;
      case 'End':
        if (!open) return;
        event.preventDefault();
        setActive(enabled[enabled.length - 1] ?? 0);
        return;
      case 'Escape':
        if (!open) return;
        event.preventDefault();
        close(true);
        return;
      case 'Tab':
        if (open) close(false);
        return;
      default:
        break;
    }

    const typed =
      event.key.length === 1 &&
      event.key !== ' ' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey;
    if (!open || !typed) return;

    // Letter typeahead, reset after a short pause.
    typeahead.current += event.key.toLowerCase();
    window.clearTimeout(typeaheadTimer.current);
    typeaheadTimer.current = window.setTimeout(() => {
      typeahead.current = '';
    }, typeaheadResetMs);
    const match = options.findIndex(
      (option) =>
        !option.disabled &&
        option.label.toLowerCase().startsWith(typeahead.current)
    );
    if (match >= 0) setActive(match);
  }

  return (
    <div
      className={`relative inline-block w-full ${className ?? ''}`.trim()}
      ref={rootRef}
    >
      <button
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={`inline-flex w-full items-center justify-between gap-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${triggerClassName ?? triggerCanon}`}
        disabled={disabled}
        id={id}
        onClick={() => (open ? close(true) : openAt('selected'))}
        onKeyDown={onKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span className="truncate">{selected?.label ?? placeholder ?? ''}</span>
        <ChevronDown aria-hidden className="h-4 w-4 shrink-0 opacity-70" />
      </button>

      {open &&
        placement &&
        createPortal(
          <div
            aria-label={label}
            aria-labelledby={id && !label ? id : undefined}
            className={`${menuCanon} ${menuClassName ?? ''}`.trim()}
            id={listId}
            ref={menuRef}
            role="listbox"
            style={{
              left: placement.left,
              maxHeight: placement.maxHeight,
              maxWidth: placement.maxWidth,
              minWidth: placement.minWidth,
              position: 'fixed',
              right: placement.right,
              top: placement.top,
              zIndex: 60,
            }}
          >
            {options.map((option, index) => {
              const highlighted = index === active && !option.disabled;
              const isSelected = option.value === value;
              return (
                <div
                  aria-disabled={option.disabled || undefined}
                  aria-selected={isSelected}
                  className={`${optionCanon} ${
                    option.disabled
                      ? 'cursor-not-allowed text-text-dim'
                      : highlighted
                        ? 'bg-accent-violet/10 text-text-white'
                        : 'text-text-main'
                  } ${isSelected && !option.disabled ? 'font-semibold text-accent-violet-light' : ''}`}
                  id={`${listId}-${index}`}
                  key={option.value}
                  onMouseEnter={() => {
                    if (!option.disabled) setActive(index);
                  }}
                  // Selection happens on pointerdown so the trigger keeps focus
                  // and no blur/click race can reopen the menu.
                  onPointerDown={(event) => {
                    event.preventDefault();
                    select(index);
                  }}
                  role="option"
                  tabIndex={-1}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check aria-hidden className="h-3.5 w-3.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
