class Exercice {
  end;
  animation;
  soundEnabled;
  elements;
  timeout;
  breathsDurations;

  constructor(options) {
    const now = new Date().getTime();
    const durationInMilliSeconds = options.duration * 60000;
    this.end = new Date(now + durationInMilliSeconds);
    this.animation = options.animation;
    this.soundEnabled = options.sound;
    this.breathsDurations = options.breathsDurations;
    this.elements = {};
    this.elements.audios = document.querySelectorAll('.audio');
  }

  start() {
    this.elements.container = document.createElement('section');
    this.elements.container.className = 'exercice';

    this.elements.title = document.createElement('h2');
    this.elements.title.className = 'exercice-title';
    this.elements.title.setAttribute('aria-live', 'assertive');

    this.elements.disc = document.createElement('div');
    this.elements.disc.className = 'exercice-disc exercice-disc--' + this.animation;

    this.elements.container.append(this.elements.title);
    this.elements.container.append(this.elements.disc);
    document.querySelector('main').append(this.elements.container);

    this.setSound(this.soundEnabled);

    // pour que l'animation se joue dès la première fois
    this.timeout = setTimeout(() => {
      this.breath('in');
    }, 0);
  }

  finish() {
    this.elements.audios.forEach(audio => audio.pause());
    this.elements.container.remove();
    clearTimeout(this.timeout);
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.setSound(this.soundEnabled);
  }

  setSound(level) {
    this.elements.audios.forEach((audio) => {
      audio.volume = level;
    })
  }

  breath(step) {
    if (step === 'in') {
      this.elements.title.textContent = 'Inspirez';
      // pour la première transition
      if (
        !this.elements.disc.classList.contains('exercice-disc--in')
        && !this.elements.disc.classList.contains('exercice-disc--out')
      ) {
        this.elements.disc.classList.add('exercice-disc--in');
      }
      else {
        this.elements.disc.classList.replace('exercice-disc--out', 'exercice-disc--in');
      }
      this.elements.disc.style.transitionDuration = `${this.breathsDurations[0]}ms`;
      this.elements.audios[0].currentTime = 0;
      this.elements.audios[0].play();
      this.timeout = setTimeout(() => {
        this.breath('out');
      }, this.breathsDurations[0]);
    }
    else {
      this.elements.title.textContent = 'Expirez';
      this.elements.disc.classList.replace('exercice-disc--in', 'exercice-disc--out');
      this.elements.disc.style.transitionDuration = `${this.breathsDurations[1]}ms`;
      this.elements.audios[1].currentTime = 0;
      this.elements.audios[1].play();
      this.timeout = setTimeout(() => {
        this.breath('in');
      }, this.breathsDurations[1]);
    }
    const now = new Date();
    if (now.getTime() > this.end.getTime()) {
      this.finish();
    }
  }
}

// Pour mémoriser l'exercice courant
let currentExercice; 

// Le formulaire et certains champs
const configForm = document.getElementById('config');
const durationRange = configForm.querySelector('input[name="duration"]');
const durationNumber = configForm.querySelector('input[name="duration-number"]');
const breathRatio = configForm.querySelector('select[name="breath-ratio"]');

// A la soumission du formulaire on annule l'exercice en cours pour en commencer un nouveau
configForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (currentExercice) {
    currentExercice.finish();
  }
  const breathsDurations = breathRatio.value.split('/').map(value => Number(value) * 1000);
  currentExercice = new Exercice({
    duration: durationRange.valueAsNumber,
    animation: configForm.querySelector('input[name="animation"]:checked').value,
    sound: configForm.querySelector('input[name="sound"]').checked,
    breathsDurations: breathsDurations, 
  });
  currentExercice.start();
});

// On synchronise le champ range et le champ number pour la durée de l'exercice
durationRange.addEventListener('change', (event) => {
  durationNumber.value = durationRange.value;
  localStorage.setItem(durationNumber.name, durationNumber.value);
});
durationNumber.addEventListener('change', (event) => {
  durationRange.value = durationNumber.value;
  localStorage.setItem(durationRange.name, durationRange.value);
});

// Gestion des raccourcis clavier
document.addEventListener('keyup', (event) => {
  if (currentExercice) {
    switch(event.key) {
      case 'Escape':
        currentExercice.finish();
        currentExercice = null;
        break;
      case 's':
        currentExercice.toggleSound();
        break;
    }
  }
});


// Gestion des raccourcis tactiles
let tapCounter = 0;
let tapTimeout;
let tapStart;
document.addEventListener('touchstart', (event) => {
  if (currentExercice) {
    tapCounter++;
    if (tapCounter >= 2) {
      currentExercice.toggleSound();
    }
    clearTimeout(tapTimeout);
    tapTimeout = setTimeout(() => {
      tapCounter = 0;
    }, 500);
    tapStart = new Date().getTime();
  }
});
document.addEventListener('touchend', () => {
  if (currentExercice) {
    const tapEnd = new Date().getTime();
    if (tapEnd - tapStart >= 1000) {
      currentExercice.finish();
      currentExercice = null;
    }
  }
});

// Persistance des préférences
// Pas évident de gérer tous les types
const inputs = document.querySelectorAll('input, select');
inputs.forEach((input) => {
  const value = localStorage.getItem(input.name);
  if (value) {
    switch (input.type) {
      case 'radio':
        document.querySelector(`input[name=${input.name}][value=${value}]`).checked = true;
        break;
      case 'checkbox':
        input.checked = value === '1';
        break;
      default:
        input.value = value;
    }
  }
  input.addEventListener('change', () => {
    if (input.type === 'checkbox') {
      localStorage.setItem(input.name, input.checked ? '1' : '0');
    }
    else {
      localStorage.setItem(input.name, input.value);
    }
  });
});