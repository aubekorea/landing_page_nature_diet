(function () {
  var privacyModal = document.getElementById("privacy-modal");
  var privacyDialog = privacyModal.querySelector(".privacy-dialog");
  var privacyOpenButtons = document.querySelectorAll("[data-privacy-open]");
  var privacyCloseButtons = privacyModal.querySelectorAll("[data-privacy-close]");
  var lastFocusedElement = null;

  function openPrivacyModal() {
    lastFocusedElement = document.activeElement;
    privacyModal.hidden = false;
    privacyModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    privacyDialog.focus();
  }

  function closePrivacyModal() {
    privacyModal.hidden = true;
    privacyModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  privacyOpenButtons.forEach(function (button) {
    button.addEventListener("click", openPrivacyModal);
  });

  privacyCloseButtons.forEach(function (button) {
    button.addEventListener("click", closePrivacyModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !privacyModal.hidden) {
      closePrivacyModal();
    }
  });

  window.openPrivacyModal = openPrivacyModal;
}());
