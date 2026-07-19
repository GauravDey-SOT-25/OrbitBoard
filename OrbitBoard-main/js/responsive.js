const root = document.documentElement;

function applyMobileBoardStyles() {
  const boardScroll = document.querySelector(".board-scroll");
  const boardColumns = document.querySelector(".board-columns");

  if (!boardScroll || !boardColumns) return;

  if (window.innerWidth <= 930) {
    boardScroll.style.overflowX = "auto";
    boardScroll.style.scrollSnapType = "x mandatory";
    boardColumns.style.minWidth = "max-content";
    boardColumns.style.gridTemplateColumns = "repeat(5, minmax(220px, 1fr))";
    document.querySelectorAll(".board-column").forEach((column) => {
      column.style.minWidth = "220px";
      column.style.scrollSnapAlign = "start";
    });
  } else {
    boardScroll.style.overflowX = "hidden";
    boardScroll.style.scrollSnapType = "none";
    boardColumns.style.minWidth = "1180px";
    boardColumns.style.gridTemplateColumns = "repeat(5, minmax(220px, 1fr))";
    document.querySelectorAll(".board-column").forEach((column) => {
      column.style.minWidth = "0";
      column.style.scrollSnapAlign = "none";
    });
  }
}

window.addEventListener("resize", applyMobileBoardStyles);
window.addEventListener("DOMContentLoaded", applyMobileBoardStyles);
