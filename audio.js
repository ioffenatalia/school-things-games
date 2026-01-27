// ===============================
// audio.js - Общая система звука для всех игр
// Подключайте этот файл в каждую игру
// ===============================

let gameAudioEnabled = false;
let audioContext = null;

// Главная функция активации звука
function activateGameAudio() {
    // Если уже активирован, выходим
    if (gameAudioEnabled) return true;
    
    console.log('Activating audio system...');
    
    // 1. Пробуем активировать Web Audio API
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioContext = new AudioContextClass();
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('AudioContext activated!');
                });
            }
        }
    } catch (e) {
        console.log('Web Audio API not supported:', e.message);
    }
    
    // 2. Пробуем активировать SpeechSynthesis (для игр с голосом)
    if ('speechSynthesis' in window) {
        try {
            // Произносим пустую тихую фразу для активации
            const utterance = new SpeechSynthesisUtterance(' ');
            utterance.volume = 0.01;
            utterance.onstart = () => {
                window.speechSynthesis.cancel(); // Сразу отменяем
                console.log('SpeechSynthesis activated!');
            };
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.log('SpeechSynthesis error:', e.message);
        }
    }
    
    // 3. Пробуем проиграть тихий звук через HTML5 Audio
    try {
        const silentAudio = new Audio();
        silentAudio.volume = 0.001;
        // Создаем очень короткий тихий звук
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
        
        const playPromise = silentAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                silentAudio.pause();
                gameAudioEnabled = true;
                localStorage.setItem('gameAudioEnabled', 'true');
                console.log('HTML5 Audio activated!');
            }).catch(e => {
                console.log('HTML5 Audio needs user interaction');
            });
        }
    } catch (e) {
        console.log('HTML5 Audio error:', e.message);
    }
    
    // Помечаем как активированный
    gameAudioEnabled = true;
    localStorage.setItem('gameAudioEnabled', 'true');
    
    console.log('Audio system fully activated!');
    return true;
}

// Проверка, активирован ли звук
function isAudioActivated() {
    return gameAudioEnabled || localStorage.getItem('gameAudioEnabled') === 'true';
}

// Функция для безопасного воспроизведения SpeechSynthesis
function safeSpeak(text, options = {}) {
    if (!isAudioActivated()) {
        console.warn('Audio not activated. Call activateGameAudio() first.');
        return false;
    }
    
    try {
        // Отменяем текущую речь
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang || 'en-US';
        utterance.rate = options.rate || 0.8;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        
        // Добавляем обработчики
        utterance.onstart = options.onstart;
        utterance.onend = options.onend;
        utterance.onerror = options.onerror;
        
        window.speechSynthesis.speak(utterance);
        return true;
    } catch (e) {
        console.error('Speech error:', e);
        return false;
    }
}

// Функция для безопасного воспроизведения обычного аудио
function playSound(url, volume = 1.0) {
    if (!isAudioActivated()) {
        console.warn('Audio not activated. Call activateGameAudio() first.');
        return null;
    }
    
    try {
        const audio = new Audio(url);
        audio.volume = volume;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.error('Audio play failed:', e);
            });
        }
        
        return audio;
    } catch (e) {
        console.error('Audio error:', e);
        return null;
    }
}

// Автопроверка при загрузке страницы
window.addEventListener('DOMContentLoaded', function() {
    // Если звук уже был активирован ранее, восстанавливаем статус
    if (localStorage.getItem('gameAudioEnabled') === 'true') {
        gameAudioEnabled = true;
        console.log('Audio was previously activated');
    }
    
    // На компьютерах пробуем активировать автоматически
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
        // На ПК пробуем активировать после небольшой задержки
        setTimeout(() => {
            if (!gameAudioEnabled) {
                activateGameAudio();
            }
        }, 1000);
    }
});

// Делаем функции доступными глобально
window.activateGameAudio = activateGameAudio;
window.isAudioActivated = isAudioActivated;
window.safeSpeak = safeSpeak;
window.playSound = playSound;

console.log('Audio.js loaded successfully!');