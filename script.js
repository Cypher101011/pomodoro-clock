class PomodoroTimer {
  constructor() {
    // Default settings
    this.settings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakAfter: 4,
      soundAlert: true,
      autoStart: false,
    }

    // Timer state
    this.currentMode = "work"
    this.timeLeft = this.settings.workDuration * 60 // in seconds
    this.isRunning = false
    this.completedPomodoros = 0
    this.timerInterval = null

    // DOM elements
    this.timerDisplay = document.getElementById("timer")
    this.startBtn = document.getElementById("startBtn")
    this.pauseBtn = document.getElementById("pauseBtn")
    this.resetBtn = document.getElementById("resetBtn")
    this.settingsBtn = document.getElementById("settingsBtn")
    this.settingsModal = document.getElementById("settingsModal")
    this.settingsForm = document.getElementById("settingsForm")
    this.cancelBtn = document.getElementById("cancelBtn")
    this.cycleCount = document.getElementById("cycleCount")
    this.cycleTarget = document.getElementById("cycleTarget")
    this.modeButtons = document.querySelectorAll(".mode-btn")
    this.alertSound = document.getElementById("alertSound")
    this.progressRing = document.querySelector(".progress-ring-circle")

    // Initialize
    this.loadSettings()
    this.updateDisplay()
    this.bindEvents()
    this.updateProgressRing()
  }

  bindEvents() {
    // Control buttons
    this.startBtn.addEventListener("click", () => this.startTimer())
    this.pauseBtn.addEventListener("click", () => this.pauseTimer())
    this.resetBtn.addEventListener("click", () => this.resetTimer())

    // Settings
    this.settingsBtn.addEventListener("click", () => this.openSettings())
    this.settingsForm.addEventListener("submit", (e) => this.saveSettings(e))
    this.cancelBtn.addEventListener("click", () => this.closeSettings())

    // Mode buttons
    this.modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.switchMode(btn.dataset.mode))
    })

    // Close modal when clicking outside
    this.settingsModal.addEventListener("click", (e) => {
      if (e.target === this.settingsModal) {
        this.closeSettings()
      }
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !this.isModalOpen()) {
        e.preventDefault()
        this.isRunning ? this.pauseTimer() : this.startTimer()
      } else if (e.code === "KeyR" && !this.isModalOpen()) {
        e.preventDefault()
        this.resetTimer()
      }
    })
  }

  startTimer() {
    if (!this.isRunning) {
      this.isRunning = true
      this.startBtn.disabled = true
      this.pauseBtn.disabled = false

      this.timerInterval = setInterval(() => {
        this.timeLeft--
        this.updateDisplay()
        this.updateProgressRing()

        if (this.timeLeft <= 0) {
          this.completeSession()
        }
      }, 1000)
    }
  }

  pauseTimer() {
    if (this.isRunning) {
      this.isRunning = false
      this.startBtn.disabled = false
      this.pauseBtn.disabled = true
      clearInterval(this.timerInterval)
    }
  }

  resetTimer() {
    this.pauseTimer()
    this.timeLeft = this.getCurrentModeDuration() * 60
    this.updateDisplay()
    this.updateProgressRing()
    this.startBtn.disabled = false
    this.pauseBtn.disabled = true
  }

  completeSession() {
    this.pauseTimer()

    // Play sound if enabled
    if (this.settings.soundAlert) {
      this.playAlert()
    }

    // Update completed pomodoros count
    if (this.currentMode === "work") {
      this.completedPomodoros++
      this.updateCycleDisplay()
    }

    // Determine next mode
    const nextMode = this.getNextMode()

    // Auto-switch to next mode
    this.switchMode(nextMode)

    // Auto-start if enabled
    if (this.settings.autoStart) {
      setTimeout(() => {
        this.startTimer()
      }, 1000)
    }

    // Add visual feedback
    this.timerDisplay.classList.add("pulse")
    setTimeout(() => {
      this.timerDisplay.classList.remove("pulse")
    }, 2000)
  }

  getNextMode() {
    if (this.currentMode === "work") {
      // Check if it's time for long break
      if (this.completedPomodoros % this.settings.longBreakAfter === 0) {
        return "long"
      } else {
        return "short"
      }
    } else {
      return "work"
    }
  }

  switchMode(mode) {
    if (this.isRunning) {
      this.pauseTimer()
    }

    this.currentMode = mode
    this.timeLeft = this.getCurrentModeDuration() * 60

    // Update UI
    this.updateModeButtons()
    this.updateDisplay()
    this.updateProgressRing()

    this.startBtn.disabled = false
    this.pauseBtn.disabled = true
  }

  getCurrentModeDuration() {
    switch (this.currentMode) {
      case "work":
        return this.settings.workDuration
      case "short":
        return this.settings.shortBreakDuration
      case "long":
        return this.settings.longBreakDuration
      default:
        return this.settings.workDuration
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60)
    const seconds = this.timeLeft % 60
    this.timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

    // Update document title
    document.title = `${this.timerDisplay.textContent} - Pomodoro Clock`
  }

  updateModeButtons() {
    this.modeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === this.currentMode)
    })
  }

  updateCycleDisplay() {
    this.cycleCount.textContent = this.completedPomodoros
    this.cycleTarget.textContent = this.settings.longBreakAfter
  }

  updateProgressRing() {
    if (this.progressRing) {
      const totalTime = this.getCurrentModeDuration() * 60
      const progress = (totalTime - this.timeLeft) / totalTime
      const circumference = 2 * Math.PI * 140 // radius = 140
      const offset = circumference - progress * circumference
      this.progressRing.style.strokeDashoffset = offset
    }
  }

  playAlert() {
    if (this.alertSound) {
      this.alertSound.currentTime = 0
      this.alertSound.play().catch((e) => {
        console.log("Could not play sound:", e)
      })
    }
  }

  openSettings() {
    // Populate form with current settings
    document.getElementById("workDuration").value = this.settings.workDuration
    document.getElementById("shortBreakDuration").value = this.settings.shortBreakDuration
    document.getElementById("longBreakDuration").value = this.settings.longBreakDuration
    document.getElementById("longBreakAfter").value = this.settings.longBreakAfter
    document.getElementById("soundAlert").checked = this.settings.soundAlert
    document.getElementById("autoStart").checked = this.settings.autoStart

    this.settingsModal.style.display = "block"
  }

  closeSettings() {
    this.settingsModal.style.display = "none"
  }

  saveSettings(e) {
    e.preventDefault()

    // Get form values
    const newSettings = {
      workDuration: Number.parseInt(document.getElementById("workDuration").value),
      shortBreakDuration: Number.parseInt(document.getElementById("shortBreakDuration").value),
      longBreakDuration: Number.parseInt(document.getElementById("longBreakDuration").value),
      longBreakAfter: Number.parseInt(document.getElementById("longBreakAfter").value),
      soundAlert: document.getElementById("soundAlert").checked,
      autoStart: document.getElementById("autoStart").checked,
    }

    // Validate settings
    if (this.validateSettings(newSettings)) {
      this.settings = newSettings
      this.saveSettingsToStorage()

      // Update current timer if not running
      if (!this.isRunning) {
        this.timeLeft = this.getCurrentModeDuration() * 60
        this.updateDisplay()
        this.updateProgressRing()
      }

      this.updateCycleDisplay()
      this.closeSettings()
    }
  }

  validateSettings(settings) {
    const errors = []

    if (settings.workDuration < 1 || settings.workDuration > 60) {
      errors.push("Work duration must be between 1 and 60 minutes")
    }
    if (settings.shortBreakDuration < 1 || settings.shortBreakDuration > 30) {
      errors.push("Short break must be between 1 and 30 minutes")
    }
    if (settings.longBreakDuration < 1 || settings.longBreakDuration > 60) {
      errors.push("Long break must be between 1 and 60 minutes")
    }
    if (settings.longBreakAfter < 2 || settings.longBreakAfter > 10) {
      errors.push("Long break interval must be between 2 and 10 pomodoros")
    }

    if (errors.length > 0) {
      alert("Please fix the following errors:\n" + errors.join("\n"))
      return false
    }

    return true
  }

  loadSettings() {
    const saved = localStorage.getItem("pomodoroSettings")
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) }
    }
    this.updateCycleDisplay()
  }

  saveSettingsToStorage() {
    localStorage.setItem("pomodoroSettings", JSON.stringify(this.settings))
  }

  isModalOpen() {
    return this.settingsModal.style.display === "block"
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PomodoroTimer()
})

// Service Worker registration for PWA (optional enhancement)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}
