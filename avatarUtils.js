// avatarUtils.js

import members from "./member.js";

/**
 * Returns initials from a full name.
 * Example: "Eklavya Gond" => "EG"
 */
export function getInitials(name) {
  if (!name) return "";

  return name
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Returns member object using member ID.
 */
export function getMemberById(id) {
  return members.find(member => member.id === id) || null;
}

/**
 * Returns avatar background color of a member.
 */
export function getMemberColor(id) {
  const member = getMemberById(id);
  return member ? member.color : "#9CA3AF";
}

/**
 * Returns avatar image URL.
 * Empty string means initials should be displayed.
 */
export function getMemberAvatar(id) {
  const member = getMemberById(id);
  return member ? member.avatar : "";
}

/**
 * Returns member full name.
 */
export function getMemberName(id) {
  const member = getMemberById(id);
  return member ? member.name : "Unknown Member";
}