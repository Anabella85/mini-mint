import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "br", "p", "ul", "ol", "li", "code"];

export function sanitizeNote(html) {
  return DOMPurify.sanitize(html ?? "", { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}