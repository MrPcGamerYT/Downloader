const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: -300, y: -300, radius: 200 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
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
        // Floating movement
        this.baseX += this.vx;
        this.baseY += this.vy;
        
        // Bounce off walls
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
            // Return to base position smoothly
            this.x += (this.baseX - this.x) * 0.05;
            this.y += (this.baseY - this.y) * 0.05;
        }
    }
}

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    // 65 particles is perfect for performance
    for (let i = 0; i < 65; i++) particles.push(new Particle());
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        // Drawing lines between particles
        for (let j = i + 1; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let d = Math.sqrt(dx * dx + dy * dy);
            
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

// ✅ FIXED NAV FUNCTION: Resets scroll and Back Button visibility
function nav(id) {
    document.querySelectorAll('.main-frame').forEach(p => {
        p.style.display = 'none';
        // Reset scroll to top when leaving a view
        if(p.classList.contains('view-panel')) p.scrollTop = 0;
    });

    const target = document.getElementById(id);
    if(target) {
        target.style.display = 'block';
        
        // If target is a panel, make sure the back button is visible immediately
        const btn = target.querySelector('.back-btn');
        if(btn) btn.classList.remove('hidden');
    }
}

// ✅ AUTO-HIDE LOGIC FOR BACK BUTTON
document.querySelectorAll('.view-panel').forEach(panel => {
    let lastScrollTop = 0;
    
    panel.addEventListener('scroll', () => {
        const backBtn = panel.querySelector('.back-btn');
        if (!backBtn) return;

        let scrollTop = panel.scrollTop;

        // Hide if scrolling down more than 50px, show if scrolling up
        if (scrollTop > lastScrollTop && scrollTop > 50) {
            backBtn.classList.add('hidden');
        } else {
            backBtn.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; 
    }, { passive: true });
});

window.addEventListener('resize', init);
init();
animate();
