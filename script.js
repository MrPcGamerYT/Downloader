const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let mouse = { x: -300, y: -300, radius: 180 };

/* 🔥 SMOOTH MOUSE TRACKING */
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

/* 🔥 PARTICLE CLASS */
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = this.x;
        this.baseY = this.y;

        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;

        this.size = Math.random() * 2;
        this.density = (Math.random() * 30) + 5;
    }

    draw() {
        /* 🔥 GLOW EFFECT */
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00f2ff";

        ctx.fillStyle = "rgba(0, 242, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    update() {
        /* 🔥 FLOATING MOVEMENT */
        this.baseX += this.vx;
        this.baseY += this.vy;

        if (this.baseX < 0 || this.baseX > canvas.width) this.vx *= -1;
        if (this.baseY < 0 || this.baseY > canvas.height) this.vy *= -1;

        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            let force = (mouse.radius - distance) / mouse.radius;

            let dirX = (dx / distance) * force * this.density;
            let dirY = (dy / distance) * force * this.density;

            this.x -= dirX;
            this.y -= dirY;
        } else {
            /* 🔥 SMOOTH RETURN */
            this.x += (this.baseX - this.x) * 0.04;
            this.y += (this.baseY - this.y) * 0.04;
        }
    }
}

/* 🔥 INIT */
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particles = [];

    /* 🔥 AUTO PARTICLE COUNT BASED ON SCREEN */
    let count = Math.floor((canvas.width * canvas.height) / 20000);
    count = Math.min(count, 120); // limit

    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

/* 🔥 CONNECT LINES */
function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = dx * dx + dy * dy;

            if (distance < 20000) {
                ctx.strokeStyle = `rgba(0,242,255,${0.15 - distance / 200000})`;
                ctx.lineWidth = 0.6;

                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

/* 🔥 ANIMATE */
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let p of particles) {
        p.update();
        p.draw();
    }

    connectParticles();

    requestAnimationFrame(animate);
}

/* 🔥 PRO NAV SYSTEM (WITH ACTIVE CLASS) */
function nav(id) {
    document.querySelectorAll('.main-frame').forEach(p => {
        p.classList.remove('active');
    });

    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}

/* 🔥 AUTO HIDE BACK BUTTON */
document.querySelectorAll('.view-panel').forEach(panel => {
    const backBtn = panel.querySelector('.back-btn');
    if (!backBtn) return;

    let lastScroll = 0;

    panel.addEventListener('scroll', () => {
        let currentScroll = panel.scrollTop;

        if (currentScroll > lastScroll && currentScroll > 50) {
            backBtn.style.opacity = "0";
            backBtn.style.transform = "translateY(-20px)";
        } else {
            backBtn.style.opacity = "1";
            backBtn.style.transform = "translateY(0)";
        }

        lastScroll = currentScroll;
    });
});

/* 🔥 RESIZE FIX */
window.addEventListener('resize', init);

/* 🔥 START */
init();
animate();
