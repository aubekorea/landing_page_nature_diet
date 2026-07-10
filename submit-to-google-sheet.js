const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzCirTRb0PLRWMAB99iHnDcQN97pGJNW0pfPD9zJoIk9v58ECLxPuJzeY85O-tnzbZvHA/exec";

(function () {
  var consultForms = document.querySelectorAll("[data-google-sheet-form]");
  var foldingReservation = document.querySelector("[data-folding-reservation]");
  var foldingToggle = document.querySelector("[data-folding-toggle]");

  function getFieldValue(form, name) {
    var field = form.elements[name];
    return field && field.value ? field.value.trim() : "";
  }

  function getSelectedOptionText(select) {
    if (!select || select.selectedIndex < 0) {
      return "";
    }

    return select.options[select.selectedIndex].textContent.trim();
  }

  function getFormMessage(form) {
    return form.querySelector(".form-message");
  }

  function setFormMessage(form, message, type) {
    var messageBox = getFormMessage(form);

    if (!messageBox) {
      return;
    }

    messageBox.textContent = message;
    messageBox.dataset.type = type || "";
  }

  function setSubmitLoading(button, isLoading) {
    if (!button) {
      return;
    }

    var hasImage = Boolean(button.querySelector("img"));
    button.disabled = isLoading;
    button.setAttribute("aria-busy", String(isLoading));

    if (!hasImage) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
      }

      button.textContent = isLoading ? "전송 중입니다" : button.dataset.originalText;
    }
  }

  function formatPhone(prefix, phoneNumber) {
    var digits = phoneNumber.replace(/\D/g, "");

    if (digits.length === 8) {
      return prefix + "-" + digits.slice(0, 4) + "-" + digits.slice(4);
    }

    if (digits.length === 7) {
      return prefix + "-" + digits.slice(0, 3) + "-" + digits.slice(3);
    }

    return [prefix, phoneNumber].filter(Boolean).join("-");
  }

  function getPhoneValue(form) {
    var prefix = getFieldValue(form, "phone_prefix") || "010";
    var phoneNumber = getFieldValue(form, "phone_number");
    var middle = getFieldValue(form, "phone_middle");
    var last = getFieldValue(form, "phone_last");

    if (phoneNumber) {
      return formatPhone(prefix, phoneNumber);
    }

    return [prefix, middle, last].filter(Boolean).join("-");
  }

  function buildSheetFormData(form) {
    var formData = new FormData(form);
    var contactTimeSelect = form.elements.contact_time;

    formData.set("phone", getPhoneValue(form));
    formData.delete("phone_prefix");
    formData.delete("phone_number");
    formData.delete("phone_middle");
    formData.delete("phone_last");

    formData.set("name", getFieldValue(form, "name"));
    formData.set("program", getFieldValue(form, "program") || "다이어트 상담");
    formData.set("source", getFieldValue(form, "source") || "diet_hospitalx");
    formData.set("contact_time", getSelectedOptionText(contactTimeSelect));
    formData.set("contact_time_value", getFieldValue(form, "contact_time"));
    formData.set("privacy_agree", form.elements.privacy_agree && form.elements.privacy_agree.checked ? "Y" : "N");
    formData.set("privacy", form.elements.privacy_agree && form.elements.privacy_agree.checked ? "동의" : "미동의");
    formData.set("page_url", window.location.href);
    formData.set("submitted_at_client", new Date().toISOString());

    return formData;
  }

  function bindFoldingReservation() {
    if (!foldingReservation || !foldingToggle) {
      return;
    }

    function collapseReservation() {
      foldingReservation.classList.add("is-collapsed");
      foldingToggle.setAttribute("aria-expanded", "false");
      foldingToggle.querySelector("span").textContent = "다이어트 상담 예약 신청";
    }

    function expandReservation() {
      foldingReservation.classList.remove("is-collapsed");
      foldingToggle.setAttribute("aria-expanded", "true");
      foldingToggle.querySelector("span").textContent = "다이어트 상담 예약 신청";
    }

    function toggleReservation() {
      if (foldingReservation.classList.contains("is-collapsed")) {
        expandReservation();
        return;
      }

      collapseReservation();
    }

    foldingReservation.classList.remove("is-collapsed");
    foldingToggle.setAttribute("aria-expanded", "true");
    foldingToggle.querySelector("span").textContent = "다이어트 상담 예약 신청";

    foldingToggle.addEventListener("click", toggleReservation);

    window.addEventListener("scroll", function () {
      if (window.scrollY > 8) {
        collapseReservation();
      }
    }, { passive: true });
  }

  async function submitToGoogleSheet(event) {
    event.preventDefault();

    var form = event.currentTarget;
    var submitButton = form.querySelector("button[type='submit']");
    setFormMessage(form, "", "");

    if (form.elements.privacy_agree && !form.elements.privacy_agree.checked) {
      setFormMessage(form, "개인정보 수집 이용 동의를 확인해주세요.", "error");

      if (typeof window.openPrivacyModal === "function") {
        window.openPrivacyModal();
      }

      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.indexOf("script.google.com") === -1) {
      setFormMessage(form, "Google Apps Script 주소를 확인해주세요.", "error");
      return;
    }

    setSubmitLoading(submitButton, true);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: buildSheetFormData(form),
      });

      form.reset();
      setFormMessage(form, "상담 신청이 접수되었습니다. 연락가능한 시간에 안내드리겠습니다.", "success");
    } catch (error) {
      console.error(error);
      setFormMessage(form, "전송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      setSubmitLoading(submitButton, false);
    }
  }

  bindFoldingReservation();
  consultForms.forEach(function (form) {
    form.addEventListener("submit", submitToGoogleSheet);
  });
}());
