// memberBadge.js

import { createAvatar } from "./avatar.js";
import { getMemberById } from "./avatarUtils.js";

/**
 * Creates a member badge.
 * Shows avatar + member name.
 * @param {number} memberId
 * @returns {HTMLElement}
 */
export function createMemberBadge(memberId) {
  const member = getMemberById(memberId);

  const badge = document.createElement("div");
  badge.className = "member-badge";

  if (!member) {
    badge.textContent = "Unassigned";
    return badge;
  }

  // Avatar
  const avatar = createAvatar(memberId, 32);

  // Member Name
  const name = document.createElement("span");
  name.className = "member-name";
  name.textContent = member.name;

  badge.appendChild(avatar);
  badge.appendChild(name);

  return badge;
}