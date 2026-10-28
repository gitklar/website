// Turn every glossary term into a Bootstrap popover. Bootstrap's bundle is
// loaded by Quarto at the end of the page, so wait for the DOM.
document.addEventListener("DOMContentLoaded", function () {
  if (!window.bootstrap || !window.bootstrap.Popover) { return; }
  document.querySelectorAll('a.gl[data-bs-toggle="popover"]').forEach(function (el) {
    new window.bootstrap.Popover(el, { container: "body", customClass: "gl-popover" });
  });
});
