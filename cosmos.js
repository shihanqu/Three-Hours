/**
 * COSMOS - An Interactive Universe Experience
 * Procedurally generated stars, nebulae, and cosmic phenomena
 */

// ====================================
// Configuration
// ====================================
const CONFIG = {
    stars: {
        count: 3000,
        minSize: 0.5,
        maxSize: 3,
        twinkleSpeed: 0.02,
        colors: [
            '#ffffff', // White
            '#aaccff', // Blue-white
            '#fff4d4', // Yellow
            '#ffcc88', // Orange
            '#ff9988', // Red
            '#88ccff', // Blue
            '#ffaaff', // Pink
        ]
    },
    nebulae: {
        count: 5,
        minRadius: 200,
        maxRadius: 500
    },
    camera: {
        fov: 75,
        rotationSpeed: 0.001,
        zoomSpeed: 0.1,
        minZoom: 0.5,
        maxZoom: 3
    },
    warp: {
        speed: 5,
        duration: 3000
    }
};

// ====================================
// Global State
// ====================================
const state = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    
    // Camera
    cameraRotation: { x: 0, y: 0 },
    targetRotation: { x: 0, y: 0 },
    zoom: 1,
    targetZoom: 1,
    
    // Interaction
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
    
    // Objects
    stars: [],
    nebulae: [],
    discoveredStars: new Set(),
    distanceTraveled: 0,
    
    // Audio
    audioEnabled: false,
    audioContext: null,
    oscillators: [],
    
    // Warp
    isWarping: false,
    warpProgress: 0,
    
    // Animation
    time: 0,
    lastTime: 0
};

// ====================================
// Star Names Generator
// ====================================
const STAR_PREFIXES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Omicron', 'Sigma', 'Tau', 'Phi', 'Chi', 'Psi', 'Omega'];
const STAR_SUFFIXES = ['Centauri', 'Majoris', 'Minoris', 'Orionis', 'Cygni', 'Draconis', 'Pegasi', 'Andromedae', 'Lyrae', 'Aquilae', 'Scorpii', 'Leonis', 'Virginis', 'Tauri', 'Geminorum', 'Cancri', 'Sagittarii', 'Capricorni', 'Aquarii', 'Piscium'];
const STAR_TYPES = ['O-type Blue Giant', 'B-type Blue', 'A-type White', 'F-type Yellow-White', 'G-type Yellow Dwarf', 'K-type Orange Dwarf', 'M-type Red Dwarf', 'White Dwarf', 'Neutron Star', 'Red Giant'];
const STAR_DESCRIPTIONS = [
    'A brilliant beacon in the cosmic void, this star has burned steadily for billions of years.',
    'Ancient light from this distant sun carries secrets of the universe\'s earliest moments.',
    'This stellar furnace transforms hydrogen into helium, powering its radiant glow.',
    'Orbited by mysterious planets, this star may harbor worlds beyond imagination.',
    'A cosmic lighthouse guiding travelers through the infinite darkness of space.',
    'Born from the collapse of an interstellar cloud, this star represents cosmic renewal.',
    'Its light has traveled for millennia to reach your eyes in this moment.',
    'A testament to the universe\'s creative power, burning bright against the void.',
];

function generateStarName() {
    const usePrefix = Math.random() > 0.3;
    const useSuffix = Math.random() > 0.2;
    const useDesignation = Math.random() > 0.5;
    
    let name = '';
    
    if (usePrefix) {
        name += STAR_PREFIXES[Math.floor(Math.random() * STAR_PREFIXES.length)] + ' ';
    }
    
    if (useSuffix) {
        name += STAR_SUFFIXES[Math.floor(Math.random() * STAR_SUFFIXES.length)];
    }
    
    if (useDesignation || name.length < 5) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letter = letters[Math.floor(Math.random() * letters.length)];
        const number = Math.floor(Math.random() * 9999) + 1;
        name = (name.trim() + ' ' + letter + '-' + number).trim();
    }
    
    return name.trim();
}

function generateStarData(star) {
    const colorIndex = CONFIG.stars.colors.indexOf(star.color);
    const typeIndex = Math.min(colorIndex, STAR_TYPES.length - 1);
    
    return {
        name: generateStarName(),
        type: STAR_TYPES[typeIndex >= 0 ? typeIndex : Math.floor(Math.random() * STAR_TYPES.length)],
        temperature: Math.floor(3000 + Math.random() * 27000) + ' K',
        mass: (0.1 + Math.random() * 50).toFixed(2) + ' M☉',
        age: (0.1 + Math.random() * 12).toFixed(1) + ' billion years',
        description: STAR_DESCRIPTIONS[Math.floor(Math.random() * STAR_DESCRIPTIONS.length)]
    };
}

// ====================================
// Initialization
// ====================================
function init() {
    // Get canvas and context
    state.canvas = document.getElementById('cosmos');
    state.ctx = state.canvas.getContext('2d');
    
    // Set size
    resize();
    window.addEventListener('resize', resize);
    
    // Generate universe
    generateStars();
    generateNebulae();
    
    // Setup interactions
    setupInteractions();
    
    // Start animation
    state.lastTime = performance.now();
    animate();
    
    // Hide loading screen after a delay
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 2500);
}

function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.canvas.width = state.width;
    state.canvas.height = state.height;
}

// ====================================
// Universe Generation
// ====================================
function generateStars() {
    state.stars = [];
    
    for (let i = 0; i < CONFIG.stars.count; i++) {
        // Distribute stars in 3D space
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 500 + Math.random() * 1500;
        
        const star = {
            id: i,
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi),
            size: CONFIG.stars.minSize + Math.random() * (CONFIG.stars.maxSize - CONFIG.stars.minSize),
            color: CONFIG.stars.colors[Math.floor(Math.random() * CONFIG.stars.colors.length)],
            twinkleOffset: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.5 + Math.random() * 2,
            brightness: 0.5 + Math.random() * 0.5,
            data: null // Generated on first click
        };
        
        state.stars.push(star);
    }
}

function generateNebulae() {
    state.nebulae = [];
    
    const nebulaColors = [
        { r: 107, g: 76, b: 154 },   // Purple
        { r: 74, g: 127, b: 181 },   // Blue
        { r: 199, g: 125, b: 187 },  // Pink
        { r: 94, g: 207, b: 217 },   // Cyan
        { r: 181, g: 74, b: 127 },   // Magenta
    ];
    
    for (let i = 0; i < CONFIG.nebulae.count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 300 + Math.random() * 800;
        
        const nebula = {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi),
            radius: CONFIG.nebulae.minRadius + Math.random() * (CONFIG.nebulae.maxRadius - CONFIG.nebulae.minRadius),
            color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.001,
            pulseOffset: Math.random() * Math.PI * 2
        };
        
        state.nebulae.push(nebula);
    }
}

// ====================================
// Interactions
// ====================================
function setupInteractions() {
    const canvas = state.canvas;
    
    // Mouse down
    canvas.addEventListener('mousedown', (e) => {
        state.isDragging = true;
        state.lastMouse = { x: e.clientX, y: e.clientY };
    });
    
    // Mouse move
    canvas.addEventListener('mousemove', (e) => {
        if (state.isDragging) {
            const deltaX = e.clientX - state.lastMouse.x;
            const deltaY = e.clientY - state.lastMouse.y;
            
            state.targetRotation.y += deltaX * CONFIG.camera.rotationSpeed;
            state.targetRotation.x += deltaY * CONFIG.camera.rotationSpeed;
            
            // Clamp vertical rotation
            state.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.targetRotation.x));
            
            // Track distance
            state.distanceTraveled += Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 0.01;
            updateStats();
            
            state.lastMouse = { x: e.clientX, y: e.clientY };
        }
    });
    
    // Mouse up
    canvas.addEventListener('mouseup', () => {
        state.isDragging = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
        state.isDragging = false;
    });
    
    // Click for star discovery
    canvas.addEventListener('click', (e) => {
        if (!state.isDragging) {
            checkStarClick(e.clientX, e.clientY);
        }
    });
    
    // Scroll for zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : -1;
        state.targetZoom = Math.max(
            CONFIG.camera.minZoom,
            Math.min(CONFIG.camera.maxZoom, state.targetZoom - delta * CONFIG.camera.zoomSpeed)
        );
        
        // Track distance
        state.distanceTraveled += Math.abs(delta) * 5;
        updateStats();
    });
    
    // Touch support
    let touchStart = null;
    let initialDistance = null;
    
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        if (e.touches.length === 1 && touchStart) {
            const deltaX = e.touches[0].clientX - touchStart.x;
            const deltaY = e.touches[0].clientY - touchStart.y;
            
            state.targetRotation.y += deltaX * CONFIG.camera.rotationSpeed;
            state.targetRotation.x += deltaY * CONFIG.camera.rotationSpeed;
            state.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.targetRotation.x));
            
            state.distanceTraveled += Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 0.01;
            updateStats();
            
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2 && initialDistance) {
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            const delta = (initialDistance - currentDistance) * 0.01;
            state.targetZoom = Math.max(
                CONFIG.camera.minZoom,
                Math.min(CONFIG.camera.maxZoom, state.targetZoom - delta)
            );
            
            initialDistance = currentDistance;
        }
    });
    
    canvas.addEventListener('touchend', () => {
        touchStart = null;
        initialDistance = null;
    });
    
    // Audio toggle
    document.getElementById('audio-toggle').addEventListener('click', toggleAudio);
    
    // Warp button
    document.getElementById('warp-button').addEventListener('click', activateWarp);
    
    // Close star info
    document.getElementById('close-star-info').addEventListener('click', () => {
        document.getElementById('star-info').classList.remove('visible');
        document.getElementById('star-info').classList.add('hidden');
    });
}

function checkStarClick(mouseX, mouseY) {
    const centerX = state.width / 2;
    const centerY = state.height / 2;
    
    let closestStar = null;
    let closestDistance = Infinity;
    
    for (const star of state.stars) {
        const projected = project3D(star.x, star.y, star.z);
        if (projected.visible) {
            const screenX = centerX + projected.x * state.zoom;
            const screenY = centerY + projected.y * state.zoom;
            
            const distance = Math.hypot(mouseX - screenX, mouseY - screenY);
            if (distance < 20 && distance < closestDistance) {
                closestDistance = distance;
                closestStar = star;
            }
        }
    }
    
    if (closestStar) {
        discoverStar(closestStar);
    }
}

function discoverStar(star) {
    // Generate data if not exists
    if (!star.data) {
        star.data = generateStarData(star);
    }
    
    // Check if new discovery
    const isNew = !state.discoveredStars.has(star.id);
    if (isNew) {
        state.discoveredStars.add(star.id);
        updateStats();
        showDiscoveryNotification(star.data.name);
    }
    
    // Show star info
    showStarInfo(star);
}

function showStarInfo(star) {
    const panel = document.getElementById('star-info');
    
    document.getElementById('star-name').textContent = star.data.name;
    document.getElementById('star-type').textContent = star.data.type;
    document.getElementById('star-temp').textContent = star.data.temperature;
    document.getElementById('star-mass').textContent = star.data.mass;
    document.getElementById('star-age').textContent = star.data.age;
    document.getElementById('star-description').textContent = star.data.description;
    
    // Update star preview color
    const preview = document.getElementById('star-preview');
    preview.style.background = `radial-gradient(circle, ${star.color} 0%, ${star.color}88 50%, transparent 70%)`;
    preview.style.boxShadow = `0 0 60px ${star.color}, 0 0 100px ${star.color}88`;
    
    panel.classList.remove('hidden');
    panel.classList.add('visible');
    
    // Play discovery sound
    if (state.audioEnabled) {
        playDiscoverySound();
    }
}

function showDiscoveryNotification(starName) {
    const notification = document.getElementById('discovery-notification');
    document.getElementById('discovery-name').textContent = starName;
    
    notification.classList.remove('hidden');
    notification.classList.add('visible');
    
    setTimeout(() => {
        notification.classList.remove('visible');
    }, 3000);
}

function updateStats() {
    document.getElementById('stars-discovered').textContent = state.discoveredStars.size;
    document.getElementById('distance-traveled').textContent = Math.floor(state.distanceTraveled) + ' ly';
}

// ====================================
// Audio System
// ====================================
function toggleAudio() {
    state.audioEnabled = !state.audioEnabled;
    const btn = document.getElementById('audio-toggle');
    
    if (state.audioEnabled) {
        initAudio();
        btn.classList.add('active');
        btn.querySelector('.audio-icon').textContent = '🔊';
        btn.querySelector('.audio-label').textContent = 'Audio On';
    } else {
        stopAudio();
        btn.classList.remove('active');
        btn.querySelector('.audio-icon').textContent = '🔇';
        btn.querySelector('.audio-label').textContent = 'Enable Audio';
    }
}

function initAudio() {
    if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Create ambient drone
    const frequencies = [65.41, 98.00, 130.81, 196.00]; // C2, G2, C3, G3
    
    frequencies.forEach((freq, i) => {
        const osc = state.audioContext.createOscillator();
        const gain = state.audioContext.createGain();
        const filter = state.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;
        
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.03, state.audioContext.currentTime + 2);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(state.audioContext.destination);
        
        osc.start();
        state.oscillators.push({ osc, gain, filter });
    });
}

function stopAudio() {
    state.oscillators.forEach(({ osc, gain }) => {
        gain.gain.linearRampToValueAtTime(0, state.audioContext.currentTime + 1);
        setTimeout(() => osc.stop(), 1000);
    });
    state.oscillators = [];
}

function playDiscoverySound() {
    if (!state.audioContext) return;
    
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 880;
    osc.frequency.linearRampToValueAtTime(1760, state.audioContext.currentTime + 0.1);
    
    gain.gain.value = 0.1;
    gain.gain.linearRampToValueAtTime(0, state.audioContext.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(state.audioContext.destination);
    
    osc.start();
    osc.stop(state.audioContext.currentTime + 0.5);
}

// ====================================
// Warp Drive
// ====================================
function activateWarp() {
    if (state.isWarping) return;
    
    state.isWarping = true;
    state.warpProgress = 0;
    
    const btn = document.getElementById('warp-button');
    btn.classList.add('active');
    
    // Random new rotation target
    state.targetRotation.x = (Math.random() - 0.5) * Math.PI;
    state.targetRotation.y += Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1);
    
    setTimeout(() => {
        state.isWarping = false;
        btn.classList.remove('active');
        state.distanceTraveled += 1000;
        updateStats();
    }, CONFIG.warp.duration);
    
    // Play warp sound
    if (state.audioEnabled && state.audioContext) {
        playWarpSound();
    }
}

function playWarpSound() {
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.value = 50;
    osc.frequency.exponentialRampToValueAtTime(200, state.audioContext.currentTime + 1.5);
    osc.frequency.exponentialRampToValueAtTime(50, state.audioContext.currentTime + 3);
    
    gain.gain.value = 0.1;
    gain.gain.linearRampToValueAtTime(0.2, state.audioContext.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, state.audioContext.currentTime + 3);
    
    osc.connect(gain);
    gain.connect(state.audioContext.destination);
    
    osc.start();
    osc.stop(state.audioContext.currentTime + 3);
}

// ====================================
// 3D Projection
// ====================================
function project3D(x, y, z) {
    // Apply camera rotation
    let rx = state.cameraRotation.x;
    let ry = state.cameraRotation.y;
    
    // Rotate around Y axis
    let tempX = x * Math.cos(ry) - z * Math.sin(ry);
    let tempZ = x * Math.sin(ry) + z * Math.cos(ry);
    x = tempX;
    z = tempZ;
    
    // Rotate around X axis
    let tempY = y * Math.cos(rx) - z * Math.sin(rx);
    tempZ = y * Math.sin(rx) + z * Math.cos(rx);
    y = tempY;
    z = tempZ;
    
    // Perspective projection
    const fov = CONFIG.camera.fov;
    const perspective = fov / (fov + z);
    
    return {
        x: x * perspective,
        y: y * perspective,
        z: z,
        scale: perspective,
        visible: z > -fov
    };
}

// ====================================
// Rendering
// ====================================
function animate(currentTime = 0) {
    const deltaTime = currentTime - state.lastTime;
    state.lastTime = currentTime;
    state.time += deltaTime * 0.001;
    
    update(deltaTime);
    render();
    
    requestAnimationFrame(animate);
}

function update(deltaTime) {
    // Smooth camera rotation
    const smoothing = 0.05;
    state.cameraRotation.x += (state.targetRotation.x - state.cameraRotation.x) * smoothing;
    state.cameraRotation.y += (state.targetRotation.y - state.cameraRotation.y) * smoothing;
    
    // Smooth zoom
    state.zoom += (state.targetZoom - state.zoom) * smoothing;
    
    // Warp effect
    if (state.isWarping) {
        state.warpProgress += deltaTime / CONFIG.warp.duration;
        
        // Faster rotation during warp
        const warpSmoothing = 0.1;
        state.cameraRotation.x += (state.targetRotation.x - state.cameraRotation.x) * warpSmoothing;
        state.cameraRotation.y += (state.targetRotation.y - state.cameraRotation.y) * warpSmoothing;
    }
    
    // Auto-rotate nebulae
    state.nebulae.forEach(nebula => {
        nebula.rotation += nebula.rotationSpeed * deltaTime;
    });
}

function render() {
    const ctx = state.ctx;
    const width = state.width;
    const height = state.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear with deep space gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) / 2);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#050510');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Render nebulae (background)
    renderNebulae(ctx, centerX, centerY);
    
    // Render stars
    renderStars(ctx, centerX, centerY);
    
    // Render warp effect
    if (state.isWarping) {
        renderWarpEffect(ctx, centerX, centerY);
    }
}

function renderNebulae(ctx, centerX, centerY) {
    ctx.globalCompositeOperation = 'lighter';
    
    state.nebulae.forEach(nebula => {
        const projected = project3D(nebula.x, nebula.y, nebula.z);
        if (!projected.visible) return;
        
        const screenX = centerX + projected.x * state.zoom;
        const screenY = centerY + projected.y * state.zoom;
        const radius = nebula.radius * projected.scale * state.zoom;
        
        if (radius < 5) return;
        
        // Pulsing effect
        const pulse = 0.8 + Math.sin(state.time + nebula.pulseOffset) * 0.2;
        
        // Create gradient
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
        const { r, g, b } = nebula.color;
        const alpha = 0.1 * projected.scale * pulse;
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
        gradient.addColorStop(0.6, `rgba(${r * 0.8}, ${g * 0.8}, ${b * 0.8}, ${alpha * 0.2})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, radius, radius * 0.7, nebula.rotation, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.globalCompositeOperation = 'source-over';
}

function renderStars(ctx, centerX, centerY) {
    // Sort stars by depth (far to near)
    const sortedStars = [...state.stars].sort((a, b) => {
        const projA = project3D(a.x, a.y, a.z);
        const projB = project3D(b.x, b.y, b.z);
        return projB.z - projA.z;
    });
    
    sortedStars.forEach(star => {
        const projected = project3D(star.x, star.y, star.z);
        if (!projected.visible) return;
        
        const screenX = centerX + projected.x * state.zoom;
        const screenY = centerY + projected.y * state.zoom;
        
        // Skip if off screen
        if (screenX < -50 || screenX > state.width + 50 || screenY < -50 || screenY > state.height + 50) {
            return;
        }
        
        // Twinkling
        const twinkle = 0.7 + Math.sin(state.time * star.twinkleSpeed + star.twinkleOffset) * 0.3;
        const brightness = star.brightness * twinkle;
        
        // Size based on depth and base size
        let size = star.size * projected.scale * state.zoom;
        
        // Warp effect - stretch stars
        if (state.isWarping) {
            const warpFactor = 1 + state.warpProgress * 20;
            const angle = Math.atan2(screenY - centerY, screenX - centerX);
            
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(angle);
            ctx.scale(warpFactor, 1);
            ctx.translate(-screenX, -screenY);
        }
        
        // Draw star glow
        const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size * 4);
        glowGradient.addColorStop(0, star.color);
        glowGradient.addColorStop(0.1, star.color);
        glowGradient.addColorStop(0.4, `${star.color}44`);
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.globalAlpha = brightness;
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size * 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw star core
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw subtle cross flare for bright stars
        if (size > 1.5 && brightness > 0.7) {
            ctx.globalAlpha = brightness * 0.5;
            ctx.strokeStyle = star.color;
            ctx.lineWidth = 0.5;
            
            ctx.beginPath();
            ctx.moveTo(screenX - size * 3, screenY);
            ctx.lineTo(screenX + size * 3, screenY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(screenX, screenY - size * 3);
            ctx.lineTo(screenX, screenY + size * 3);
            ctx.stroke();
        }
        
        if (state.isWarping) {
            ctx.restore();
        }
        
        ctx.globalAlpha = 1;
    });
}

function renderWarpEffect(ctx, centerX, centerY) {
    // Radial lines effect
    const lineCount = 100;
    const progress = state.warpProgress;
    
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const innerRadius = 50 + progress * 200;
        const outerRadius = innerRadius + 100 + progress * 500;
        
        ctx.globalAlpha = (1 - progress) * 0.3;
        ctx.beginPath();
        ctx.moveTo(
            centerX + Math.cos(angle) * innerRadius,
            centerY + Math.sin(angle) * innerRadius
        );
        ctx.lineTo(
            centerX + Math.cos(angle) * outerRadius,
            centerY + Math.sin(angle) * outerRadius
        );
        ctx.stroke();
    }
    
    // Central flash
    if (progress > 0.8) {
        const flashProgress = (progress - 0.8) / 0.2;
        ctx.globalAlpha = (1 - flashProgress) * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(state.width, state.height) * flashProgress, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
}

// ====================================
// Initialize on DOM Ready
// ====================================
document.addEventListener('DOMContentLoaded', init);
