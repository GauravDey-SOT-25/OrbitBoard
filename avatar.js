// avatar.js

import { getMemberById, getInitials } from "./avatarUtils.js";

/**
 * Creates an avatar element for a member.
 * @param {number} memberId
 * @param {number} size
 * @returns {HTMLElement}
 */
export function createAvatar(memberId, size = 40) {
  const member = getMemberById(memberId);

  const avatar = document.createElement("div");
  avatar.className = "member-avatar";

  avatar.style.width = `${size}px`;
  avatar.style.height = `${size}px`;

  if (!member) {
    avatar.textContent = "?";
    avatar.style.backgroundColor = "#9CA3AF";
    return avatar;
  }

  // Show profile image if available
  if (member.avatar && member.avatar.trim() !== "") {
    const img = document.createElement("img");

    img.src = member.avatar;
    img.alt = member.name;
    img.className = "avatar-image";

    avatar.appendChild(img);
  }

  // Otherwise show initials
  else {
    avatar.textContent = getInitials(member.name);
    avatar.style.backgroundColor = member.color;
    avatar.style.color = "#ffffff";
  }

  avatar.title = member.name;

  return avatar;
}