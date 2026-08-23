import { useEffect, useRef, useState } from "react";
import pixelCat from "../assets/pixel-cat.gif";

export default function CatCompanion() {
  const hasFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  const [position, setPosition] = useState({ left: "50vw", top: "55vh" });
  const [sleeping, setSleeping] = useState(false);
  const [frozenFrame, setFrozenFrame] = useState(null);
  const [spin, setSpin] = useState("");
  const [direction, setDirection] = useState("left");
  const catImage = useRef(null);
  const sleepingRef = useRef(false);
  const lastPointerX = useRef(null);
  const sleepTimer = useRef(null);
  const frame = useRef(null);
  const spinResetTimer = useRef(null);

  useEffect(() => {
    if (!hasFinePointer) return undefined;

    const fallAsleep = () => {
      if (sleepingRef.current) return;
      const image = catImage.current;
      if (image?.naturalWidth) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          canvas.getContext("2d")?.drawImage(image, 0, 0);
          setFrozenFrame(canvas.toDataURL("image/png"));
        } catch {
          // The sleep pose still works if the browser cannot capture a GIF frame.
        }
      }
      sleepingRef.current = true;
      setSleeping(true);
      setSpin("");
    };
    const scheduleSleep = () => {
      clearTimeout(sleepTimer.current);
      sleepTimer.current = setTimeout(fallAsleep, 3_000);
    };

    const followPointer = (event) => {
      const { clientX, clientY } = event;
      if (
        lastPointerX.current !== null &&
        Math.abs(clientX - lastPointerX.current) > 3
      ) {
        setDirection(clientX > lastPointerX.current ? "right" : "left");
      }
      lastPointerX.current = clientX;
      sleepingRef.current = false;
      setSleeping(false);
      setFrozenFrame(null);
      scheduleSleep();

      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const xPadding = Math.min(64, window.innerWidth / 2);
        const yPadding = Math.min(64, window.innerHeight / 2);
        const x = Math.min(Math.max(clientX, xPadding), window.innerWidth - xPadding);
        const y = Math.min(Math.max(clientY, yPadding), window.innerHeight - yPadding);
        setPosition({ left: `${x}px`, top: `${y}px` });
      });
    };

    window.addEventListener("pointermove", followPointer, { passive: true });
    window.addEventListener("pointerdown", followPointer, { passive: true });
    scheduleSleep();

    const spinTimer = setInterval(() => {
      if (!sleepingRef.current && Math.random() < 0.45) {
        setSpin(Math.random() < 0.5 ? "left" : "right");
        clearTimeout(spinResetTimer.current);
        spinResetTimer.current = setTimeout(() => setSpin(""), 800);
      }
    }, 4300);

    return () => {
      clearTimeout(sleepTimer.current);
      clearTimeout(spinResetTimer.current);
      clearInterval(spinTimer);
      cancelAnimationFrame(frame.current);
      window.removeEventListener("pointermove", followPointer);
      window.removeEventListener("pointerdown", followPointer);
    };
  }, [hasFinePointer]);

  if (!hasFinePointer) return null;

  return (
    <div
      className={`cat-companion cat-companion--facing-${direction} ${sleeping ? "cat-companion--sleeping" : ""} ${spin ? `cat-companion--spin-${spin}` : ""}`}
      style={position}
      aria-hidden="true"
    >
      <img
        ref={catImage}
        className="cat-companion__cat"
        src={frozenFrame ?? pixelCat}
        alt=""
      />
      {sleeping && <span className="cat-companion__sleep">z z</span>}
    </div>
  );
}
