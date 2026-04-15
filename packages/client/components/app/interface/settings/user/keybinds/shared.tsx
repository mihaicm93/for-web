import { For, Show } from "solid-js";
import { css } from "styled-system/css";

export function formatKey(key: string | RegExp) {
  if (key instanceof RegExp) return "Any";

  const map: Record<string, string> = {
    Control: "Ctrl",
    Alt: "Alt",
    Meta: "Meta",
    Shift: "Shift",
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    " ": "Space",
  };

  if (map[key]) return map[key];
  return key.length === 1 ? key.toUpperCase() : key;
}

export function SequencePills(props: { seq?: (string | RegExp)[] }) {
  return (
    <Show
      when={props.seq && props.seq.length > 0}
      fallback={<div class={emptyStateClass}>-</div>}
    >
      <div class={pillContainerClass}>
        <For each={props.seq}>
          {(k) => <div class={keyPillClass}>{formatKey(k)}</div>}
        </For>
      </div>
    </Show>
  );
}

const pillContainerClass = css({
  display: "flex",
  alignItems: "center",
  gap: "4px",
});

const keyPillClass = css({
  padding: "4px 8px",
  borderRadius: "8px",
  border: "1px solid var(--md-sys-color-outline)",
  fontSize: "0.9em",
  color: "var(--md-sys-color-on-surface)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "32px",
});

const emptyStateClass = css({
  opacity: 0.6,
});
