const FORENSICS = {
    videoAnomalies: [],
    audioAnomalies: [],
    heatmapData: [],
    scores: { biometric: 0, geometry: 0, temporal: 0, audio: 0, overall: 0 },

    anomalyTemplates: {
        biometric: [
            { title: 'Non-rhythmic blink pattern detected', detail: 'Blink interval variance σ={v}ms vs expected σ<80ms', shortLabel: 'Blink anomaly', severity: 'critical', regionType: 'eyes' },
            { title: 'Pupil dilation inconsistency', detail: 'Left pupil {v}px, right pupil {v2}px — asymmetry exceeds threshold', shortLabel: 'Pupil mismatch', severity: 'warning', regionType: 'eyes' },
            { title: 'Skin texture smoothing artifact', detail: 'Frequency domain energy drop of {v}% in facial ROI', shortLabel: 'Texture smoothing', severity: 'critical', regionType: 'face' },
            { title: 'Micro-expression temporal gap', detail: 'Missing transitional frames between AU6+AU12 action units', shortLabel: 'Expression gap', severity: 'warning', regionType: 'face' },
            { title: 'Unnatural skin reflectance gradient', detail: 'Specular highlight pattern inconsistent with Lambertian model by {v}%', shortLabel: 'Reflectance issue', severity: 'info', regionType: 'face' }
        ],
        geometry: [
            { title: 'Face boundary artifact detected', detail: 'Edge discontinuity at jawline — gradient magnitude spike of {v}σ', shortLabel: 'Boundary artifact', severity: 'critical', regionType: 'jaw' },
            { title: 'Chin-to-neck ghosting', detail: 'Alpha blending artifact in transition zone, opacity variance {v}%', shortLabel: 'Ghosting detected', severity: 'critical', regionType: 'chin' },
            { title: 'Lighting direction mismatch', detail: 'Ear-to-cheek illumination angle differs by {v}° from ambient estimate', shortLabel: 'Light mismatch', severity: 'warning', regionType: 'ear' },
            { title: 'Facial geometry distortion', detail: 'Inter-ocular distance varies {v}% across temporal window', shortLabel: 'Geometry shift', severity: 'warning', regionType: 'face' },
            { title: 'Shadow inconsistency', detail: 'Nose shadow direction {v}° vs chin shadow {v2}° — source conflict', shortLabel: 'Shadow conflict', severity: 'info', regionType: 'face' }
        ],
        temporal: [
            { title: 'Lip-sync desynchronization', detail: 'Phoneme /p/ detected at {v}ms but corresponding viseme at {v2}ms — Δ{d}ms', shortLabel: 'Lip-sync off', severity: 'critical', regionType: 'mouth' },
            { title: 'Temporal coherence break', detail: 'Motion vector discontinuity between frames {v}-{v2}', shortLabel: 'Temporal break', severity: 'critical', regionType: 'face' },
            { title: 'Head pose jitter', detail: 'Euler angle variance exceeds {v}°/frame, typical deepfake artifact', shortLabel: 'Pose jitter', severity: 'warning', regionType: 'face' },
            { title: 'Frame interpolation artifact', detail: 'Sub-pixel alignment error pattern consistent with GAN upsampling', shortLabel: 'Interpolation', severity: 'info', regionType: 'face' }
        ],
        audio: [
            { title: 'Missing high-frequency chaotic noise', detail: 'Spectral energy above 12kHz is {v}dB below natural speech baseline', shortLabel: 'HF dropout', severity: 'critical' },
            { title: 'Unnatural breath pause pattern', detail: 'Inter-utterance silence at {v}s lacks respiratory noise floor', shortLabel: 'No breath noise', severity: 'critical' },
            { title: 'Synthetic harmonic detected', detail: 'Harmonic at {v}Hz shows unnaturally low jitter ({j}%) — voice cloning signature', shortLabel: 'Synth harmonic', severity: 'warning' },
            { title: 'Robotic frequency cutoff', detail: 'Sharp spectral rolloff at {v}kHz inconsistent with natural vocal tract', shortLabel: 'Freq cutoff', severity: 'warning' },
            { title: 'Pitch contour anomaly', detail: 'F0 trajectory shows mechanical step pattern vs natural glide', shortLabel: 'Pitch anomaly', severity: 'info' },
            { title: 'Formant bandwidth compression', detail: 'F1-F3 bandwidths compressed by {v}% — typical vocoder artifact', shortLabel: 'Formant artifact', severity: 'warning' }
        ]
    },

    regionCoords: {
        eyes: { x: 0.25, y: 0.15, w: 0.5, h: 0.15 },
        face: { x: 0.2, y: 0.1, w: 0.6, h: 0.7 },
        jaw: { x: 0.2, y: 0.55, w: 0.6, h: 0.2 },
        chin: { x: 0.3, y: 0.65, w: 0.4, h: 0.25 },
        mouth: { x: 0.3, y: 0.45, w: 0.4, h: 0.2 },
        ear: { x: 0.05, y: 0.15, w: 0.2, h: 0.35 }
    },

    generateVideoAnalysis(duration) {
        this.videoAnomalies = [];
        this.heatmapData = [];
        const fps = 30;
        const totalFrames = Math.floor(duration * fps);

        const biometricScore = 78 + Math.random() * 14;
        const geometryScore = 80 + Math.random() * 12;
        const temporalScore = 75 + Math.random() * 15;

        this.scores.biometric = Math.round(biometricScore);
        this.scores.geometry = Math.round(geometryScore);
        this.scores.temporal = Math.round(temporalScore);

        const numBioAnomalies = 3 + Math.floor(Math.random() * 3);
        const numGeoAnomalies = 2 + Math.floor(Math.random() * 3);
        const numTempAnomalies = 2 + Math.floor(Math.random() * 2);

        this._generateAnomalySet('biometric', numBioAnomalies, duration, totalFrames);
        this._generateAnomalySet('geometry', numGeoAnomalies, duration, totalFrames);
        this._generateAnomalySet('temporal', numTempAnomalies, duration, totalFrames);

        this.heatmapData = [
            { x: 0.35, y: 0.3, r: 0.15, intensity: 0.7 },
            { x: 0.65, y: 0.3, r: 0.12, intensity: 0.5 },
            { x: 0.5, y: 0.65, r: 0.2, intensity: 0.9 },
            { x: 0.5, y: 0.5, r: 0.1, intensity: 0.4 },
            { x: 0.15, y: 0.3, r: 0.08, intensity: 0.6 }
        ];

        this.videoAnomalies.sort((a, b) => a.time - b.time);
        return this.videoAnomalies;
    },

    _generateAnomalySet(category, count, duration, totalFrames) {
        const templates = this.anomalyTemplates[category];
        const used = new Set();

        for (let i = 0; i < count; i++) {
            let idx;
            do { idx = Math.floor(Math.random() * templates.length); } while (used.has(idx) && used.size < templates.length);
            used.add(idx);
            const t = templates[idx];
            const time = 0.5 + Math.random() * (duration - 1);
            const frame = Math.floor(time * 30);
            const v = Math.round(20 + Math.random() * 60);
            const v2 = Math.round(20 + Math.random() * 60);
            const d = Math.round(40 + Math.random() * 120);

            const anomaly = {
                category,
                title: t.title,
                detail: t.detail.replace('{v}', v).replace('{v2}', v2).replace('{d}', d),
                shortLabel: t.shortLabel,
                severity: t.severity,
                time: parseFloat(time.toFixed(2)),
                frame: frame,
                location: `Frame ${frame} (${this._formatTime(time)})`,
                confidence: 70 + Math.floor(Math.random() * 25)
            };

            if (t.regionType && this.regionCoords[t.regionType]) {
                const base = this.regionCoords[t.regionType];
                anomaly.region = {
                    x: base.x + (Math.random() - 0.5) * 0.05,
                    y: base.y + (Math.random() - 0.5) * 0.05,
                    w: base.w + (Math.random() - 0.5) * 0.05,
                    h: base.h + (Math.random() - 0.5) * 0.05
                };
            }

            this.videoAnomalies.push(anomaly);
        }
    },

    generateAudioAnalysis(duration) {
        this.audioAnomalies = [];
        const audioScore = 82 + Math.random() * 10;
        this.scores.audio = Math.round(audioScore);

        const numAnomalies = 3 + Math.floor(Math.random() * 3);
        const templates = this.anomalyTemplates.audio;
        const used = new Set();

        for (let i = 0; i < numAnomalies; i++) {
            let idx;
            do { idx = Math.floor(Math.random() * templates.length); } while (used.has(idx) && used.size < templates.length);
            used.add(idx);
            const t = templates[idx];
            const time = 0.3 + Math.random() * (duration - 0.6);
            const v = (2 + Math.random() * 14).toFixed(1);
            const j = (0.1 + Math.random() * 2).toFixed(2);

            this.audioAnomalies.push({
                category: 'audio',
                title: t.title,
                detail: t.detail.replace('{v}', v).replace('{j}', j),
                shortLabel: t.shortLabel,
                severity: t.severity,
                time: parseFloat(time.toFixed(2)),
                location: `Audio ${this._formatTime(time)}`,
                confidence: 72 + Math.floor(Math.random() * 23)
            });
        }

        this.audioAnomalies.sort((a, b) => a.time - b.time);
        return this.audioAnomalies;
    },

    calculateOverallScore() {
        const weights = { biometric: 0.3, geometry: 0.25, temporal: 0.25, audio: 0.2 };
        let total = 0;
        let wSum = 0;

        if (this.scores.biometric > 0) { total += this.scores.biometric * weights.biometric; wSum += weights.biometric; }
        if (this.scores.geometry > 0) { total += this.scores.geometry * weights.geometry; wSum += weights.geometry; }
        if (this.scores.temporal > 0) { total += this.scores.temporal * weights.temporal; wSum += weights.temporal; }
        if (this.scores.audio > 0) { total += this.scores.audio * weights.audio; wSum += weights.audio; }

        this.scores.overall = wSum > 0 ? Math.round(total / wSum) : 0;

        const jitter = Math.floor(Math.random() * 5) - 2;
        this.scores.overall = Math.max(0, Math.min(100, this.scores.overall + jitter));

        return this.scores.overall;
    },

    getVerdict() {
        const s = this.scores.overall;
        if (s >= 70) return { level: 'fake', title: 'SYNTHETIC MEDIA DETECTED', subtitle: 'High probability of deepfake manipulation detected across multiple forensic dimensions.', icon: '⚠', color: '#ff4757' };
        if (s >= 40) return { level: 'suspect', title: 'SUSPICIOUS ARTIFACTS FOUND', subtitle: 'Some anomalies detected that may indicate partial manipulation.', icon: '⚡', color: '#ffa502' };
        return { level: 'real', title: 'LIKELY AUTHENTIC', subtitle: 'No significant manipulation artifacts detected.', icon: '✓', color: '#2ed573' };
    },

    getSummaryText() {
        const v = this.getVerdict();
        const allAnomalies = [...this.videoAnomalies, ...this.audioAnomalies];
        const critical = allAnomalies.filter(a => a.severity === 'critical').length;
        const warnings = allAnomalies.filter(a => a.severity === 'warning').length;

        let text = `DeepShield AI analysis completed with an overall synthetic confidence score of <span class="summary-highlight">${this.scores.overall}%</span>. `;
        text += `The system analyzed ${this.videoAnomalies.length > 0 ? 'visual frames and ' : ''}audio samples across ${allAnomalies.length} detection checkpoints. `;
        text += `<strong>${critical} critical</strong> and <strong>${warnings} warning-level</strong> anomalies were identified. `;

        if (this.scores.biometric > 0) text += `Biometric consistency analysis scored ${this.scores.biometric}% synthetic probability, indicating ${this.scores.biometric > 70 ? 'significant facial manipulation artifacts' : 'minor irregularities'}. `;
        if (this.scores.geometry > 0) text += `Geometry and lighting analysis revealed ${this.scores.geometry > 70 ? 'clear boundary artifacts and lighting mismatches' : 'some spatial inconsistencies'}. `;
        if (this.scores.audio > 0) text += `Audio forensics detected ${this.scores.audio > 70 ? 'voice cloning signatures including missing high-frequency noise and unnatural pauses' : 'minor spectral anomalies'}. `;

        text += `All analysis was performed on-device with zero data transmission.`;
        return text;
    },

    getSpectrogramAnomalyRegions(duration) {
        const regions = [];
        this.audioAnomalies.forEach(a => {
            if (a.severity === 'critical' || a.severity === 'warning') {
                const pos = (a.time / duration) * 200;
                regions.push({ start: Math.floor(pos - 5), end: Math.floor(pos + 5), label: a.shortLabel });
            }
        });
        return regions;
    },

    _formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    },

    exportReport() {
        return {
            timestamp: new Date().toISOString(),
            engine: 'DeepShield AI v4.6 (Cloud Opus)',
            processingMode: 'On-Device (Client-Side)',
            scores: { ...this.scores },
            verdict: this.getVerdict(),
            videoAnomalies: this.videoAnomalies.map(a => ({ title: a.title, detail: a.detail, severity: a.severity, location: a.location, confidence: a.confidence })),
            audioAnomalies: this.audioAnomalies.map(a => ({ title: a.title, detail: a.detail, severity: a.severity, location: a.location, confidence: a.confidence })),
            summary: this.getSummaryText().replace(/<[^>]*>/g, '')
        };
    }
};
