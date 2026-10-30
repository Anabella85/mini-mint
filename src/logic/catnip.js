/**
 * Catnip components are web components. Their events are DOM CustomEvents and the payload is on
 * `event.detail`, usually wrapped in a one-element array.
 *
 *   <catnip-input .modelValue="name" @update:modelValue="name = eventValue($event)" />
 *
 * Docs: https://catnip.signicat.com/components/component-api.html
 */
export function eventValue(event) {
  const detail = event?.detail;
  return Array.isArray(detail) ? detail[0] : detail;
}
