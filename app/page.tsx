"use client";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import initRobot from "@/components/3D/robot";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const ACCESS_OPTIONS = [
  { id: "mail", label: "Mail" },
  { id: "calendar", label: "Calendar" },
  { id: "bank", label: "Bank" },
  { id: "cloud", label: "Cloud" },
] as const;

type AccessOptionId = (typeof ACCESS_OPTIONS)[number]["id"];

const DEFAULT_ACCESS: Record<AccessOptionId, boolean> = {
  mail: true,
  calendar: true,
  bank: false,
  cloud: true,
};

export default function Home() {
  const [accessState, setAccessState] = useState(DEFAULT_ACCESS);

  useEffect(() => {
    const { renderer, destroy } = initRobot();

    return () => {
      destroy();
      if (renderer) {
        const gl = renderer.getContext();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        renderer.dispose();
      }
    };
  }, []);

  const scrollToStage = useCallback((stageLabel: "stage2" | "stage3") => {
    const trigger = ScrollTrigger.getById("hero-scroll");
    const scrollTarget = trigger?.labelToScroll(stageLabel);

    if (typeof scrollTarget === "number" && Number.isFinite(scrollTarget)) {
      // TWEAK: duration = total transition time (seconds). "power2.out" = fast start, gentle landing.
      gsap.to(window, {
        scrollTo: { y: scrollTarget, autoKill: false },
        duration: 2.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, []);

  const handleCta = useCallback(() => {
    scrollToStage("stage2");
  }, [scrollToStage]);

  const handleChooseSubscription = useCallback(() => {
    scrollToStage("stage3");
  }, [scrollToStage]);

  const handleAccessToggle = useCallback((key: AccessOptionId) => {
    setAccessState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const enabledAccessCount = useMemo(
    () => Object.values(accessState).filter(Boolean).length,
    [accessState],
  );

  return (
    <div className="page">
      <section className="hero_main" data-stage="1">
        <canvas className="robot-3D" />

        <div className="hero_overlay">
          <section className="stage stage_intro">
            <div className="content">
              <h1>Cyber Twin</h1>

              <p>The version of you that never sleeps.</p>

              <button type="button" className="cta_btn" onClick={handleCta}>
                Get started.
              </button>
            </div>
          </section>

          <section
            className="stage stage_access"
            aria-label="Cybertwin access controls"
          >
            <h2 className="stage_header">Let your twin handle it.</h2>

            <div className="phone_mockup">
              <Image
                src="/phone.png"
                alt="Cyber Twin chat conversation on a phone"
                width={340}
                height={680}
                priority
              />
            </div>

            <div className="glass_panel">
              <p className="glass_eyebrow">Access permissions</p>
              <h3>Control What Your Cybertwin Can Reach</h3>
              <p className="glass_copy">
                Toggle data scopes before your twin starts working.
              </p>

              <div className="access_grid">
                {ACCESS_OPTIONS.map((option) => {
                  const isEnabled = accessState[option.id];

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`access_chip ${isEnabled ? "is_enabled" : ""}`}
                      aria-pressed={isEnabled}
                      onClick={() => handleAccessToggle(option.id)}
                    >
                      {option.label}
                      <span>{isEnabled ? "On" : "Off"}</span>
                    </button>
                  );
                })}
              </div>

              <p className="glass_meta">
                {enabledAccessCount}/4 active integrations
              </p>
              <button
                type="button"
                className="cta_btn choose_subscription_btn"
                onClick={handleChooseSubscription}
              >
                Choose subscription
              </button>
            </div>
          </section>

          <section className="stage stage_pricing" aria-label="Pricing">
            <h2 className="stage_header stage_header_value">
              Your Cybertwin can handle any digital task for you.
            </h2>

            <div className="pricing_card">
              <p className="pricing_eyebrow">Pricing</p>
              <h3>One Twin. Infinite Hours Back.</h3>
              <p className="price">
                $49<span>/month</span>
              </p>
              <ul>
                <li>Unified inbox and calendar execution</li>
                <li>Cloud task planning and follow-through</li>
                <li>Bank-safe action requests and approvals</li>
              </ul>
              <button type="button" className="cta_btn pricing_cta">
                Start 14-day trial
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
