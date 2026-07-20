// membersList.js

import members from "./member.js";
import { createAvatar } from "./avatar.js";

/**
 * Creates the complete members list.
 * @returns {HTMLElement}
 */
export function createMembersList() {
  const container = document.createElement("div");
  container.className = "members-list";

  members.forEach(member => {
    const item = document.createElement("div");
    item.className = "member-item";

    // Avatar
    const avatar = createAvatar(member.id, 36);

    // Member Info
    const info = document.createElement("div");
    info.className = "member-info";

    const name = document.createElement("h4");
    name.className = "member-full-name";
    name.textContent = member.name;

    const email = document.createElement("p");
    email.className = "member-email";
    email.textContent = member.email;

    info.appendChild(name);
    info.appendChild(email);

    item.appendChild(avatar);
    item.appendChild(info);

    container.appendChild(item);
  });

  return container;
}