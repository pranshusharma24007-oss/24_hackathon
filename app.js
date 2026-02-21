const APP = {
    state: {
        videoFile: null,
        audioFile: null,
        isAnalyzing: false,
        isRecording: false,
        mediaRecorder: null,
        recordChunks: [],
        recordStartTime: 0,
        recordInterval: null,
        showOverlay: true,
        showHeatmap: false,
        analysisComplete: false,
        audioContext: null,
        analyser: null,
        startTime: 0,
        videoElement: null,
        demoMode: false
    },

    init() {
        this.bindUploadEvents();
        this.bindNavEvents();
        this.bindAnalysisEvents();
        this.bindResultsEvents();
        VIZ.initGauge();
    },

    bindUploadEvents() {
        const videoDropzone = document.getElementById('videoDropzone');
        const audioDropzone = document.getElementById('audioDropzone');
        const videoInput = document.getElementById('videoInput');
        const audioInput = document.getElementById('audioInput');

        ['dragover', 'dragenter'].forEach(e => {
            videoDropzone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); videoDropzone.classList.add('dragover'); });
            audioDropzone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); audioDropzone.classList.add('dragover'); });
        });
        ['dragleave'].forEach(e => {
            videoDropzone.addEventListener(e, () => videoDropzone.classList.remove('dragover'));
            audioDropzone.addEventListener(e, () => audioDropzone.classList.remove('dragover'));
        });

        videoDropzone.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); videoDropzone.classList.remove('dragover'); if (e.dataTransfer.files[0]) this.handleVideoFile(e.dataTransfer.files[0]); });
        audioDropzone.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); audioDropzone.classList.remove('dragover'); if (e.dataTransfer.files[0]) this.handleAudioFile(e.dataTransfer.files[0]); });

        videoDropzone.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            videoInput.value = '';
            videoInput.click();
        });
        audioDropzone.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            audioInput.value = '';
            audioInput.click();
        });

        videoInput.addEventListener('click', e => e.stopPropagation());
        audioInput.addEventListener('click', e => e.stopPropagation());

        videoInput.addEventListener('change', e => { if (e.target.files && e.target.files[0]) this.handleVideoFile(e.target.files[0]); });
        audioInput.addEventListener('change', e => { if (e.target.files && e.target.files[0]) this.handleAudioFile(e.target.files[0]); });

        document.getElementById('removeVideo').addEventListener('click', (e) => { e.stopPropagation(); this.removeVideo(); });
        document.getElementById('removeAudio').addEventListener('click', (e) => { e.stopPropagation(); this.removeAudio(); });
        document.getElementById('recordBtn').addEventListener('click', (e) => { e.stopPropagation(); this.toggleRecording(); });
        document.getElementById('loadDemoBtn').addEventListener('click', () => this.loadDemo());
        document.getElementById('analyzeBtn').addEventListener('click', () => this.startAnalysis());
    },

    handleVideoFile(file) {
        if (!file.type.startsWith('video/')) return;
        this.state.videoFile = file;
        const url = URL.createObjectURL(file);
        const preview = document.getElementById('previewVideo');
        preview.src = url;
        document.getElementById('videoDropzone').style.display = 'none';
        document.getElementById('videoPreview').style.display = 'block';
        this.updateAnalyzeBtn();
    },

    handleAudioFile(file) {
        if (!file.type.startsWith('audio/')) return;
        this.state.audioFile = file;
        const url = URL.createObjectURL(file);
        const preview = document.getElementById('previewAudio');
        preview.src = url;
        document.getElementById('audioDropzone').style.display = 'none';
        document.getElementById('audioPreview').style.display = 'block';
        this.updateAnalyzeBtn();
    },

    removeVideo() {
        this.state.videoFile = null;
        this.state.demoMode = false;
        document.getElementById('videoDropzone').style.display = 'block';
        document.getElementById('videoPreview').style.display = 'none';
        document.getElementById('previewVideo').src = '';
        this.updateAnalyzeBtn();
    },

    removeAudio() {
        this.state.audioFile = null;
        document.getElementById('audioDropzone').style.display = 'block';
        document.getElementById('audioPreview').style.display = 'none';
        document.getElementById('previewAudio').src = '';
        this.updateAnalyzeBtn();
    },

    updateAnalyzeBtn() {
        const btn = document.getElementById('analyzeBtn');
        btn.disabled = !this.state.videoFile && !this.state.audioFile && !this.state.demoMode;
    },

    async toggleRecording() {
        const btn = document.getElementById('recordBtn');
        const timer = document.getElementById('recordTimer');

        if (this.state.isRecording) {
            this.state.mediaRecorder.stop();
            btn.classList.remove('recording');
            btn.innerHTML = '<span class="record-dot"></span>Record Audio';
            this.state.isRecording = false;
            clearInterval(this.state.recordInterval);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.state.mediaRecorder = new MediaRecorder(stream);
            this.state.recordChunks = [];
            this.state.mediaRecorder.ondataavailable = e => this.state.recordChunks.push(e.data);
            this.state.mediaRecorder.onstop = () => {
                const blob = new Blob(this.state.recordChunks, { type: 'audio/webm' });
                const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
                this.handleAudioFile(file);
                stream.getTracks().forEach(t => t.stop());
            };

            this.state.mediaRecorder.start();
            this.state.isRecording = true;
            this.state.recordStartTime = Date.now();
            btn.classList.add('recording');
            btn.innerHTML = '<span class="record-dot"></span>Stop Recording';

            this.state.recordInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.state.recordStartTime) / 1000);
                const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const s = (elapsed % 60).toString().padStart(2, '0');
                timer.textContent = `${m}:${s}`;
                if (elapsed >= 60) this.toggleRecording();
            }, 1000);
        } catch (err) {
            console.error('Microphone access denied');
        }
    },

    loadDemo() {
        this.state.demoMode = true;
        this.state.videoFile = new Blob(['demo'], { type: 'video/mp4' });
        this.state.audioFile = new Blob(['demo'], { type: 'audio/mp3' });

        document.getElementById('videoDropzone').style.display = 'none';
        const vp = document.getElementById('videoPreview');
        vp.style.display = 'block';
        vp.innerHTML = `
            <div style="padding:32px;text-align:center;background:linear-gradient(135deg,#111,#1a1a2e);border-radius:8px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="1.5">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <div style="font-family:var(--font-display);color:#00d4ff;font-size:0.9rem;margin-top:12px;">DEMO VIDEO LOADED</div>
                <div style="color:#8888a0;font-size:0.8rem;margin-top:4px;">Synthetic face-swap sample (8.2s, 720p)</div>
            </div>`;

        document.getElementById('audioDropzone').style.display = 'none';
        const ap = document.getElementById('audioPreview');
        ap.style.display = 'block';
        ap.innerHTML = `
            <div style="padding:24px;text-align:center;background:linear-gradient(135deg,#111,#1a1a2e);border-radius:8px;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="1.5">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
                <div style="font-family:var(--font-display);color:#00d4ff;font-size:0.85rem;margin-top:8px;">DEMO AUDIO LOADED</div>
                <div style="color:#8888a0;font-size:0.75rem;margin-top:4px;">Voice-cloned speech sample (8.2s)</div>
            </div>`;

        this.updateAnalyzeBtn();
    },

    bindNavEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                if ((section === 'analysis' || section === 'results') && !this.state.analysisComplete) {
                    this.showNavTooltip(btn, 'Run analysis first');
                    return;
                }
                this.showSection(section);
            });
        });
    },

    showNavTooltip(btn, msg) {
        let tip = document.getElementById('navTooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'navTooltip';
            tip.style.cssText = 'position:fixed;padding:8px 16px;background:#ff4757;color:#fff;border-radius:8px;font-size:0.8rem;font-weight:500;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.3s;font-family:var(--font-body);white-space:nowrap;';
            document.body.appendChild(tip);
        }
        tip.textContent = msg;
        const rect = btn.getBoundingClientRect();
        tip.style.left = rect.left + rect.width / 2 - 60 + 'px';
        tip.style.top = rect.bottom + 8 + 'px';
        tip.style.opacity = '1';
        btn.style.animation = 'headShake 0.5s';
        setTimeout(() => { tip.style.opacity = '0'; btn.style.animation = ''; }, 1500);
    },

    showSection(name) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(name + 'Section').classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.nav-btn[data-section="${name}"]`).classList.add('active');
    },

    async startAnalysis() {
        if (this.state.isAnalyzing) return;
        this.state.isAnalyzing = true;
        this.state.startTime = performance.now();

        const contentBtn = document.querySelector('.btn-analyze-content');
        const loaderBtn = document.querySelector('.btn-analyze-loader');
        contentBtn.style.display = 'none';
        loaderBtn.style.display = 'flex';

        ['modBiometric', 'modGeometry', 'modTemporal', 'modAudio', 'modXai'].forEach(id => {
            document.getElementById(id).classList.remove('active', 'done');
        });
        document.getElementById('scanProgressFill').style.width = '0%';
        document.getElementById('scanPercent').textContent = '0%';

        this.showSection('analysis');
        document.getElementById('scanningOverlay').style.display = 'flex';
        document.getElementById('analysisSplit').style.display = 'none';

        const modules = ['modBiometric', 'modGeometry', 'modTemporal', 'modAudio', 'modXai'];
        const statuses = [
            'Analyzing biometric consistency...',
            'Scanning geometry & lighting artifacts...',
            'Verifying temporal synchronization...',
            'Processing audio spectrogram...',
            'Generating explainability report...'
        ];

        const particleInterval = VIZ.createScanParticles('scanParticles');

        for (let i = 0; i < modules.length; i++) {
            document.getElementById(modules[i]).classList.add('active');
            document.getElementById('scanStatus').textContent = statuses[i];

            const startPct = (i / modules.length) * 100;
            const endPct = ((i + 1) / modules.length) * 100;

            await this.animateProgress(startPct, endPct, 800 + Math.random() * 600);

            document.getElementById(modules[i]).classList.remove('active');
            document.getElementById(modules[i]).classList.add('done');
        }

        clearInterval(particleInterval);
        document.getElementById('scanPercent').textContent = '100%';
        document.getElementById('scanStatus').textContent = 'Analysis complete. Rendering results...';
        await this.sleep(500);

        const videoDuration = this.state.demoMode ? 8.2 : 10;
        const audioDuration = this.state.demoMode ? 8.2 : 10;
        FORENSICS.generateVideoAnalysis(videoDuration);
        FORENSICS.generateAudioAnalysis(audioDuration);
        FORENSICS.calculateOverallScore();

        document.getElementById('scanningOverlay').style.display = 'none';
        document.getElementById('analysisSplit').style.display = 'grid';
        this.state.analysisComplete = true;
        this.state.isAnalyzing = false;

        contentBtn.style.display = 'flex';
        loaderBtn.style.display = 'none';

        this.renderAnalysisResults(videoDuration);
        this.renderReportSection();
    },

    async animateProgress(from, to, duration) {
        const fill = document.getElementById('scanProgressFill');
        const pct = document.getElementById('scanPercent');
        const start = performance.now();

        return new Promise(resolve => {
            const tick = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const current = from + (to - from) * progress;
                fill.style.width = current + '%';
                pct.textContent = Math.round(current) + '%';
                if (progress < 1) requestAnimationFrame(tick);
                else resolve();
            };
            requestAnimationFrame(tick);
        });
    },

    renderAnalysisResults(duration) {
        VIZ.animateGauge(FORENSICS.scores.overall);

        const verdict = FORENSICS.getVerdict();
        const badge = document.getElementById('verdictBadge');
        badge.textContent = verdict.level.toUpperCase();
        badge.style.background = verdict.color + '22';
        badge.style.color = verdict.color;

        VIZ.animateMetric('metricBioVal', FORENSICS.scores.biometric);
        VIZ.animateMetric('metricGeoVal', FORENSICS.scores.geometry);
        VIZ.animateMetric('metricTempVal', FORENSICS.scores.temporal);
        VIZ.animateMetric('metricAudVal', FORENSICS.scores.audio);

        const allAnomalies = [...FORENSICS.videoAnomalies, ...FORENSICS.audioAnomalies];
        document.getElementById('anomalyCount').textContent = allAnomalies.length + ' issues';

        const anomalyList = document.getElementById('anomalyList');
        anomalyList.innerHTML = '';
        allAnomalies.forEach((a, i) => {
            setTimeout(() => {
                const item = document.createElement('div');
                item.className = `anomaly-item ${a.severity}`;
                item.innerHTML = `
                    <span class="anomaly-severity">${a.severity}</span>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${a.title}</div>
                        <div class="anomaly-detail">${a.location} • ${a.detail}</div>
                    </div>`;
                if (a.time !== undefined) {
                    item.addEventListener('click', () => this.seekToAnomaly(a));
                }
                anomalyList.appendChild(item);
                anomalyList.scrollTop = anomalyList.scrollHeight;
            }, i * 200);
        });

        this.renderTimelineFlags(allAnomalies, duration);
        this.renderDemoVideo(duration);

        VIZ.initSpectrogram();
        const regions = FORENSICS.getSpectrogramAnomalyRegions(duration);
        VIZ.drawStaticSpectrogram(regions);

        document.getElementById('frameCounter').textContent = `Frame: 0 / ${Math.floor(duration * 30)}`;
    },

    renderTimelineFlags(anomalies, duration) {
        const container = document.getElementById('timelineFlags');
        container.innerHTML = '';
        anomalies.forEach(a => {
            if (a.time === undefined) return;
            const pct = (a.time / duration) * 100;
            const flag = document.createElement('div');
            flag.className = 'timeline-flag';
            flag.style.left = pct + '%';
            flag.title = a.title;
            if (a.severity === 'warning') flag.style.background = '#ffa502';
            if (a.severity === 'info') flag.style.background = '#00d4ff';
            flag.addEventListener('click', () => this.seekToAnomaly(a));
            container.appendChild(flag);
        });
    },

    renderDemoVideo(duration) {
        const container = document.getElementById('analysisVideoContainer');
        const video = document.getElementById('analysisVideo');
        const overlay = document.getElementById('overlayCanvas');

        if (this.state.demoMode) {
            video.style.display = 'none';
            let demoCanvas = document.getElementById('demoVideoCanvas');
            if (!demoCanvas) {
                demoCanvas = document.createElement('canvas');
                demoCanvas.id = 'demoVideoCanvas';
                demoCanvas.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;';
                container.insertBefore(demoCanvas, overlay);
            }
            demoCanvas.width = 640;
            demoCanvas.height = 360;
            this.animateDemoVideo(demoCanvas, overlay, duration);
        }
    },

    animateDemoVideo(canvas, overlay, duration) {
        const ctx = canvas.getContext('2d');
        let time = 0;
        const fps = 30;
        const frameTime = 1000 / fps;
        const totalFrames = Math.floor(duration * fps);

        const drawFrame = () => {
            if (!this.state.analysisComplete) return;
            ctx.fillStyle = '#0a0a12';
            ctx.fillRect(0, 0, 640, 360);

            const cx = 320, cy = 150;

            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 240, 640, 120);

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
            grad.addColorStop(0, '#1e1e3a');
            grad.addColorStop(1, '#0a0a12');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 640, 240);

            ctx.fillStyle = '#2a2a4a';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 90, 50, 70, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3a3a5a';
            ctx.beginPath();
            ctx.arc(cx, cy - 20, 45, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4a4a6a';
            ctx.beginPath();
            ctx.arc(cx, cy - 20, 40, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#252540';
            ctx.beginPath();
            ctx.arc(cx - 15, cy - 28, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 15, cy - 28, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#5a5a8a';
            ctx.beginPath();
            ctx.arc(cx - 15, cy - 28, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 15, cy - 28, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#353555';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 4, 2 + Math.sin(time * 3) * 1, 0, 0, Math.PI * 2);
            ctx.fill();

            const glitchIntensity = Math.sin(time * 2) * 0.5 + 0.5;
            if (glitchIntensity > 0.8) {
                ctx.fillStyle = `rgba(255,71,87,${(glitchIntensity - 0.8) * 0.3})`;
                ctx.fillRect(200, cy + 40, 240, 2);
            }

            ctx.fillStyle = '#00d4ff';
            ctx.font = '10px JetBrains Mono';
            ctx.fillText(`T: ${time.toFixed(2)}s`, 10, 20);
            ctx.fillText(`F: ${Math.floor(time * fps)}`, 10, 35);

            if (this.state.showOverlay) {
                overlay.width = 640;
                overlay.height = 360;
                VIZ.drawOverlay(overlay, { videoWidth: 640, videoHeight: 360 }, FORENSICS.videoAnomalies, time);
            }

            if (this.state.showHeatmap) {
                overlay.width = 640;
                overlay.height = 360;
                VIZ.drawHeatmap(overlay, { videoWidth: 640, videoHeight: 360 }, FORENSICS.heatmapData);
            }

            const frame = Math.floor(time * fps);
            document.getElementById('frameCounter').textContent = `Frame: ${frame} / ${totalFrames}`;
            const tProg = document.getElementById('timelineProgress');
            const tCursor = document.getElementById('timelineCursor');
            const pct = (time / duration) * 100;
            tProg.style.width = pct + '%';
            tCursor.style.left = pct + '%';
            document.getElementById('timeDisplay').textContent = `${this.formatTimeDisplay(time)} / ${this.formatTimeDisplay(duration)}`;

            time += frameTime / 1000;
            if (time >= duration) time = 0;
            this.state.demoAnimId = requestAnimationFrame(drawFrame);
        };

        drawFrame();
    },

    seekToAnomaly(anomaly) {
        if (anomaly.time !== undefined) {
            const duration = 8.2;
            const pct = (anomaly.time / duration) * 100;
            document.getElementById('timelineProgress').style.width = pct + '%';
            document.getElementById('timelineCursor').style.left = pct + '%';
        }
    },

    bindAnalysisEvents() {
        document.getElementById('toggleOverlay').addEventListener('click', function () {
            APP.state.showOverlay = !APP.state.showOverlay;
            APP.state.showHeatmap = false;
            this.classList.toggle('active', APP.state.showOverlay);
            document.getElementById('toggleHeatmap').classList.remove('active');
        });
        document.getElementById('toggleHeatmap').addEventListener('click', function () {
            APP.state.showHeatmap = !APP.state.showHeatmap;
            APP.state.showOverlay = false;
            this.classList.toggle('active', APP.state.showHeatmap);
            document.getElementById('toggleOverlay').classList.remove('active');
        });

        document.getElementById('timelineTrack').addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            document.getElementById('timelineProgress').style.width = pct + '%';
            document.getElementById('timelineCursor').style.left = pct + '%';
        });
    },

    renderReportSection() {
        const verdict = FORENSICS.getVerdict();
        const icon = document.getElementById('verdictIcon');
        icon.className = 'verdict-icon ' + verdict.level;
        icon.textContent = verdict.icon;
        document.getElementById('verdictTitle').textContent = verdict.title;
        document.getElementById('verdictSubtitle').textContent = verdict.subtitle;
        const score = document.getElementById('verdictScore');
        score.textContent = FORENSICS.scores.overall + '%';
        score.style.color = verdict.color;

        document.getElementById('summaryContent').innerHTML = '<p>' + FORENSICS.getSummaryText() + '</p>';

        const tbody = document.getElementById('resultsTableBody');
        tbody.innerHTML = '';
        const allAnomalies = [...FORENSICS.videoAnomalies, ...FORENSICS.audioAnomalies];
        allAnomalies.sort((a, b) => {
            const sev = { critical: 0, warning: 1, info: 2 };
            return (sev[a.severity] || 2) - (sev[b.severity] || 2);
        });

        allAnomalies.forEach(a => {
            const row = document.createElement('tr');
            row.dataset.severity = a.severity;
            row.innerHTML = `
                <td><strong>${a.title}</strong></td>
                <td style="font-family:var(--font-mono);font-size:0.8rem;">${a.location}</td>
                <td><span class="severity-badge ${a.severity}">${a.severity}</span></td>
                <td style="font-family:var(--font-mono);">${a.confidence}%</td>
                <td style="font-size:0.8rem;color:var(--text-muted);">${a.detail}</td>`;
            tbody.appendChild(row);
        });

        const elapsed = ((performance.now() - this.state.startTime) / 1000).toFixed(1);
        document.getElementById('techFrames').textContent = Math.floor(8.2 * 30) + ' frames';
        document.getElementById('techSamples').textContent = Math.floor(8.2 * 44100).toLocaleString() + ' samples';
        document.getElementById('techTime').textContent = elapsed + 's';

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const sev = this.dataset.severity;
                document.querySelectorAll('#resultsTableBody tr').forEach(row => {
                    row.style.display = (sev === 'all' || row.dataset.severity === sev) ? '' : 'none';
                });
            });
        });
    },

    bindResultsEvents() {
        document.getElementById('exportBtn').addEventListener('click', () => {
            const report = FORENSICS.exportReport();
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `deepshield-report-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        document.getElementById('newAnalysisBtn').addEventListener('click', () => {
            this.state.analysisComplete = false;
            this.state.demoMode = false;
            this.state.videoFile = null;
            this.state.audioFile = null;
            if (this.state.demoAnimId) cancelAnimationFrame(this.state.demoAnimId);

            document.getElementById('videoDropzone').style.display = 'block';
            document.getElementById('videoPreview').style.display = 'none';
            document.getElementById('audioDropzone').style.display = 'block';
            document.getElementById('audioPreview').style.display = 'none';
            document.getElementById('analyzeBtn').disabled = true;

            const contentBtn = document.querySelector('.btn-analyze-content');
            const loaderBtn = document.querySelector('.btn-analyze-loader');
            contentBtn.style.display = 'flex';
            loaderBtn.style.display = 'none';

            document.getElementById('anomalyList').innerHTML = '';
            document.getElementById('anomalyCount').textContent = '0 issues';
            document.getElementById('gaugeValue').textContent = '--';
            document.getElementById('gaugeValue').style.color = '';
            VIZ.drawGauge(0);

            ['modBiometric', 'modGeometry', 'modTemporal', 'modAudio', 'modXai'].forEach(id => {
                const el = document.getElementById(id);
                el.classList.remove('active', 'done');
            });
            document.getElementById('scanProgressFill').style.width = '0%';
            document.getElementById('scanPercent').textContent = '0%';

            this.showSection('upload');
        });
    },

    formatTimeDisplay(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    },

    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => APP.init());
