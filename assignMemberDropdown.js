// assignMemberDropdown.js

import members from "./member.js";

/**
 * Creates a dropdown for assigning members.
 * @param {number|null} selectedMemberId
 * @returns {HTMLSelectElement}
 */
export function createAssignMemberDropdown(selectedMemberId = null) {
  const select = document.createElement("select");

  select.className = "assign-member-dropdown";
  select.name = "assignee";

  // Default Option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select Member --";
  defaultOption.disabled = true;
  defaultOption.selected = selectedMemberId === null;

  select.appendChild(defaultOption);

  // Member Options
  members.forEach(member => {
    const option = document.createElement("option");

    option.value = member.id;
    option.textContent = `${member.name} (${member.email})`;

    if (member.id === selectedMemberId) {
      option.selected = true;
    }

    select.appendChild(option);
  });

  return select;
}