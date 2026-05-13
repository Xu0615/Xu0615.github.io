(function () {
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  if (isTouchDevice) {
    return;
  }

  const cursor = document.createElement("img");
  cursor.className = "moon-cursor";
  cursor.src = "/images/Moon.svg";
  cursor.alt = "";
  cursor.setAttribute("aria-hidden", "true");
  document.body.appendChild(cursor);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener("mousemove", function (event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  window.addEventListener("mousedown", function () {
    cursor.classList.add("is-clicking");
  });

  window.addEventListener("mouseup", function () {
    cursor.classList.remove("is-clicking");
  });

  function animateCursor() {
    currentX += (mouseX - currentX) * 0.25;
    currentY += (mouseY - currentY) * 0.25;

    cursor.style.transform =
      "translate(" + currentX + "px, " + currentY + "px) translate(-50%, -50%)";

    requestAnimationFrame(animateCursor);
  }

  animateCursor();
})();
