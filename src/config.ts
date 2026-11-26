// Single source of truth for the student-enrollment Google Form.
// The enroll page (and only that page) reads from this file.

// Published form — "K2Labs Enrollment — Student Enrollment".
// Anyone with the link can respond. Embedding is enabled.
const FORM_ID = "1FAIpQLSdKvtbee7FHTjwQ0y01bulD7iYEXeRWYkltYFuBLzAJjz8y4g";

export const GOOGLE_FORM_URL =
  `https://docs.google.com/forms/d/e/${FORM_ID}/viewform`;

export const GOOGLE_FORM_EMBED_SRC =
  `https://docs.google.com/forms/d/e/${FORM_ID}/viewform?embedded=true`;

export const GOOGLE_FORM_READY = true;
