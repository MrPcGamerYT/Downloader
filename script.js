const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: -300, y: -300, radius: 200 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.vx = (Math.random() - 0.5) * 0.18; 
        this.vy = (Math.random() - 0.5) * 0.18;
        this.size = Math.random() * 1.8;
        this.density = (Math.random() * 25) + 5;
    }

    draw() {
        ctx.fillStyle = "rgba(0, 242, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
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
            this.x += (this.baseX - this.x) * 0.05;
            this.y += (this.baseY - this.y) * 0.05;
        }
    }
}

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 65; i++) particles.push(new Particle());
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
            let d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
            if (d < 160) {
                ctx.strokeStyle = `rgba(0, 242, 255, ${0.12 - d/1200})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}

function nav(id) {
    document.querySelectorAll('.main-frame').forEach(p => p.style.display = 'none');
    const target = document.getElementById(id);
    if(target) target.style.display = 'block';
}

/* ✅ Auto hide back button on scroll */
document.querySelectorAll('.view-panel').forEach(panel => {
    const backBtn = panel.querySelector('.back-btn');

    if (!backBtn) return;

    let lastScroll = 0;

    panel.addEventListener('scroll', () => {
        let currentScroll = panel.scrollTop;

        if (currentScroll > lastScroll && currentScroll > 50) {
            // scrolling down
            backBtn.style.opacity = "0";
            backBtn.style.transform = "translateY(-20px)";
        } else {
            // scrolling up
            backBtn.style.opacity = "1";
            backBtn.style.transform = "translateY(0)";
        }

        lastScroll = currentScroll;
    });
});

/* 🔥 Show scrollbar while scrolling */
document.querySelectorAll('.view-panel').forEach(panel => {
    let scrollTimeout;

    panel.addEventListener('scroll', () => {
        panel.classList.add('scrolling');

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            panel.classList.remove('scrolling');
        }, 800);
    });
});

window.addEventListener('resize', init);
init();
animate();
