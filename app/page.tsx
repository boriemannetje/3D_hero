"use client";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";

import initRobot from "@/components/3D/robot";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const GOOGLE_FORM_ID = "1FAIpQLSfszxEnXCUbqPpZj1dPVTPyQnk6AH9OqhJSpWJ_ul4nO2mjYg";
const WAITLIST_FORM_URL =
  process.env.NEXT_PUBLIC_WAITLIST_FORM_VIEW_URL ??
  `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/viewform?usp=send_form`;
const WAITLIST_FORM_EMBED_URL =
  process.env.NEXT_PUBLIC_WAITLIST_FORM_EMBED_URL ??
  `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/viewform?embedded=true`;
const WAITLIST_FORM_ACTION =
  process.env.NEXT_PUBLIC_WAITLIST_FORM_ACTION ??
  `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`;
const WAITLIST_EMAIL_FIELD =
  process.env.NEXT_PUBLIC_WAITLIST_EMAIL_ENTRY?.trim() ||
  process.env.NEXT_PUBLIC_WAITLIST_EMAIL_FIELD?.trim() ||
  "entry.372925248";

const SOCIAL_LINKS = [
  {
    href: "https://www.linkedin.com/in/boris-de-wit-5ab536200/",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.94 8.5H3.56V20h3.38V8.5Zm.22-3.55A1.96 1.96 0 1 0 3.24 5a1.96 1.96 0 0 0 3.92-.05ZM20.76 13.41c0-3.45-1.84-5.05-4.28-5.05a3.68 3.68 0 0 0-3.32 1.83V8.5H9.78V20h3.38v-6.4c0-1.68.32-3.31 2.4-3.31 2.05 0 2.08 1.92 2.08 3.42V20H21v-6.59h-.24Z" />
      </svg>
    ),
  },
  {
    href: "https://instagram.com/borvibe",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 7.22A4.78 4.78 0 1 0 16.78 12 4.78 4.78 0 0 0 12 7.22Zm0 7.89A3.11 3.11 0 1 1 15.11 12 3.11 3.11 0 0 1 12 15.11Zm6.09-8.08a1.11 1.11 0 1 1-1.11-1.11 1.11 1.11 0 0 1 1.11 1.11Zm3.15 1.12a5.49 5.49 0 0 0-1.5-3.88A5.53 5.53 0 0 0 15.86 2.8C14.33 2.71 9.67 2.71 8.14 2.8A5.52 5.52 0 0 0 4.27 4.27a5.49 5.49 0 0 0-1.5 3.88c-.09 1.53-.09 6.17 0 7.7a5.49 5.49 0 0 0 1.5 3.88 5.53 5.53 0 0 0 3.87 1.47c1.53.09 6.19.09 7.72 0a5.53 5.53 0 0 0 3.88-1.47 5.49 5.49 0 0 0 1.5-3.88c.09-1.53.09-6.17 0-7.7Zm-1.99 9.35a3.14 3.14 0 0 1-1.77 1.77c-1.23.49-4.14.38-5.48.38s-4.26.11-5.49-.38a3.14 3.14 0 0 1-1.77-1.77c-.48-1.22-.37-4.14-.37-5.48s-.11-4.26.37-5.48a3.14 3.14 0 0 1 1.77-1.77c1.23-.49 4.15-.38 5.49-.38s4.25-.11 5.48.38a3.14 3.14 0 0 1 1.77 1.77c.49 1.22.38 4.14.38 5.48s.11 4.26-.38 5.48Z" />
      </svg>
    ),
  },
  {
    href: "https://x.com/borvibe",
    label: "X",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.9 2.25h3.03l-6.62 7.57L23.1 21.75h-6.1l-4.78-6.98-6.1 6.98H3.1l7.08-8.1L.9 2.25h6.25l4.32 6.35 5.43-6.35Zm-1.07 17.53h1.68L6.22 4.12H4.42l13.4 15.66Z" />
      </svg>
    ),
  },
] as const;

type SubmissionState = "idle" | "success" | "error";

export default function Home() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const pendingSubmissionRef = useRef(false);
  const iframeHasLoadedRef = useRef(false);
  const submitTimeoutRef = useRef<number | null>(null);

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

  const scrollToStage = useCallback((stageLabel: "stage2") => {
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

  const completeSubmission = useCallback((nextState: SubmissionState) => {
    pendingSubmissionRef.current = false;
    if (submitTimeoutRef.current !== null) {
      window.clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
    setIsSubmitting(false);
    setSubmissionState(nextState);
    if (nextState === "success") {
      formRef.current?.reset();
    }
  }, []);

  const handleWaitlistSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      if (isSubmitting) {
        event.preventDefault();
        return;
      }

      const form = event.currentTarget;
      const emailInput = form.querySelector<HTMLInputElement>("#waitlist_email");
      const email = emailInput?.value.trim();

      if (!email) {
        event.preventDefault();
        return;
      }

      setIsSubmitting(true);
      setSubmissionState("idle");
      pendingSubmissionRef.current = true;

      if (submitTimeoutRef.current !== null) {
        window.clearTimeout(submitTimeoutRef.current);
      }

      submitTimeoutRef.current = window.setTimeout(() => {
        if (pendingSubmissionRef.current) {
          completeSubmission("error");
        }
      }, 10000);
    },
    [completeSubmission, isSubmitting],
  );

  const handleHiddenFrameLoad = useCallback(() => {
    if (!iframeHasLoadedRef.current) {
      iframeHasLoadedRef.current = true;
      return;
    }

    if (pendingSubmissionRef.current) {
      completeSubmission("success");
    }
  }, [completeSubmission]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current !== null) {
        window.clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

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
                Join waitlist.
              </button>
            </div>
          </section>

          <section
            className="stage stage_waitlist"
            aria-label="Join Cyber Twin waitlist"
          >
            <h2 className="stage_header">We are building. Get early access first.</h2>

            <iframe
              title="Hidden Google waitlist form"
              name="waitlist_google_form_iframe"
              src={WAITLIST_FORM_EMBED_URL}
              className="waitlist_iframe_hidden"
              tabIndex={-1}
              aria-hidden="true"
              onLoad={handleHiddenFrameLoad}
            />

            <div className="glass_panel waitlist_panel">
              <p className="glass_eyebrow">Early access</p>
              <h3>Join The Cyber Twin Waitlist</h3>
              <p className="glass_copy">
                Drop your email and we will send your invite as soon as the next
                build is ready.
              </p>

              <form
                ref={formRef}
                className="waitlist_form"
                action={WAITLIST_FORM_ACTION}
                method="POST"
                target="waitlist_google_form_iframe"
                onSubmit={handleWaitlistSubmit}
              >
                <label htmlFor="waitlist_email" className="sr_only">
                  Email address
                </label>
                <input
                  id="waitlist_email"
                  name={WAITLIST_EMAIL_FIELD}
                  type="email"
                  className="waitlist_input"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
                <button type="submit" className="cta_btn waitlist_submit_btn">
                  {isSubmitting ? "Joining..." : "Join waitlist"}
                </button>
              </form>

              <p className="glass_meta">
                {submissionState === "success"
                  ? "You are in. We will contact you with updates."
                  : submissionState === "error"
                    ? "Could not confirm submission. Use the Google Form link below."
                    : "No spam. Only product updates and invite drops."}
              </p>

              <a
                href={WAITLIST_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="waitlist_link"
              >
                Open Google Form
              </a>

              <div className="social_row" aria-label="Social links">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="social_btn"
                    aria-label={social.label}
                    title={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
