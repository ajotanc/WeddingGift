export interface Particle {
	x: number;
	y: number;
	size: number;
	speedX: number;
	speedY: number;
	opacity: number;
	fadeSpeed?: number;
	rotation?: number;
	rotationSpeed?: number;
}

export interface EffectConfig {
	maxParticles: number;
	createY: (canvasHeight: number, initY: boolean) => number;
	size: () => number;
	speedX: () => number;
	speedY: () => number;
	opacity: () => number;
	rotation?: () => number;
	rotationSpeed?: () => number;
	fadeSpeed?: (
		opacity: number,
		speedY: number,
		y: number,
		canvasHeight: number,
	) => number;
	updatePhysics: (p: Particle, canvasHeight: number) => void;
	shouldReset: (
		p: Particle,
		canvasWidth: number,
		canvasHeight: number,
	) => boolean;
	draw: (
		ctx: CanvasRenderingContext2D,
		p: Particle,
		canvasHeight: number,
	) => void;
}

export const EFFECT_CONFIGS: Record<string, EffectConfig> = {
	"rose-petals": {
		maxParticles: 25,
		createY: (h, initY) => (initY ? Math.random() * h : -10),
		size: () => Math.random() * 4 + 4,
		speedX: () => Math.random() * 1.5 - 0.5,
		speedY: () => Math.random() * 1.2 + 0.8,
		opacity: () => Math.random() * 0.4 + 0.5,
		rotation: () => Math.random() * Math.PI * 2,
		rotationSpeed: () => Math.random() * 0.02 - 0.01,
		updatePhysics: (p) => {
			p.y += p.speedY;
			p.x += p.speedX + Math.sin(p.y / 30) * 0.3;
			if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
				p.rotation += p.rotationSpeed;
			}
		},
		shouldReset: (p, w, h) => p.y > h + 10 || p.x < -10 || p.x > w + 10,
		draw: (ctx, p, h) => {
			let drawOpacity = p.opacity;
			if (p.y > h * 0.8) {
				const fadeProgress = (p.y - h * 0.8) / (h * 0.2);
				drawOpacity = p.opacity * Math.max(0, 1 - fadeProgress);
			}

			ctx.save();
			ctx.translate(p.x, p.y);
			if (p.rotation !== undefined) {
				ctx.rotate(p.rotation);
			}
			const wobble = Math.sin(Date.now() / 250 + p.y / 80) * 0.4 + 0.6;
			ctx.scale(wobble, 1);

			const gradient = ctx.createLinearGradient(0, p.size, 0, -p.size);
			gradient.addColorStop(0, `rgba(224, 30, 90, ${drawOpacity})`);
			gradient.addColorStop(0.5, `rgba(244, 143, 177, ${drawOpacity})`);
			gradient.addColorStop(1, `rgba(252, 228, 236, ${drawOpacity * 0.9})`);

			ctx.beginPath();
			ctx.moveTo(0, p.size);
			ctx.bezierCurveTo(
				-p.size * 1.5,
				p.size * 0.6,
				-p.size * 1.5,
				-p.size * 0.6,
				0,
				-p.size,
			);
			ctx.bezierCurveTo(
				p.size * 1.5,
				-p.size * 0.6,
				p.size * 1.5,
				p.size * 0.6,
				0,
				p.size,
			);
			ctx.closePath();

			ctx.fillStyle = gradient;
			ctx.shadowBlur = p.size * 0.4;
			ctx.shadowColor = `rgba(244, 143, 177, ${drawOpacity * 0.4})`;
			ctx.fill();
			ctx.restore();
		},
	},
	sparkles: {
		maxParticles: 60,
		createY: (h, initY) => (initY ? Math.random() * h : -10),
		size: () => Math.random() * 2.5 + 1.2,
		speedX: () => Math.random() * 0.6 - 0.3,
		speedY: () => Math.random() * 0.7 + 0.5,
		opacity: () => Math.random() * 0.5 + 0.5,
		fadeSpeed: (opacity, speedY, y, h) => {
			const distanceToTravel = Math.max(50, h * 1.3 - y);
			const framesToBottom = distanceToTravel / speedY;
			return (opacity / framesToBottom) * (Math.random() * 0.4 + 0.8);
		},
		updatePhysics: (p) => {
			p.y += p.speedY;
			p.x += p.speedX;
			if (p.fadeSpeed !== undefined) {
				p.opacity -= p.fadeSpeed;
			}
		},
		shouldReset: (p, w, h) =>
			p.y > h + 10 || p.opacity <= 0 || p.x < -10 || p.x > w + 10,
		draw: (ctx, p) => {
			const currentOpacity = Math.max(
				0,
				p.opacity * (0.6 + 0.4 * Math.sin(Date.now() / 150 + p.x)),
			);

			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.beginPath();
			for (let j = 0; j < 4; j++) {
				const angle = (j * Math.PI) / 2;
				const x1 = Math.cos(angle) * p.size * 2.2;
				const y1 = Math.sin(angle) * p.size * 2.2;

				const nextAngle = angle + Math.PI / 4;
				const x2 = Math.cos(nextAngle) * p.size * 0.5;
				const y2 = Math.sin(nextAngle) * p.size * 0.5;

				if (j === 0) {
					ctx.moveTo(x1, y1);
				} else {
					ctx.lineTo(x1, y1);
				}
				ctx.lineTo(x2, y2);
			}
			ctx.closePath();

			ctx.fillStyle = `rgba(253, 224, 71, ${currentOpacity})`;
			ctx.shadowBlur = p.size * 2;
			ctx.shadowColor = `rgba(250, 204, 21, ${currentOpacity})`;
			ctx.fill();
			ctx.restore();
		},
	},
	snow: {
		maxParticles: 40,
		createY: (h, initY) => (initY ? Math.random() * h : -10),
		size: () => Math.random() * 2.5 + 2,
		speedX: () => Math.random() * 0.4 - 0.2,
		speedY: () => Math.random() * 0.5 + 0.3,
		opacity: () => Math.random() * 0.5 + 0.4,
		rotation: () => Math.random() * Math.PI * 2,
		rotationSpeed: () => Math.random() * 0.008 - 0.004,
		updatePhysics: (p) => {
			p.y += p.speedY;
			p.x += p.speedX + Math.sin(p.y / 60) * 0.25;
			if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
				p.rotation += p.rotationSpeed;
			}
		},
		shouldReset: (p, w, h) => p.y > h + 15 || p.x < -15 || p.x > w + 15,
		draw: (ctx, p) => {
			ctx.save();
			ctx.translate(p.x, p.y);
			if (p.rotation !== undefined) {
				ctx.rotate(p.rotation);
			}

			ctx.beginPath();
			const radius = p.size * 2.5;
			const branchAngles = [
				0,
				Math.PI / 3,
				(2 * Math.PI) / 3,
				Math.PI,
				(4 * Math.PI) / 3,
				(5 * Math.PI) / 3,
			];

			// 1. Central hexagon crystal
			ctx.moveTo(
				Math.cos(branchAngles[0]) * radius * 0.25,
				Math.sin(branchAngles[0]) * radius * 0.25,
			);
			for (let j = 1; j < 6; j++) {
				ctx.lineTo(
					Math.cos(branchAngles[j]) * radius * 0.25,
					Math.sin(branchAngles[j]) * radius * 0.25,
				);
			}
			ctx.closePath();

			// 2. Six arms with dual-tier V-shaped ticks
			for (let j = 0; j < 6; j++) {
				const angle = branchAngles[j];
				const cos = Math.cos(angle);
				const sin = Math.sin(angle);

				// Arm stem
				ctx.moveTo(0, 0);
				ctx.lineTo(cos * radius, sin * radius);

				// Ticks geometry
				const tickLength = radius * 0.35;
				const tAngle1 = angle + Math.PI / 3;
				const tAngle2 = angle - Math.PI / 3;

				// Inner V-tick (at 55% length)
				const x55 = cos * radius * 0.55;
				const y55 = sin * radius * 0.55;
				ctx.moveTo(x55, y55);
				ctx.lineTo(
					x55 + Math.cos(tAngle1) * tickLength,
					y55 + Math.sin(tAngle1) * tickLength,
				);
				ctx.moveTo(x55, y55);
				ctx.lineTo(
					x55 + Math.cos(tAngle2) * tickLength,
					y55 + Math.sin(tAngle2) * tickLength,
				);

				// Outer V-tick near the tip (at 80% length)
				const x80 = cos * radius * 0.8;
				const y80 = sin * radius * 0.8;
				ctx.moveTo(x80, y80);
				ctx.lineTo(
					x80 + Math.cos(tAngle1) * tickLength * 0.7,
					y80 + Math.sin(tAngle1) * tickLength * 0.7,
				);
				ctx.moveTo(x80, y80);
				ctx.lineTo(
					x80 + Math.cos(tAngle2) * tickLength * 0.7,
					y80 + Math.sin(tAngle2) * tickLength * 0.7,
				);
			}

			ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
			ctx.lineWidth = Math.max(0.8, p.size * 0.2);
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.stroke();

			// Central core glow dot
			ctx.beginPath();
			ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.95})`;
			ctx.fill();

			ctx.restore();
		},
	},
	hearts: {
		maxParticles: 20,
		createY: (h, initY) => (initY ? Math.random() * h : h + 10),
		size: () => Math.random() * 3 + 3,
		speedX: () => Math.random() * 0.4 - 0.2,
		speedY: () => -(Math.random() * 0.6 + 0.3),
		opacity: () => Math.random() * 0.5 + 0.4,
		rotation: () => Math.random() * Math.PI * 2,
		rotationSpeed: () => Math.random() * 0.02 - 0.01,
		updatePhysics: (p) => {
			p.y += p.speedY;
			p.x += p.speedX + Math.sin(p.y / 40) * 0.15;
			if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
				p.rotation += p.rotationSpeed;
			}
		},
		shouldReset: (p, w) => p.y < -10 || p.x < -10 || p.x > w + 10,
		draw: (ctx, p) => {
			ctx.save();
			ctx.translate(p.x, p.y);
			if (p.rotation !== undefined) {
				ctx.rotate(p.rotation);
			}
			ctx.beginPath();
			const size = p.size;
			ctx.moveTo(0, -size / 2);
			ctx.bezierCurveTo(
				-size * 1.2,
				-size * 1.5,
				-size * 1.6,
				0,
				0,
				size * 1.2,
			);
			ctx.bezierCurveTo(size * 1.6, 0, size * 1.2, -size * 1.5, 0, -size / 2);
			ctx.closePath();

			ctx.fillStyle = `rgba(244, 63, 94, ${p.opacity})`;
			ctx.shadowBlur = p.size * 0.6;
			ctx.shadowColor = `rgba(244, 63, 94, ${p.opacity * 0.4})`;
			ctx.fill();
			ctx.restore();
		},
	},
	butterflies: {
		maxParticles: 16,
		createY: (h, initY) => (initY ? Math.random() * h : h + 10),
		size: () => Math.random() * 4 + 4,
		speedX: () => Math.random() * 0.3 - 0.15,
		speedY: () => -(Math.random() * 0.3 + 0.25),
		opacity: () => Math.random() * 0.4 + 0.5,
		fadeSpeed: () => Math.floor(Math.random() * 4), // Store permanent color index
		updatePhysics: (p) => {
			// Wander steering physics for organic butterfly flight paths
			if (p.rotation === undefined) {
				p.rotation = Math.random() * 0.8 - 0.4; // Face generally upwards initially
			}

			// Slowly oscillate flight path and add organic minor heading changes
			p.rotation += Math.sin(Date.now() / 600 + (p.fadeSpeed || 0) * 2) * 0.015;
			p.rotation += (Math.random() * 0.05 - 0.025);

			// Clamp tilt so they always fly generally upwards (max ~80 degrees left/right)
			const maxTilt = Math.PI / 2.2;
			if (p.rotation < -maxTilt) p.rotation = -maxTilt;
			if (p.rotation > maxTilt) p.rotation = maxTilt;

			// Base speed magnitude
			const speedMag = 0.5 + (p.size * 0.04);
			p.speedX = Math.sin(p.rotation) * speedMag;
			p.speedY = -Math.cos(p.rotation) * speedMag;

			p.x += p.speedX;
			p.y += p.speedY;
		},
		shouldReset: (p, w) => p.y < -15 || p.x < -20 || p.x > w + 20,
		draw: (ctx, p) => {
			ctx.save();

			// Use the smooth steering rotation directly (shiver removed for clean motion)
			const angle = p.rotation || 0;

			ctx.translate(p.x, p.y);
			ctx.rotate(angle);

			// Flap wings dynamically and elegantly (slow graceful flap using static offset)
			const flap = Math.abs(Math.sin(Date.now() / (750 + p.size * 25) + (p.fadeSpeed || 0) * 1.5));

			const size = p.size;
			const colors = [
				"rgba(186, 104, 200, ", // Orchid purple
				"rgba(240, 98, 146, ",  // Warm rose pink
				"rgba(79, 195, 247, ",  // Sky blue
				"rgba(255, 183, 77, ",  // Warm orange/monarch
			];
			const colorIndex = p.fadeSpeed !== undefined ? Math.floor(p.fadeSpeed) % colors.length : 0;
			const baseColor = colors[colorIndex];

			// Helper function to draw wings on a side
			const drawWingSide = (side: number, scaleSize: number) => {
				ctx.beginPath();
				ctx.moveTo(0, -scaleSize * 0.15);
				ctx.bezierCurveTo(
					side * scaleSize * 1.5, -scaleSize * 1.6,
					side * scaleSize * 2.0, -scaleSize * 0.5,
					side * scaleSize * 0.4, -scaleSize * 0.1
				);
				ctx.bezierCurveTo(
					side * scaleSize * 1.3, scaleSize * 0.4,
					side * scaleSize * 0.9, scaleSize * 1.4,
					0, scaleSize * 0.3
				);
				ctx.closePath();
				ctx.fill();
			};

			// Helper function to draw spots on the outer edge of the wing
			const drawWingDots = (side: number, scaleSize: number) => {
				ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.85})`;
				const dotRadius = scaleSize * 0.08;
				const dots = [
					{ x: side * scaleSize * 1.3, y: -scaleSize * 0.9 },
					{ x: side * scaleSize * 1.5, y: -scaleSize * 0.4 },
					{ x: side * scaleSize * 1.1, y: scaleSize * 0.1 },
					{ x: side * scaleSize * 0.8, y: scaleSize * 0.6 }
				];
				for (const dot of dots) {
					ctx.beginPath();
					ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
					ctx.fill();
				}
			};

			// Draw Wings (with flapping scale)
			ctx.save();
			ctx.scale(flap, 1);

			// Outer black wing border
			ctx.fillStyle = `rgba(25, 25, 25, ${p.opacity * 0.95})`;
			drawWingSide(-1, size);
			drawWingSide(1, size);

			// Inner colorful wing center with radial gradient for transparency/depth
			const gradLeft = ctx.createRadialGradient(
				0, 0, size * 0.1,
				-size * 0.8, -size * 0.4, size * 1.2
			);
			gradLeft.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
			gradLeft.addColorStop(0.2, `rgba(255, 250, 200, ${p.opacity})`);
			gradLeft.addColorStop(0.5, `${baseColor}${p.opacity})`);
			gradLeft.addColorStop(1, `${baseColor}${p.opacity * 0.7})`);

			const gradRight = ctx.createRadialGradient(
				0, 0, size * 0.1,
				size * 0.8, -size * 0.4, size * 1.2
			);
			gradRight.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
			gradRight.addColorStop(0.2, `rgba(255, 250, 200, ${p.opacity})`);
			gradRight.addColorStop(0.5, `${baseColor}${p.opacity})`);
			gradRight.addColorStop(1, `${baseColor}${p.opacity * 0.7})`);

			ctx.fillStyle = gradLeft;
			drawWingSide(-1, size * 0.85);

			ctx.fillStyle = gradRight;
			drawWingSide(1, size * 0.85);

			// Draw decorative border spots
			drawWingDots(-1, size);
			drawWingDots(1, size);

			ctx.restore();

			// Draw body (ellipse)
			ctx.beginPath();
			ctx.ellipse(0, 0, size * 0.15, size * 0.7, 0, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(25, 25, 25, ${p.opacity * 0.95})`;
			ctx.fill();

			// Draw antennae
			ctx.beginPath();
			ctx.moveTo(-size * 0.05, -size * 0.55);
			ctx.quadraticCurveTo(-size * 0.3, -size * 1.1, -size * 0.5, -size * 0.95);
			ctx.moveTo(size * 0.05, -size * 0.55);
			ctx.quadraticCurveTo(size * 0.3, -size * 1.1, size * 0.5, -size * 0.95);
			ctx.strokeStyle = `rgba(25, 25, 25, ${p.opacity * 0.8})`;
			ctx.lineWidth = Math.max(0.6, size * 0.06);
			ctx.stroke();

			ctx.restore();
		},
	},
	"gold-dust": {
		maxParticles: 30, // More particles for a beautiful, rich starry sky/mist
		createY: (h, initY) => (initY ? Math.random() * h : h + 15),
		size: () => Math.random() * 3 + 1.2, // Particle size (1.2px to 4.7px)
		speedX: () => Math.random() * 0.3 - 0.15, // Very slow horizontal drift
		speedY: () => -(Math.random() * 0.4 + 0.2), // Very slow rising
		opacity: () => Math.random() * 0.4 + 0.4, // Opacity between 40% and 80%
		rotation: () => Math.random() * Math.PI * 2, // Used for phase/shimmer offset and star rotation
		rotationSpeed: () => Math.random() * 0.015 - 0.0075, // Slow rotation for sparkles
		updatePhysics: (p) => {
			p.y += p.speedY;
			p.x += p.speedX + Math.sin(p.y / 60 + (p.rotation || 0)) * 0.18; // Very gentle swaying
			if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
				p.rotation += p.rotationSpeed;
			}
			// Shimmer/twinkle effect
			p.opacity = 0.2 + Math.abs(Math.sin(Date.now() / 700 + (p.rotation || 0) * 8)) * 0.6;
		},
		shouldReset: (p, w, h) => p.y < -20 || p.x < -20 || p.x > w + 20,
		draw: (ctx, p, h) => {
			let drawOpacity = p.opacity;
			
			// Smoothly fade out as particles reach the top of the screen (top 20%)
			if (p.y < h * 0.2) {
				const fadeProgress = p.y / (h * 0.2);
				drawOpacity = p.opacity * Math.max(0, fadeProgress);
			}

			ctx.save();
			ctx.translate(p.x, p.y);

			const r = p.size;
			const isSparkle = (Math.floor(p.size * 100) % 3 === 0); // Deterministic type based on size

			// Use soft champagne-gold shadow glow
			ctx.shadowColor = `rgba(253, 224, 71, ${drawOpacity * 0.5})`;
			ctx.shadowBlur = r * 2.5;

			if (isSparkle) {
				// Draw a sparkling 4-pointed star
				if (p.rotation !== undefined) {
					ctx.rotate(p.rotation);
				}

				const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
				grad.addColorStop(0, `rgba(255, 255, 255, ${drawOpacity})`); // White core
				grad.addColorStop(0.4, `rgba(254, 240, 138, ${drawOpacity * 0.9})`); // Yellow-100
				grad.addColorStop(0.8, `rgba(251, 191, 36, ${drawOpacity * 0.4})`); // Amber-400
				grad.addColorStop(1, "rgba(251, 191, 36, 0)");

				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.moveTo(0, -r * 2.2);
				ctx.quadraticCurveTo(0, 0, -r * 2.2, 0);
				ctx.quadraticCurveTo(0, 0, 0, r * 2.2);
				ctx.quadraticCurveTo(0, 0, r * 2.2, 0);
				ctx.quadraticCurveTo(0, 0, 0, -r * 2.2);
				ctx.closePath();
				ctx.fill();
			} else {
				// Draw a soft glowing circular bokeh halo
				const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3.5);
				glow.addColorStop(0, `rgba(255, 255, 240, ${drawOpacity * 0.95})`); // Cream core
				glow.addColorStop(0.3, `rgba(253, 224, 71, ${drawOpacity * 0.7})`); // Light gold
				glow.addColorStop(0.7, `rgba(245, 158, 11, ${drawOpacity * 0.2})`); // Soft champagne halo (no harsh dark orange)
				glow.addColorStop(1, "rgba(245, 158, 11, 0)");

				ctx.beginPath();
				ctx.arc(0, 0, r * 3.5, 0, Math.PI * 2);
				ctx.fillStyle = glow;
				ctx.fill();
			}

			ctx.restore();
		},
	},
	confetti: {
		maxParticles: 35,
		createY: (h, initY) => (initY ? Math.random() * h : -10),
		size: () => Math.random() * 6 + 5,
		speedX: () => Math.random() * 0.8 - 0.4,
		speedY: () => Math.random() * 1.2 + 1.2,
		opacity: () => Math.random() * 0.3 + 0.7,
		rotation: () => Math.random() * Math.PI * 2,
		rotationSpeed: () => Math.random() * 0.04 + 0.02,
		fadeSpeed: () => Math.floor(Math.random() * 5), // Store permanent color index
		updatePhysics: (p) => {
			p.y += p.speedY;
			p.x += p.speedX + Math.sin(p.y / 30) * 0.4;
			if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
				p.rotation += p.rotationSpeed;
			}
		},
		shouldReset: (p, w, h) => p.y > h + 10 || p.x < -10 || p.x > w + 10,
		draw: (ctx, p, h) => {
			let drawOpacity = p.opacity;
			if (p.y > h * 0.85) {
				const fadeProgress = (p.y - h * 0.85) / (h * 0.15);
				drawOpacity = p.opacity * Math.max(0, 1 - fadeProgress);
			}

			ctx.save();
			ctx.translate(p.x, p.y);

			if (p.rotation !== undefined) {
				ctx.rotate(p.rotation);
				// 3D tumbling effect by scaling width and height using trig functions
				const scaleX = Math.sin(p.rotation);
				const scaleY = Math.cos(p.rotation * 0.5);
				ctx.scale(scaleX, scaleY);
			}

			const colors = [
				"rgba(250, 204, 21, ",  // Gold
				"rgba(244, 143, 177, ", // Rose Gold / Pink
				"rgba(203, 213, 225, ", // Silver / Slate
				"rgba(254, 243, 199, ", // Champagne
				"rgba(96, 165, 250, ",  // Pastel Blue
			];
			const colorIndex = p.fadeSpeed !== undefined ? Math.floor(p.fadeSpeed) % colors.length : 0;
			const baseColor = colors[colorIndex];

			ctx.fillStyle = `${baseColor}${drawOpacity})`;

			ctx.beginPath();
			ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
			ctx.fill();

			ctx.restore();
		},
	},
	"shooting-stars": {
		maxParticles: 40,
		createY: (h, initY) =>
			initY ? Math.random() * h : Math.random() * h * 0.4,
		size: () => Math.random() * 1.2 + 0.6,
		speedX: () => 0,
		speedY: () => 0,
		opacity: () => Math.random() * 0.8 + 0.2,
		rotation: () => Math.random() * Math.PI * 2,
		rotationSpeed: () => Math.random() * 0.03 + 0.015,
		updatePhysics: (p, h) => {
			if (!p.fadeSpeed) {
				p.opacity += p.rotationSpeed || 0.02;
				if (p.opacity > 1 || p.opacity < 0.1) {
					p.rotationSpeed = -(p.rotationSpeed || 0.02);
				}
				if (Math.random() < 0.001) {
					p.fadeSpeed = 1;
					p.x = Math.random() * window.innerWidth * 0.5;
					p.y = Math.random() * h * 0.3;
					p.speedX = Math.random() * 6 + 5;
					p.speedY = Math.random() * 3 + 2.5;
					p.size = Math.random() * 1.5 + 1.5;
					p.opacity = 1;
				}
			} else {
				p.x += p.speedX;
				p.y += p.speedY;
				p.opacity -= 0.025;
			}
		},
		shouldReset: (p, w, h) => {
			if (p.fadeSpeed) {
				return p.x > w + 20 || p.y > h + 20 || p.opacity <= 0;
			}
			return false;
		},
		draw: (ctx, p) => {
			ctx.save();
			if (!p.fadeSpeed) {
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
				ctx.shadowBlur = p.size * 3;
				ctx.shadowColor = `rgba(255, 255, 255, ${p.opacity})`;
				ctx.fill();
			} else {
				const grad = ctx.createLinearGradient(
					p.x - p.speedX * 5,
					p.y - p.speedY * 5,
					p.x,
					p.y,
				);
				grad.addColorStop(0, "rgba(255, 255, 255, 0)");
				grad.addColorStop(1, `rgba(255, 255, 255, ${p.opacity})`);

				ctx.beginPath();
				ctx.moveTo(p.x - p.speedX * 5, p.y - p.speedY * 5);
				ctx.lineTo(p.x, p.y);
				ctx.strokeStyle = grad;
				ctx.lineWidth = p.size;
				ctx.lineCap = "round";
				ctx.stroke();

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
				ctx.fill();
			}
			ctx.restore();
		},
	},
	fireflies: {
		maxParticles: 16, // Reduced count to avoid screen clutter
		createY: (h) => Math.random() * h,
		size: () => Math.random() * 2 + 1.5,
		speedX: () => Math.random() * 0.4 - 0.2,
		speedY: () => Math.random() * 0.4 - 0.2,
		opacity: () => Math.random() * 0.8 + 0.2,
		rotation: () => Math.random() * Math.PI * 2,
		rotationSpeed: () => Math.random() * 0.04 - 0.02,
		updatePhysics: (p, h) => {
			if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
				p.rotation += p.rotationSpeed;
			}
			p.x += Math.cos(p.rotation || 0) * (p.size * 0.22);
			// Smooth flight wobble without using changing position variables in phase
			p.y += Math.sin(p.rotation || 0) * (p.size * 0.22) + Math.sin(Date.now() / 500 + p.size * 23.7) * 0.1;

			// Pulse opacity slowly and independently using static offset
			p.opacity = 0.15 + Math.abs(Math.sin(Date.now() / (1200 + p.size * 250) + (p.size * 47.3))) * 0.75;

			const w = window.innerWidth;
			if (p.x < -15) p.x = w + 15;
			else if (p.x > w + 15) p.x = -15;
			if (p.y < -15) p.y = h + 15;
			else if (p.y > h + 15) p.y = -15;
		},
		shouldReset: () => false,
		draw: (ctx, p) => {
			ctx.save();

			// Add a soft canvas glow
			ctx.shadowBlur = p.size * 4;
			ctx.shadowColor = `rgba(163, 230, 53, ${p.opacity * 0.8})`;

			const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4.5);
			glow.addColorStop(0, `rgba(255, 255, 220, ${p.opacity})`); // bright core
			glow.addColorStop(0.3, `rgba(190, 242, 100, ${p.opacity * 0.7})`); // lime core
			glow.addColorStop(0.8, `rgba(163, 230, 53, ${p.opacity * 0.25})`); // soft green halo
			glow.addColorStop(1, "rgba(163, 230, 53, 0)");

			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size * 4.5, 0, Math.PI * 2);
			ctx.fillStyle = glow;
			ctx.fill();

			// Bright center dot
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.95})`;
			ctx.fill();

			ctx.restore();
		},
	},
	balloons: {
		maxParticles: 12,
		createY: (h, initY) => (initY ? Math.random() * h : h + 30),
		size: () => Math.random() * 12 + 10,
		speedX: () => Math.random() * 0.3 - 0.15,
		speedY: () => -(Math.random() * 0.6 + 0.4),
		opacity: () => Math.random() * 0.3 + 0.6,
		rotation: () => Math.floor(Math.random() * 5), // Store permanent color index
		updatePhysics: (p) => {
			p.y += p.speedY;
			p.x += p.speedX + Math.sin(p.y / 50) * 0.3;
		},
		shouldReset: (p, w) => p.y < -50 || p.x < -30 || p.x > w + 30,
		draw: (ctx, p) => {
			ctx.save();
			ctx.translate(p.x, p.y);

			const size = p.size;
			const colors = [
				"rgba(244, 143, 177, ", // Pastel Pink
				"rgba(253, 230, 138, ", // Pastel Gold
				"rgba(147, 197, 253, ", // Pastel Blue
				"rgba(187, 247, 208, ", // Pastel Green
				"rgba(231, 229, 228, ", // Warm Silver
			];
			const colorIndex = p.rotation !== undefined ? Math.floor(p.rotation) % colors.length : 0;
			const baseColor = colors[colorIndex];

			ctx.beginPath();
			ctx.scale(1, 1.25);
			ctx.arc(0, 0, size, 0, Math.PI * 2);
			ctx.scale(1, 1 / 1.25);

			const grad = ctx.createRadialGradient(
				-size * 0.3,
				-size * 0.3,
				0,
				0,
				0,
				size * 1.2,
			);
			grad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
			grad.addColorStop(1, `${baseColor}${p.opacity})`);
			ctx.fillStyle = grad;
			ctx.fill();

			ctx.beginPath();
			ctx.moveTo(0, size * 1.2);
			ctx.lineTo(-size * 0.15, size * 1.4);
			ctx.lineTo(size * 0.15, size * 1.4);
			ctx.closePath();
			ctx.fillStyle = `${baseColor}${p.opacity * 0.9})`;
			ctx.fill();

			ctx.beginPath();
			ctx.moveTo(0, size * 1.4);
			ctx.bezierCurveTo(
				-size * 0.4,
				size * 2.1,
				size * 0.4,
				size * 2.9,
				0,
				size * 3.9,
			);
			ctx.strokeStyle = `rgba(180, 180, 180, ${p.opacity * 0.5})`;
			ctx.lineWidth = 1;
			ctx.stroke();

			ctx.restore();
		},
	},
};
