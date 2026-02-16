"use client"
import { useCallback, useEffect } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";

import initRobot from "@/components/3D/robot"

gsap.registerPlugin(ScrollToPlugin);

export default function Home() {

  useEffect(() => {
    const {scene, renderer} = initRobot()
    
    return () => {
      if (renderer) {
        const gl = renderer.getContext();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        renderer.dispose()
      }
    }
  }, [])

  const handleCta = useCallback(() => {
    const hero = document.querySelector(".hero_main") as HTMLElement | null;
    if (!hero) return;
    const scrollTarget = hero.offsetTop + hero.offsetHeight;
    gsap.to(window, {
      scrollTo: { y: scrollTarget, autoKill: false },
      duration: 1.6,
      ease: "power2.inOut",
    });
  }, []);
  
  return (
    <div className="page">
      <section className="hero_main">
        <div className="content">
          <h1>Cyber Twin</h1>

          <p>
            The version of you that never sleeps.
          </p>

          <button className="cta_btn" onClick={handleCta}>Get started.</button>
        </div>
        <canvas className="robot-3D" />
      </section>
    </div>
  );
}
