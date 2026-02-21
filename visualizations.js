const VIZ = {
    particleCanvas: null,
    particleCtx: null,
    particles: [],
    gaugeCanvas: null,
    gaugeCtx: null,
    spectroCanvas: null,
    spectroCtx: null,
    spectroData: [],
    animFrameId: null,

    initParticles() {
        this.particleCanvas = document.getElementById('particleBg');
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.resizeParticleCanvas();
        window.addEventListener('resize', () => this.resizeParticleCanvas());
        for (let i = 0; i < 60; i++) {
            this.particles.push(this.createParticle());
        }
        this.animateParticles();
    },

    resizeParticleCanvas() {
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = window.innerHeight;
    },

    createParticle() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.3 + 0.05,
            color: Math.random() > 0.7 ? '#0055ff' : '#00d4ff'
        };
    },

    animateParticles() {
        const ctx = this.particleCtx;
        const w = this.particleCanvas.width;
        const h = this.particleCanvas.height;
        ctx.clearRect(0, 0, w, h);

        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
        });

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    ctx.strokeStyle = '#00d4ff';
                    ctx.globalAlpha = 0.03 * (1 - dist / 120);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(() => this.animateParticles());
    },

    initGauge() {
        this.gaugeCanvas = document.getElementById('gaugeCanvas');
        this.gaugeCtx = this.gaugeCanvas.getContext('2d');
        this.drawGauge(0);
    },

    drawGauge(value, animated = false) {
        const ctx = this.gaugeCtx;
        const canvas = this.gaugeCanvas;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = 90;
        const startAngle = 0.75 * Math.PI;
        const endAngle = 2.25 * Math.PI;
        const totalAngle = endAngle - startAngle;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.strokeStyle = '#1e1e2e';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();

        const valAngle = startAngle + (value / 100) * totalAngle;
        let color;
        if (value <= 30) color = '#2ed573';
        else if (value <= 70) color = '#ffa502';
        else color = '#ff4757';

        const grad = ctx.createLinearGradient(
            cx + r * Math.cos(startAngle), cy + r * Math.sin(startAngle),
            cx + r * Math.cos(valAngle), cy + r * Math.sin(valAngle)
        );
        if (value <= 30) { grad.addColorStop(0, '#2ed573'); grad.addColorStop(1, '#00d4ff'); }
        else if (value <= 70) { grad.addColorStop(0, '#2ed573'); grad.addColorStop(0.5, '#ffa502'); grad.addColorStop(1, '#ffa502'); }
        else { grad.addColorStop(0, '#2ed573'); grad.addColorStop(0.3, '#ffa502'); grad.addColorStop(1, '#ff4757'); }

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, valAngle);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        const dotX = cx + r * Math.cos(valAngle);
        const dotY = cy + r * Math.sin(valAngle);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let i = 0; i <= 10; i++) {
            const a = startAngle + (i / 10) * totalAngle;
            const inner = r - 20;
            const outer = r - 14;
            ctx.beginPath();
            ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
            ctx.lineTo(cx + outer * Math.cos(a), cy + outer * Math.sin(a));
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    },

    animateGauge(targetValue) {
        const el = document.getElementById('gaugeValue');
        let current = 0;
        const duration = 2000;
        const start = performance.now();

        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            current = Math.round(eased * targetValue);
            this.drawGauge(current);
            el.textContent = current + '%';

            let color;
            if (current <= 30) color = '#2ed573';
            else if (current <= 70) color = '#ffa502';
            else color = '#ff4757';
            el.style.color = color;

            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    },

    initSpectrogram() {
        this.spectroCanvas = document.getElementById('spectrogramCanvas');
        this.spectroCtx = this.spectroCanvas.getContext('2d');
        this.spectroCanvas.width = this.spectroCanvas.clientWidth * 2;
        this.spectroCanvas.height = 300;
        this.spectroData = [];
    },

    drawStaticSpectrogram(anomalyRegions = []) {
        if (!this.spectroCtx) this.initSpectrogram();
        const ctx = this.spectroCtx;
        const w = this.spectroCanvas.width;
        const h = this.spectroCanvas.height;
        ctx.clearRect(0, 0, w, h);

        const cols = 200;
        const rows = 64;
        const colW = w / cols;
        const rowH = h / rows;

        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                const freq = 1 - y / rows;
                let base = Math.pow(freq, 2) * 0.6;
                base += Math.sin(x * 0.1 + y * 0.3) * 0.15;
                base += Math.random() * 0.1;

                const isAnomalyRegion = anomalyRegions.some(r => x >= r.start && x <= r.end);
                if (isAnomalyRegion && y > rows * 0.6) {
                    base = Math.max(0.05, base * 0.2);
                }

                base = Math.max(0, Math.min(1, base));

                let r, g, b;
                if (base < 0.2) { r = 0; g = 0; b = Math.floor(base * 5 * 80); }
                else if (base < 0.5) { r = 0; g = Math.floor((base - 0.2) * 3.3 * 180); b = 100; }
                else if (base < 0.8) { r = Math.floor((base - 0.5) * 3.3 * 255); g = 180; b = 50; }
                else { r = 255; g = Math.floor((1 - base) * 5 * 200); b = 0; }

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x * colW, y * rowH, colW + 1, rowH + 1);
            }
        }

        anomalyRegions.forEach(region => {
            const rx = region.start * colW;
            const rw = (region.end - region.start) * colW;
            ctx.strokeStyle = 'rgba(255,71,87,0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(rx, 0, rw, h);
            ctx.setLineDash([]);

            ctx.fillStyle = 'rgba(255,71,87,0.7)';
            ctx.font = '10px Inter';
            ctx.fillText(region.label, rx + 4, 14);
        });
    },

    drawLiveSpectrogram(analyser) {
        if (!analyser) return;
        const ctx = this.spectroCtx;
        const w = this.spectroCanvas.width;
        const h = this.spectroCanvas.height;
        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(data);

        const imgData = ctx.getImageData(1, 0, w - 1, h);
        ctx.putImageData(imgData, 0, 0);
        ctx.clearRect(w - 1, 0, 1, h);

        const sliceH = h / bufLen;
        for (let i = 0; i < bufLen; i++) {
            const val = data[i] / 255;
            let r, g, b;
            if (val < 0.2) { r = 0; g = 0; b = Math.floor(val * 5 * 80); }
            else if (val < 0.5) { r = 0; g = Math.floor((val - 0.2) * 3.3 * 180); b = 100; }
            else if (val < 0.8) { r = Math.floor((val - 0.5) * 3.3 * 255); g = 180; b = 50; }
            else { r = 255; g = Math.floor((1 - val) * 5 * 200); b = 0; }
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(w - 1, h - (i + 1) * sliceH, 1, sliceH);
        }
    },

    drawOverlay(canvas, video, anomalies, currentTime) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || canvas.clientWidth;
        canvas.height = video.videoHeight || canvas.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const frameAnomalies = anomalies.filter(a => {
            if (!a.time) return false;
            return Math.abs(a.time - currentTime) < 0.15;
        });

        frameAnomalies.forEach(a => {
            if (a.region) {
                const { x, y, w, h } = a.region;
                const rx = x * canvas.width, ry = y * canvas.height;
                const rw = w * canvas.width, rh = h * canvas.height;
                let color = a.severity === 'critical' ? '#ff4757' : a.severity === 'warning' ? '#ffa502' : '#00d4ff';

                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 3]);
                ctx.strokeRect(rx, ry, rw, rh);
                ctx.setLineDash([]);

                ctx.fillStyle = color + '15';
                ctx.fillRect(rx, ry, rw, rh);

                ctx.fillStyle = color;
                ctx.font = '11px Inter';
                const labelW = ctx.measureText(a.shortLabel).width + 12;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(rx, ry - 18, labelW, 18);
                ctx.fillStyle = color;
                ctx.fillText(a.shortLabel, rx + 6, ry - 5);
            }
        });
    },

    drawHeatmap(canvas, video, heatmapData) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || canvas.clientWidth;
        canvas.height = video.videoHeight || canvas.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!heatmapData || !heatmapData.length) return;

        heatmapData.forEach(point => {
            const grd = ctx.createRadialGradient(
                point.x * canvas.width, point.y * canvas.height, 0,
                point.x * canvas.width, point.y * canvas.height, point.r * canvas.width
            );
            grd.addColorStop(0, `rgba(255,71,87,${point.intensity * 0.6})`);
            grd.addColorStop(0.5, `rgba(255,165,2,${point.intensity * 0.3})`);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
    },

    animateMetric(elementId, targetVal, suffix = '%') {
        const el = document.getElementById(elementId);
        const fill = document.getElementById(elementId.replace('Val', ''));
        let current = 0;
        const duration = 1500;
        const start = performance.now();

        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            current = Math.round(eased * targetVal);
            if (el) el.textContent = current + suffix;
            if (fill) fill.style.width = current + '%';
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    },

    createScanParticles(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const interval = setInterval(() => {
            const p = document.createElement('span');
            p.style.cssText = `
                position:absolute;width:3px;height:3px;border-radius:50%;
                background:#00d4ff;left:${Math.random()*100}%;top:50%;
                animation:scanPFloat ${0.5+Math.random()*1}s ease-out forwards;
                pointer-events:none;
            `;
            container.appendChild(p);
            setTimeout(() => p.remove(), 1500);
        }, 80);
        return interval;
    }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes scanPFloat{
    0%{opacity:1;transform:translateY(0) scale(1)}
    100%{opacity:0;transform:translateY(-20px) scale(0)}
}`;
document.head.appendChild(styleSheet);

VIZ.initParticles();
