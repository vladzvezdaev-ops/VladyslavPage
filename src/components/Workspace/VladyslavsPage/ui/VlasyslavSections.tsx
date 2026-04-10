import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import styles from "./VlasyslavSections.module.scss";

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const SmartText = ({ text }: { text: string }) => {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    const parentCard = el?.closest(`.${styles.card}`);
    if (!el || !parentCard) return;

    let frameId: number;
    let isGlitching = false;

    const startGlitch = () => {
      if (isGlitching) return;
      isGlitching = true;
      let iteration = 0;
      const animate = () => {
        el.innerText = text
          .split("")
          .map((char, index) => {
            if (index < iteration) return text[index];
            if (char === " ") return " ";
            return GLITCH_CHARS[
              Math.floor(Math.random() * GLITCH_CHARS.length)
            ];
          })
          .join("");
        iteration += 1 / 2;
        if (iteration < text.length) frameId = requestAnimationFrame(animate);
        else {
          el.innerText = text;
          isGlitching = false;
        }
      };
      frameId = requestAnimationFrame(animate);
    };

    parentCard.addEventListener("mouseenter", startGlitch);
    parentCard.addEventListener("click", startGlitch);

    return () => {
      parentCard.removeEventListener("mouseenter", startGlitch);
      parentCard.removeEventListener("click", startGlitch);
      cancelAnimationFrame(frameId);
    };
  }, [text]);

  return <span ref={textRef}>{text}</span>;
};

const CustomCursor = () => {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const springX = useSpring(mouseX, { damping: 30, stiffness: 300 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 300 });

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);

    const move = (e: PointerEvent) => {
      if (!isVisible) setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      const target = e.target as HTMLElement;
      const hovered = !!target.closest(
        `.${styles.card}, .${styles.homeBtn}, .${styles.socialLink}`,
      );
      setIsHovered(hovered);
    };

    const handleLeave = () => setIsVisible(false);
    const handleEnter = () => setIsVisible(true);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move);
    document.addEventListener("pointerleave", handleLeave);
    document.addEventListener("pointerenter", handleEnter);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.removeEventListener("pointerleave", handleLeave);
      document.removeEventListener("pointerenter", handleEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  if (isTouch) return null;

  return (
    <motion.div
      className={`${styles.customCursor} ${isHovered ? styles.cursorHovered : ""}`}
      style={{
        x: springX,
        y: springY,
        opacity: isVisible ? 1 : 0,
      }}
    />
  );
};

const TiltCard = ({
  card,
  constraintsRef,
}: {
  card: any;
  constraintsRef: any;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [15, -15]), {
    stiffness: 150,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-15, 15]), {
    stiffness: 150,
    damping: 25,
  });

  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.1}
      dragMomentum={true}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - (rect.left + rect.width / 2));
        y.set(e.clientY - (rect.top + rect.height / 2));
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={styles.card}
      style={{
        left: card.x,
        top: card.y,
        rotateX,
        rotateY,
        touchAction: "none",
      }}
      whileDrag={{ scale: 1.05, zIndex: 100 }}
    >
      <div className={styles.cardContent}>
        <h3>
          <SmartText text={card.title} />
        </h3>
        <p>
          <SmartText text={card.content} />
        </p>
      </div>
    </motion.div>
  );
};

export const VladyslavSections = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 200);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: any[] = [];
    let waves: any[] = [];
    let mouse = { x: -1000, y: -1000 };
    let startPos = { x: 0, y: 0 };
    let isMoving = false;
    let animationId: number;

    class Particle {
      x: number;
      y: number;
      bx: number;
      by: number;
      vx: number = 0;
      vy: number = 0;
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.bx = x;
        this.by = y;
      }
      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < 120) {
          const f = (120 - d) / 120;
          this.vx -= (dx / d) * f * 0.8;
          this.vy -= (dy / d) * f * 0.8;
        }

        waves.forEach((w) => {
          const dxw = w.x - this.x;
          const dyw = w.y - this.y;
          const dw = Math.sqrt(dxw * dxw + dyw * dyw);
          if (dw < w.r && dw > w.r - 80) {
            const f = (80 - (w.r - dw)) / 80;
            this.vx -= (dxw / dw) * f * 15;
            this.vy -= (dyw / dw) * f * 15;
          }
        });

        this.vx += (this.bx - this.x) * 0.05;
        this.vy += (this.by - this.y) * 0.05;
        this.vx *= 0.9;
        this.vy *= 0.9;
        this.x += this.vx;
        this.y += this.vy;
      }
      draw() {
        if (!ctx) return;
        ctx.fillStyle = "rgba(0, 255, 204, 0.45)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const spacing = window.innerWidth < 768 ? 24 : 35;
      for (let y = 0; y < canvas.height; y += spacing) {
        for (let x = 0; x < canvas.width; x += spacing) {
          particles.push(new Particle(x, y));
        }
      }
    };

    const anim = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      waves.forEach((w, i) => {
        w.r += 18;
        if (w.r > 2000) waves.splice(i, 1);
      });
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(anim);
    };

    init();
    anim();

    const handleDown = (e: PointerEvent) => {
      startPos = { x: e.clientX, y: e.clientY };
      isMoving = false;
    };

    const handleMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (
        Math.abs(e.clientX - startPos.x) > 5 ||
        Math.abs(e.clientY - startPos.y) > 5
      ) {
        isMoving = true;
      }
    };

    const handleUp = (e: PointerEvent) => {
      if (!isMoving && (e.target as HTMLElement).tagName === "CANVAS") {
        waves.push({ x: e.clientX, y: e.clientY, r: 0 });
      }
    };

    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("resize", init);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationId);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <section className={styles.wrapper} ref={constraintsRef}>
      <CustomCursor />

      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="liquid-glass">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="50"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.centerContainer}>
        <div className={styles.content}>
          <h1 className={styles.title}>WELCOME TO</h1>
          <h2 className={styles.subtitle}>VLADYSLAV’S WORKSPACE</h2>
        </div>
      </div>

      {/* Заменили Link из Next.js на обычную ссылку <a> или компонент из react-router-dom */}
      <a href="/" className={styles.homeBtn}>
        BACK TO MAIN
      </a>

      {isReady &&
        [
          {
            id: 1,
            title: "Projects",
            content: "Explore my digital universe and latest works.",
            x: "10%",
            y: "20%",
          },
          {
            id: 2,
            title: "Skills",
            content:
              "React, Next.js, Framer Motion, TypeScript, Sanity, Vercel, UX-UI Engineering.",
            x: "65%",
            y: "15%",
          },
          {
            id: 3,
            title: "Contact",
            content:
              "Available for high-end collaborations and innovative digital solutions.",
            x: "40%",
            y: "60%",
          },
        ].map((card) => (
          <TiltCard key={card.id} card={card} constraintsRef={constraintsRef} />
        ))}

      <div className={styles.socialsWrapper}>
        <div className={styles.socialsContainer}>
          {[
            { label: "GITHUB", url: "https://github.com/vladzvezdaev-ops" },
            { label: "LINKEDIN", url: "https://linkedin.com" },
          ].map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <div className={styles.linkEnergy}>
                {[
                  { d: "0s", a: "-11deg", x: "-7px" },
                  { d: "0.4s", a: "8deg", x: "8px" },
                  { d: "0.9s", a: "-5deg", x: "5px" },
                  { d: "1.4s", a: "14deg", x: "-8px" },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className={styles.energyCore}
                    style={
                      { "--delay": s.d, "--angle": s.a, "--x": s.x } as any
                    }
                  />
                ))}
              </div>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
