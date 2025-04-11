import confetti from 'canvas-confetti';
import Slot from '@js/Slot';
import SoundEffects from '@js/SoundEffects';

// Default name list
const DEFAULT_NAME_LIST = [
  '5% discount',
  '20% discount',
  '25% discount',
  '30% discount',
  '3 months free | 1 year subscription',
  '6 months free Performance module',
  'All-in-one : INR 500/Month',
  '1 year free-HRMS+PAYROLL'
];

// Local storage keys
const STORAGE_KEYS = {
  NAME_LIST: 'random-name-picker-name-list',
  REMOVE_WINNER: 'random-name-picker-remove-winner',
  SOUND_ENABLED: 'random-name-picker-sound-enabled'
};

// Initialize slot machine
(() => {
  const drawButton = document.getElementById('draw-button') as HTMLButtonElement | null;
  const fullscreenButton = document.getElementById('fullscreen-button') as HTMLButtonElement | null;
  const settingsButton = document.getElementById('settings-button') as HTMLButtonElement | null;
  const settingsWrapper = document.getElementById('settings') as HTMLDivElement | null;
  const settingsContent = document.getElementById('settings-panel') as HTMLDivElement | null;
  const settingsSaveButton = document.getElementById('settings-save') as HTMLButtonElement | null;
  const settingsCloseButton = document.getElementById('settings-close') as HTMLButtonElement | null;
  const sunburstSvg = document.getElementById('sunburst') as HTMLImageElement | null;
  const confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  const nameListTextArea = document.getElementById('name-list') as HTMLTextAreaElement | null;
  const removeNameFromListCheckbox = document.getElementById('remove-from-list') as HTMLInputElement | null;
  const enableSoundCheckbox = document.getElementById('enable-sound') as HTMLInputElement | null;

  // Graceful exit if necessary elements are not found
  if (!(
    drawButton
    && fullscreenButton
    && settingsButton
    && settingsWrapper
    && settingsContent
    && settingsSaveButton
    && settingsCloseButton
    && sunburstSvg
    && confettiCanvas
    && nameListTextArea
    && removeNameFromListCheckbox
    && enableSoundCheckbox
  )) {
    console.error('One or more Element ID is invalid. This is possibly a bug.');
    return;
  }

  if (!(confettiCanvas instanceof HTMLCanvasElement)) {
    console.error('Confetti canvas is not an instance of Canvas. This is possibly a bug.');
    return;
  }

  const soundEffects = new SoundEffects();
  const MAX_REEL_ITEMS = 40;
  const CONFETTI_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
  let confettiAnimationId;

  /** Confeetti animation instance */
  const customConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
  });

  /** Triggers cconfeetti animation until animation is canceled */
  const confettiAnimation = () => {
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
    const confettiScale = Math.max(0.5, Math.min(1, windowWidth / 1100));

    customConfetti({
      particleCount: 1,
      gravity: 0.8,
      spread: 90,
      origin: { y: 0.6 },
      colors: [CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]],
      scalar: confettiScale
    });

    confettiAnimationId = window.requestAnimationFrame(confettiAnimation);
  };

  /** Function to stop the winning animation */
  const stopWinningAnimation = () => {
    if (confettiAnimationId) {
      window.cancelAnimationFrame(confettiAnimationId);
    }
    sunburstSvg.style.display = 'none';
  };

  /**  Function to be trigger before spinning */
  const onSpinStart = () => {
    stopWinningAnimation();
    drawButton.disabled = true;
    settingsButton.disabled = true;
    soundEffects.spin((MAX_REEL_ITEMS - 1) / 10);
  };

  /**  Functions to be trigger after spinning */
  const onSpinEnd = async () => {
    confettiAnimation();
    sunburstSvg.style.display = 'block';
    await soundEffects.win();
    drawButton.disabled = false;
    settingsButton.disabled = false;
  };

  /** Load settings from local storage */
  const loadSettings = () => {
    // Load name list
    const savedNameList = localStorage.getItem(STORAGE_KEYS.NAME_LIST);
    const nameList = savedNameList ? JSON.parse(savedNameList) : DEFAULT_NAME_LIST;
    
    // Load remove winner setting
    const savedRemoveWinner = localStorage.getItem(STORAGE_KEYS.REMOVE_WINNER);
    const removeWinner = savedRemoveWinner !== null ? JSON.parse(savedRemoveWinner) : true;
    
    // Load sound setting
    const savedSoundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    const soundEnabled = savedSoundEnabled !== null ? JSON.parse(savedSoundEnabled) : true;
    
    return { nameList, removeWinner, soundEnabled };
  };

  /** Save settings to local storage */
  const saveSettings = (nameList: string[], removeWinner: boolean, soundEnabled: boolean) => {
    localStorage.setItem(STORAGE_KEYS.NAME_LIST, JSON.stringify(nameList));
    localStorage.setItem(STORAGE_KEYS.REMOVE_WINNER, JSON.stringify(removeWinner));
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(soundEnabled));
  };

  // Load settings from local storage
  const { nameList, removeWinner, soundEnabled } = loadSettings();

  /** Slot instance */
  const slot = new Slot({
    reelContainerSelector: '#reel',
    maxReelItems: MAX_REEL_ITEMS,
    removeWinner,
    onSpinStart,
    onSpinEnd,
    onNameListChanged: stopWinningAnimation
  });

  // Set initial name list
  slot.names = nameList;
  
  // Set initial sound state
  soundEffects.mute = !soundEnabled;

  /** To open the setting page */
  const onSettingsOpen = () => {
    nameListTextArea.value = slot.names.length ? slot.names.join('\n') : '';
    removeNameFromListCheckbox.checked = slot.shouldRemoveWinnerFromNameList;
    enableSoundCheckbox.checked = !soundEffects.mute;
    settingsWrapper.style.display = 'block';
  };

  /** To close the setting page */
  const onSettingsClose = () => {
    settingsContent.scrollTop = 0;
    settingsWrapper.style.display = 'none';
  };

  // Click handler for "Draw" button
  drawButton.addEventListener('click', () => {
    if (!slot.names.length) {
      onSettingsOpen();
      return;
    }

    slot.spin();
  });

  // Hide fullscreen button when it is not supported
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - for older browsers support
  if (!(document.documentElement.requestFullscreen && document.exitFullscreen)) {
    fullscreenButton.remove();
  }

  // Click handler for "Fullscreen" button
  fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      return;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });

  // Click handler for "Settings" button
  settingsButton.addEventListener('click', onSettingsOpen);

  // Click handler for "Save" button for setting page
  settingsSaveButton.addEventListener('click', () => {
    const newNameList = nameListTextArea.value
      ? nameListTextArea.value.split(/\n/).filter((name) => Boolean(name.trim()))
      : [];
    
    slot.names = newNameList;
    slot.shouldRemoveWinnerFromNameList = removeNameFromListCheckbox.checked;
    soundEffects.mute = !enableSoundCheckbox.checked;
    
    // Save settings to local storage
    saveSettings(newNameList, removeNameFromListCheckbox.checked, enableSoundCheckbox.checked);
    
    onSettingsClose();
  });

  // Click handler for "Discard and close" button for setting page
  settingsCloseButton.addEventListener('click', onSettingsClose);
})();
