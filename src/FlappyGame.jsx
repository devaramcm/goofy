import { useEffect, useRef } from "react";

export default function FlappyGame() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 📱 Responsive canvas
    canvas.width = Math.min(window.innerWidth, 400);
    canvas.height = Math.min(window.innerHeight, 600);

    // ===== ASSETS =====
    const birdImg = new Image();
    birdImg.src = "/face.png";

    const jumpSound = new Audio("/jump.mp3");
    const crashSound = new Audio("/crash.mp3");

    let audioUnlocked = false;

    function unlockAudio() {
      if (!audioUnlocked) {
        jumpSound.play().catch(() => {});
        crashSound.play().catch(() => {});
        jumpSound.pause();
        crashSound.pause();
        audioUnlocked = true;
      }
    }

    // ===== GAME STATE =====
    let bird = {
      x: 80,
      y: 200,
      width: 50,
      height: 50,
      gravity: 0.15,
      lift: -4.5,
      velocity: 0
    };

    let pipes = [];
    let pipeWidth = 60;
    let gap = 250;
    let score = 0;
    let gameOver = false;

    let spawnTimer = 0;
    let gameOverTime = 0;
    const restartDelay = 2000;

    // ===== INPUT =====
    function handleAction() {
      if (!audioUnlocked) unlockAudio();

      if (gameOver) {
        const now = Date.now();
        if (now - gameOverTime < restartDelay) return;

        // RESET
        bird.y = 200;
        bird.velocity = 0;
        pipes = [];
        score = 0;
        spawnTimer = 0;
        gameOver = false;
        return;
      }

      bird.velocity = bird.lift;

      if (audioUnlocked) {
        jumpSound.currentTime = 0;
        jumpSound.play().catch(() => {});
      }
    }

    function handleKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        handleAction();
      }
    }

    function handleTouch(e) {
      e.preventDefault();
      handleAction();
    }

    window.addEventListener("keydown", handleKey);
    window.addEventListener("click", unlockAudio);
    canvas.addEventListener("touchstart", handleTouch);
    canvas.addEventListener("mousedown", handleTouch);

    // ===== GAME LOGIC =====
    function createPipe() {
      let top = Math.random() * 300 + 50;
      pipes.push({
        x: canvas.width,
        top,
        bottom: top + gap,
        passed: false
      });
    }

    function update(delta) {
      if (gameOver) return;

      // bird physics
      bird.velocity += bird.gravity * delta;
      bird.y += bird.velocity * delta;

      // spawn pipes
      spawnTimer += delta;
      if (spawnTimer > 120) {
        createPipe();
        spawnTimer = 0;
      }

      pipes.forEach(pipe => {
        pipe.x -= 1.2 * delta;

        // collision
        if (
          bird.x < pipe.x + pipeWidth &&
          bird.x + bird.width > pipe.x &&
          (bird.y < pipe.top || bird.y + bird.height > pipe.bottom)
        ) {
          gameOver = true;
          gameOverTime = Date.now();

          if (audioUnlocked) {
            crashSound.currentTime = 0;
            crashSound.play().catch(() => {});
          }
        }

        // score
        if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
          score++;
          pipe.passed = true;
        }
      });

      // ground / ceiling
      if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver = true;
        gameOverTime = Date.now();

        if (audioUnlocked) {
          crashSound.currentTime = 0;
          crashSound.play().catch(() => {});
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // bird
      ctx.save();
      ctx.translate(bird.x + 25, bird.y + 25);
      ctx.rotate(bird.velocity * 0.05);
      ctx.drawImage(birdImg, -25, -25, 50, 50);
      ctx.restore();

      // pipes
      ctx.fillStyle = "green";
      pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height);
      });

      // score
      ctx.fillStyle = "white";
      ctx.font = "24px Arial";
      ctx.fillText("Score: " + score, 10, 30);

      // UI
      if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", 60, 280);

        const remaining = Math.ceil(
          (restartDelay - (Date.now() - gameOverTime)) / 1000
        );

        ctx.font = "20px Arial";

        if (remaining > 0) {
          ctx.fillText("Wait " + remaining + "s...", 140, 320);
        } else {
          ctx.fillText("Tap / SPACE to Restart", 60, 320);
        }
      }
    }

    // ===== LOOP (FIXED) =====
    let lastTime = 0;

    function loop(time) {
      if (!lastTime) lastTime = time;

      const delta = (time - lastTime) / 16.67;
      lastTime = time;

      update(delta);
      draw();

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    // ===== CLEANUP =====
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("click", unlockAudio);
      canvas.removeEventListener("touchstart", handleTouch);
      canvas.removeEventListener("mousedown", handleTouch);
    };
  }, []);

  return (
    <div style={{ textAlign: "center", touchAction: "none" }}>
      <h2>Troll Flappy Bird 😈</h2>
      <canvas ref={canvasRef} />
    </div>
  );
}