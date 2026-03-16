export function getNextUpSuggestion(anchors = []) {
  return anchors.find((anchor) => !anchor.completed) || null;
}
