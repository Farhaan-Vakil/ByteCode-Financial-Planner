document.addEventListener("DOMContentLoaded", function () {
  let hamburger = document.querySelector(".hamburger");
  let sidebar = document.getElementById("sidebar");

  hamburger.addEventListener("click", function () {
    sidebar.classList.toggle("closed");
  });
});
