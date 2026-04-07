const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let particles = [];
let mouse = { x: -300, y: -300, radius: 180 };

const bgMusic = document.getElementById("bgMusic");
const volumeControl = document.getElementById("volumeControl");
const musicToggle = document.getElementById("musicToggle");
const musicControl = document.getElementById("musicControl");
const startupNotice = document.getElementById("startupNotice");
const startupOk = document.getElementById("startupOk");
const previewPanel = document.getElementById("previewPanel");
const previewVideo = document.getElementById("previewVideo");
const previewClose = document.getElementById("previewClose");
const previewTrigger = document.querySelector(".info-icon-PHANTOM-X");
let resumeBackgroundMusic = false;
let hasUserInteracted = false;
let previewOpen = false;
let triggerHovered = false;
let panelHovered = false;
let previewCloseTimer = null;
let hasActivatedAudio = false;
let userMutedBackgroundMusic = false;

window.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 1.8 + 0.4;
        this.density = Math.random() * 22 + 6;
    }

    draw() {
        ctx.fillStyle = "rgba(116, 233, 255, 0.45)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.baseX += this.vx;
        this.baseY += this.vy;

        if (this.baseX < 0 || this.baseX > canvas.width) {
            this.vx *= -1;
        }

        if (this.baseY < 0 || this.baseY > canvas.height) {
            this.vy *= -1;
        }

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy) || 1;

        if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            const dirX = (dx / distance) * force * this.density;
            const dirY = (dy / distance) * force * this.density;
            this.x -= dirX;
            this.y -= dirY;
        } else {
            this.x += (this.baseX - this.x) * 0.045;
            this.y += (this.baseY - this.y) * 0.045;
        }
    }
}

function initParticles() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];

    const particleCount = window.innerWidth < 760 ? 38 : 70;
    for (let index = 0; index < particleCount; index += 1) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i += 1) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j += 1) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.hypot(dx, dy);

            if (distance < 150) {
                ctx.strokeStyle = `rgba(116, 233, 255, ${0.12 - distance / 1350})`;
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animateParticles);
}

function nav(id) {
    document.querySelectorAll(".main-frame").forEach((panel) => {
        panel.style.display = "none";
        if (panel.classList.contains("view-panel")) {
            panel.scrollTop = 0;
        }
    });

    const target = document.getElementById(id);
    if (!target) {
        return;
    }

    target.style.display = "block";

    const backBtn = target.querySelector(".back-btn");
    if (backBtn) {
        backBtn.classList.remove("hidden");
    }

    closePreview();
}

function syncMusicButton() {
    if (!musicToggle || !bgMusic) {
        return;
    }

    musicToggle.classList.toggle("is-muted", userMutedBackgroundMusic);
    if (musicControl) {
        musicControl.classList.toggle("is-muted", userMutedBackgroundMusic);
    }
    musicToggle.setAttribute("aria-label", userMutedBackgroundMusic ? "Unmute background music" : "Mute background music");
}

function syncVolumeControl() {
    if (!volumeControl || !bgMusic) {
        return;
    }

    volumeControl.value = String(Math.round(bgMusic.volume * 100));
}

function setBackgroundMusicVolume(nextVolume) {
    if (!bgMusic) {
        return;
    }

    bgMusic.volume = Math.max(0, Math.min(0.35, nextVolume));
    syncVolumeControl();
}

function fadeBackgroundMusicTo(targetVolume, durationMs = 900) {
    if (!bgMusic) {
        return;
    }

    const startVolume = bgMusic.volume;
    const delta = targetVolume - startVolume;
    const steps = Math.max(1, Math.round(durationMs / 70));
    let step = 0;

    const ramp = setInterval(() => {
        step += 1;
        setBackgroundMusicVolume(startVolume + (delta * step) / steps);

        if (step >= steps) {
            clearInterval(ramp);
            setBackgroundMusicVolume(targetVolume);
        }
    }, durationMs / steps);
}

function enableBackgroundMusic(withFade = true) {
    if (!bgMusic || previewOpen) {
        return;
    }

    hasActivatedAudio = true;
    hasUserInteracted = true;
    userMutedBackgroundMusic = false;
    bgMusic.muted = false;
    syncMusicButton();

    const playPromise = bgMusic.play();
    const applyFade = () => {
        if (withFade) {
            setBackgroundMusicVolume(0);
            fadeBackgroundMusicTo(0.35, 1100);
            return;
        }

        setBackgroundMusicVolume(0.35);
    };

    if (playPromise && typeof playPromise.then === "function") {
        playPromise.then(applyFade).catch(() => {});
        return;
    }

    applyFade();
}

function disableBackgroundMusic() {
    if (!bgMusic) {
        return;
    }

    userMutedBackgroundMusic = true;
    bgMusic.muted = true;
    syncMusicButton();
}

function playBackgroundMusic() {
    if (!bgMusic || previewOpen || bgMusic.muted || !hasUserInteracted) {
        return;
    }

    if (bgMusic.readyState < 2) {
        bgMusic.load();
    }

    const playPromise = bgMusic.play();
    if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
    }
}

function tryStartBackgroundMusic() {
    if (!bgMusic) {
        return;
    }

    if (!hasUserInteracted) {
        return;
    }

    playBackgroundMusic();
}

function pauseBackgroundMusicForPreview() {
    if (!bgMusic) {
        return;
    }

    resumeBackgroundMusic = !bgMusic.paused && !bgMusic.muted && bgMusic.volume > 0;
    bgMusic.pause();
}

function shouldKeepBackgroundMusicPlaying() {
    return Boolean(bgMusic) && hasUserInteracted && !previewOpen && !bgMusic.muted;
}

function resumeBackgroundMusicIfNeeded() {
    if (!bgMusic) {
        return;
    }

    if ((resumeBackgroundMusic || shouldKeepBackgroundMusicPlaying()) && !bgMusic.muted && bgMusic.volume > 0) {
        bgMusic.play().catch(() => {});
    }

    resumeBackgroundMusic = false;
}

function clearPreviewCloseTimer() {
    if (previewCloseTimer) {
        clearTimeout(previewCloseTimer);
        previewCloseTimer = null;
    }
}

function schedulePreviewClose() {
    clearPreviewCloseTimer();
    previewCloseTimer = setTimeout(() => {
        if (!triggerHovered && !panelHovered) {
            closePreview();
        }
    }, 120);
}

function openPreview() {
    if (!previewPanel || !previewVideo || previewOpen) {
        return;
    }

    clearPreviewCloseTimer();
    previewOpen = true;
    previewPanel.classList.add("active");
    pauseBackgroundMusicForPreview();
    if (previewVideo.readyState < 2) {
        previewVideo.load();
    }
    previewVideo.currentTime = 0;
    previewVideo.muted = !hasUserInteracted;
    previewVideo.play().catch(() => {
        previewVideo.muted = true;
        previewVideo.play().catch(() => {});
    });
}

function closePreview() {
    if (!previewPanel || !previewVideo || !previewOpen) {
        return;
    }

    clearPreviewCloseTimer();
    triggerHovered = false;
    panelHovered = false;
    previewOpen = false;
    previewPanel.classList.remove("active");
    previewVideo.pause();
    previewVideo.currentTime = 0;
    resumeBackgroundMusicIfNeeded();
}

document.querySelectorAll(".view-panel").forEach((panel) => {
    let lastScrollTop = 0;

    panel.addEventListener(
        "scroll",
        () => {
            const backBtn = panel.querySelector(".back-btn");
            if (!backBtn) {
                return;
            }

            const scrollTop = panel.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > 50) {
                backBtn.classList.add("hidden");
            } else {
                backBtn.classList.remove("hidden");
            }

            lastScrollTop = Math.max(scrollTop, 0);
        },
        { passive: true }
    );
});

if (previewTrigger) {
    previewTrigger.addEventListener("mouseenter", () => {
        triggerHovered = true;
        openPreview();
    });
    previewTrigger.addEventListener("mouseleave", () => {
        triggerHovered = false;
        schedulePreviewClose();
    });
    previewTrigger.addEventListener("click", openPreview);
}

if (previewClose) {
    previewClose.addEventListener("click", closePreview);
}

if (previewPanel) {
    previewPanel.addEventListener("mouseenter", () => {
        panelHovered = true;
        clearPreviewCloseTimer();
    });
    previewPanel.addEventListener("mouseleave", () => {
        panelHovered = false;
        schedulePreviewClose();
    });
    previewPanel.addEventListener("click", (event) => {
        if (event.target === previewPanel) {
            closePreview();
        }
    });
}

document.addEventListener("keydown", (event) => {
    hasUserInteracted = true;
    if (event.key === "Escape") {
        closePreview();
    }
});

if (bgMusic) {
    setBackgroundMusicVolume(0);
    userMutedBackgroundMusic = false;
    bgMusic.muted = true;
    bgMusic.preload = "auto";
    syncMusicButton();
    syncVolumeControl();
    bgMusic.load();

    const attemptImmediateMusicStart = () => {
        bgMusic.play().catch(() => {});
    };

    if (document.readyState !== "loading") {
        attemptImmediateMusicStart();
    }

    window.addEventListener("DOMContentLoaded", () => {
        attemptImmediateMusicStart();
    });
    window.addEventListener("load", () => {
        attemptImmediateMusicStart();
    });
    window.addEventListener(
        "pageshow",
        () => {
            attemptImmediateMusicStart();
        },
        { once: true }
    );
    bgMusic.addEventListener(
        "canplaythrough",
        () => {
            attemptImmediateMusicStart();
        },
        { once: true }
    );

    ["pointerdown", "click", "keydown", "touchstart"].forEach((eventName) => {
        document.addEventListener(
            eventName,
            () => {
                if (hasActivatedAudio) {
                    return;
                }

                enableBackgroundMusic(true);
            },
            { once: true }
        );
    });
}

if (musicToggle && bgMusic) {
    musicToggle.addEventListener("click", () => {
        if (bgMusic.muted) {
            enableBackgroundMusic(false);
        } else {
            disableBackgroundMusic();
        }
    });
}

if (volumeControl && bgMusic) {
    volumeControl.addEventListener("input", () => {
        const nextVolume = Number(volumeControl.value) / 100;
        setBackgroundMusicVolume(nextVolume);

        if (nextVolume <= 0) {
            userMutedBackgroundMusic = true;
            bgMusic.muted = true;
        } else if (bgMusic.muted) {
            userMutedBackgroundMusic = false;
            bgMusic.muted = false;
            hasActivatedAudio = true;
            hasUserInteracted = true;
            bgMusic.play().catch(() => {});
        } else {
            userMutedBackgroundMusic = false;
        }

        syncMusicButton();
    });
}

if (startupOk && startupNotice) {
    startupOk.addEventListener("click", () => {
        startupNotice.classList.add("hidden");
        enableBackgroundMusic(true);
    });
}

if (previewVideo) {
    previewVideo.addEventListener("play", pauseBackgroundMusicForPreview);
    previewVideo.addEventListener("ended", resumeBackgroundMusicIfNeeded);
    previewVideo.addEventListener("pause", () => {
        if (!previewOpen) {
            resumeBackgroundMusicIfNeeded();
        }
    });
}

if (bgMusic) {
    bgMusic.addEventListener("ended", () => {
        bgMusic.currentTime = 0;
        playBackgroundMusic();
    });

    bgMusic.addEventListener("pause", () => {
        setTimeout(() => {
            if (shouldKeepBackgroundMusicPlaying() && bgMusic.paused) {
                playBackgroundMusic();
            }
        }, 250);
    });

    setInterval(() => {
        if (shouldKeepBackgroundMusicPlaying() && bgMusic.paused) {
            playBackgroundMusic();
        }
    }, 2000);
}

window.addEventListener("resize", initParticles);

initParticles();
animateParticles();
