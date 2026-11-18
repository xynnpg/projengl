(() => {
  "use strict";

  const slides = [...document.querySelectorAll(".slide")];
  const railDots = [...document.querySelectorAll("[data-go]" )].filter((element) => element.classList.contains("rail-dot"));
  const allGoButtons = [...document.querySelectorAll("[data-go]")];
  const previousButton = document.querySelector("#previousButton");
  const nextButton = document.querySelector("#nextButton");
  const slideCurrent = document.querySelector("#slideCurrent");
  const slideTotal = document.querySelector("#slideTotal");
  const progressBar = document.querySelector("#progressBar");
  const notesPanel = document.querySelector("#notesPanel");
  const notesButton = document.querySelector("#notesButton");
  const coverNotesButton = document.querySelector("#coverNotesButton");
  const closeNotesButton = document.querySelector("#closeNotesButton");
  const notesTitle = document.querySelector("#notesTitle");
  const notesText = document.querySelector("#notesText");
  const notesCurrent = document.querySelector("#notesCurrent");
  const notesDuration = document.querySelector("#notesDuration");
  const presentButton = document.querySelector("#presentButton");
  const overviewButton = document.querySelector("#overviewButton");
  const overviewDialog = document.querySelector("#overviewDialog");
  const sourcesButton = document.querySelector("#sourcesButton");
  const sourcesDialog = document.querySelector("#sourcesDialog");
  const overviewPresentButton = document.querySelector("#overviewPresentButton");
  const timerButton = document.querySelector("#timerButton");
  const timerLabel = document.querySelector("#timerLabel");
  const timerState = document.querySelector("#timerState");
  const toast = document.querySelector("#toast");
  const balanceChips = [...document.querySelectorAll(".balance-chip")];
  const balanceResponse = document.querySelector("#balanceResponse");
  const railElevator = document.querySelector("#railElevator");
  const transitDirection = document.querySelector("#transitDirection");
  const transitFloor = document.querySelector("#transitFloor");
  const transitArrow = document.querySelector(".tower-depth-readout i");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const pad = (number) => String(number).padStart(2, "0");
  const parseDuration = (value) => {
    const [minutes, seconds] = value.split(":").map(Number);
    return (minutes * 60) + seconds;
  };
  const formatTime = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

  let currentIndex = 0;
  let toastTimeout = null;
  const totalSpeakingSeconds = slides.reduce((total, slide) => total + parseDuration(slide.dataset.duration), 0);
  let remainingSeconds = totalSpeakingSeconds;
  let timerHandle = null;
  let timerRunning = false;
  let timerHasStarted = false;
  let transitionTimer = null;
  let hasRendered = false;
  let lastWheelNavigation = 0;
  const selectedBalance = new Set();

  function showToast(message) {
    window.clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function setHash(index, replace = false) {
    const nextHash = `#slide-${index + 1}`;
    if (window.location.hash === nextHash) return;
    if (replace) {
      window.history.replaceState(null, "", nextHash);
    } else {
      window.history.pushState(null, "", nextHash);
    }
  }

  function renderNotes(index) {
    const slide = slides[index];
    notesCurrent.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
    notesDuration.textContent = `Suggested: ${slide.dataset.duration}`;
    notesTitle.textContent = slide.dataset.title;
    notesText.textContent = slide.dataset.notes;
  }

  function positionRailElevator(index = currentIndex) {
    const activeDot = railDots[index];
    if (!activeDot) return;
    railElevator.style.top = `${activeDot.offsetTop}px`;
  }

  function clearTowerTransition() {
    window.clearTimeout(transitionTimer);
    transitionTimer = null;
    document.body.classList.remove("tower-transit", "direction-down", "direction-up");
    slides.forEach((slide) => slide.classList.remove("is-leaving", "is-entering"));
  }

  function goToSlide(index, options = {}) {
    const nextIndex = Math.max(0, Math.min(slides.length - 1, index));
    if (!slides[nextIndex]) return;
    if (hasRendered && nextIndex === currentIndex) return;

    if (transitionTimer) clearTowerTransition();

    const previousIndex = currentIndex;
    const direction = nextIndex >= previousIndex ? "down" : "up";
    const previousSlide = slides[previousIndex];
    const nextSlide = slides[nextIndex];

    slides.forEach((slide) => slide.classList.remove("is-leaving", "is-entering", "is-past"));

    if (hasRendered) {
      previousSlide.classList.remove("is-active");
      previousSlide.classList.add("is-leaving");
      nextSlide.classList.add("is-active", "is-entering");

      document.body.classList.remove("tower-transit", "direction-down", "direction-up");
      void document.body.offsetWidth;
      document.body.classList.add("tower-transit", `direction-${direction}`);
      transitDirection.textContent = direction === "down" ? "DESCENDING" : "ASCENDING";
      transitFloor.textContent = `LEVEL ${pad(nextIndex + 1)}`;
      transitArrow.textContent = direction === "down" ? "↓" : "↑";

      transitionTimer = window.setTimeout(() => {
        slides.forEach((slide) => slide.classList.remove("is-leaving", "is-entering"));
        document.body.classList.remove("tower-transit", "direction-down", "direction-up");
        transitionTimer = null;
      }, reducedMotionQuery.matches ? 20 : 1080);
    }

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === nextIndex;
      if (!hasRendered) slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      slide.inert = !isActive;
    });

    railDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === nextIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "step" : "false");
    });

    currentIndex = nextIndex;
    slideCurrent.textContent = pad(currentIndex + 1);
    slideTotal.textContent = pad(slides.length);
    progressBar.style.width = `${((currentIndex + 1) / slides.length) * 100}%`;
    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === slides.length - 1;
    document.title = `${slides[currentIndex].dataset.title} | Success Stories`;
    renderNotes(currentIndex);
    document.body.dataset.towerLevel = pad(currentIndex + 1);
    positionRailElevator(currentIndex);

    if (!options.skipHash) setHash(currentIndex, options.replaceHash);
    const heading = slides[currentIndex].querySelector("h1, h2");
    if (options.focusHeading && heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    hasRendered = true;
  }

  function openNotes() {
    renderNotes(currentIndex);
    notesPanel.classList.add("is-open");
    notesPanel.setAttribute("aria-hidden", "false");
    notesButton.setAttribute("aria-expanded", "true");
    closeNotesButton.focus({ preventScroll: true });
  }

  function closeNotes(restoreFocus = true) {
    notesPanel.classList.remove("is-open");
    notesPanel.setAttribute("aria-hidden", "true");
    notesButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) notesButton.focus({ preventScroll: true });
  }

  function toggleNotes() {
    if (notesPanel.classList.contains("is-open")) closeNotes();
    else openNotes();
  }

  function updateTimerDisplay() {
    timerLabel.textContent = formatTime(remainingSeconds);
    timerButton.classList.toggle("is-running", timerRunning);
    timerButton.classList.toggle("is-warning", remainingSeconds <= 60 && remainingSeconds > 0);

    if (timerRunning) timerState.textContent = "Pause";
    else if (remainingSeconds === 0) timerState.textContent = "Reset";
    else if (timerHasStarted) timerState.textContent = "Resume";
    else timerState.textContent = "Start";
  }

  function stopTimer() {
    if (timerHandle) window.clearInterval(timerHandle);
    timerHandle = null;
    timerRunning = false;
    updateTimerDisplay();
  }

  function runTimer() {
    if (timerHandle) window.clearInterval(timerHandle);
    timerRunning = true;
    timerHasStarted = true;
    updateTimerDisplay();
    timerHandle = window.setInterval(() => {
      remainingSeconds = Math.max(0, remainingSeconds - 1);
      updateTimerDisplay();
      if (remainingSeconds === 0) {
        stopTimer();
        showToast("Time is up — finish with your final reflection.");
      }
    }, 1000);
  }

  function toggleTimer() {
    if (timerRunning) {
      stopTimer();
      timerState.textContent = "Resume";
      return;
    }
    if (remainingSeconds === 0) {
      remainingSeconds = totalSpeakingSeconds;
      timerHasStarted = false;
    }
    runTimer();
  }

  function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
  }

  async function enterPresentMode() {
    closeNotes(false);
    closeDialog(overviewDialog);
    closeDialog(sourcesDialog);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      showToast("Full screen was blocked. The deck still works in this window.");
    }
    if (!timerRunning) {
      if (remainingSeconds === 0) remainingSeconds = totalSpeakingSeconds;
      runTimer();
    }
    showToast("Use ← → to navigate. Press N for speaker notes.");
  }

  function updateFullscreenButton() {
    presentButton.innerHTML = document.fullscreenElement ? "Exit <kbd>Esc</kbd>" : "Present <kbd>F</kbd>";
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      enterPresentMode();
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function updateBalanceResponse() {
    const labels = {
      health: "health",
      people: "the people around you",
      purpose: "purpose",
      rest: "rest"
    };
    const selected = [...selectedBalance].map((key) => labels[key]);

    if (selected.length === 0) {
      balanceResponse.textContent = "Choose one or two areas to keep visible.";
    } else if (selected.length === 1) {
      balanceResponse.textContent = `Keep ${selected[0]} visible. What one small action protects it this week?`;
    } else if (selected.length === 2) {
      balanceResponse.textContent = `You chose ${selected[0]} and ${selected[1]}. A meaningful life makes room for both.`;
    } else {
      balanceResponse.textContent = `You chose ${selected.slice(0, -1).join(", ")}, and ${selected.at(-1)}. Balance is a practice, not a perfect score.`;
    }
  }

  allGoButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeDialog(overviewDialog);
      closeDialog(sourcesDialog);
      goToSlide(Number(button.dataset.go));
    });
  });

  document.querySelector(".brand").addEventListener("click", (event) => {
    event.preventDefault();
    goToSlide(0);
  });

  previousButton.addEventListener("click", () => goToSlide(currentIndex - 1));
  nextButton.addEventListener("click", () => goToSlide(currentIndex + 1));
  notesButton.addEventListener("click", toggleNotes);
  coverNotesButton.addEventListener("click", openNotes);
  closeNotesButton.addEventListener("click", () => closeNotes());
  timerButton.addEventListener("click", toggleTimer);
  presentButton.addEventListener("click", toggleFullscreen);
  overviewButton.addEventListener("click", () => {
    closeNotes(false);
    if (!overviewDialog.open) overviewDialog.showModal();
  });
  overviewPresentButton.addEventListener("click", enterPresentMode);
  sourcesButton.addEventListener("click", () => {
    if (!sourcesDialog.open) sourcesDialog.showModal();
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(document.getElementById(button.dataset.closeDialog)));
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      const bounds = dialog.getBoundingClientRect();
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (!inside) dialog.close();
    });
  });

  balanceChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const key = chip.dataset.balance;
      if (selectedBalance.has(key)) selectedBalance.delete(key);
      else if (selectedBalance.size >= 2) {
        showToast("Choose one or two areas so this stays a useful reflection.");
        return;
      } else selectedBalance.add(key);
      chip.classList.toggle("is-chosen", selectedBalance.has(key));
      chip.setAttribute("aria-pressed", String(selectedBalance.has(key)));
      updateBalanceResponse();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target.matches("input, textarea, select")) return;
    if (document.querySelector("dialog[open]") && event.key !== "Escape") return;

    switch (event.key) {
      case "ArrowRight":
      case "PageDown":
        event.preventDefault();
        goToSlide(currentIndex + 1);
        break;
      case "ArrowLeft":
      case "PageUp":
        event.preventDefault();
        goToSlide(currentIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        goToSlide(0);
        break;
      case "End":
        event.preventDefault();
        goToSlide(slides.length - 1);
        break;
      case "n":
      case "N":
        event.preventDefault();
        toggleNotes();
        break;
      case "o":
      case "O":
        event.preventDefault();
        closeNotes(false);
        if (!overviewDialog.open) overviewDialog.showModal();
        break;
      case "f":
      case "F":
      case "p":
      case "P":
        event.preventDefault();
        toggleFullscreen();
        break;
      case "t":
      case "T":
        event.preventDefault();
        toggleTimer();
        break;
      case "Escape":
        if (notesPanel.classList.contains("is-open")) {
          event.preventDefault();
          closeNotes();
        }
        break;
      default:
        break;
    }
  });

  window.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) < 24) return;
    if (document.querySelector("dialog[open]") || notesPanel.classList.contains("is-open")) return;

    const activeSlide = slides[currentIndex];
    const maxScroll = activeSlide.scrollHeight - activeSlide.clientHeight;
    const movingDown = event.deltaY > 0;
    if (movingDown && activeSlide.scrollTop < maxScroll - 3) return;
    if (!movingDown && activeSlide.scrollTop > 3) return;
    if (Date.now() - lastWheelNavigation < 1050) return;

    const targetIndex = currentIndex + (movingDown ? 1 : -1);
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    event.preventDefault();
    lastWheelNavigation = Date.now();
    goToSlide(targetIndex);
  }, { passive: false });

  window.addEventListener("popstate", () => {
    const match = window.location.hash.match(/slide-(\d+)/);
    if (match) goToSlide(Number(match[1]) - 1, { skipHash: true });
  });

  document.addEventListener("fullscreenchange", updateFullscreenButton);
  window.addEventListener("resize", () => positionRailElevator(currentIndex));

  const hashMatch = window.location.hash.match(/slide-(\d+)/);
  currentIndex = hashMatch ? Math.max(0, Math.min(slides.length - 1, Number(hashMatch[1]) - 1)) : 0;
  goToSlide(currentIndex, { replaceHash: true });
  updateTimerDisplay();
  updateFullscreenButton();
  window.requestAnimationFrame(() => positionRailElevator(currentIndex));
})();
