/* K2Labs experience player — small, self-contained narrated stage.
 * A page embeds: <div class="exp" data-slug="home" data-lang="en" data-base="/k2labs-website"> ... </div>
 * The player reads exp/<slug>/<lang>/config.json, plays beat audio in order,
 * animates the stage per beat, and lets the reader pause, step, scrub and resume.
 */
(function () {
  function init(el) {

    const slug = el.dataset.slug;
    const lang = el.dataset.lang || "en";
    const BASE = (el.dataset.base || window.__K2_BASE__ || "").replace(/\/$/, "");

    const stage = el.querySelector(".stage");
    const bar = el.querySelector(".caption-bar");
    const timeEl = el.querySelector(".exp-time");
    const slider = el.querySelector(".exp-scrub");
    const playBtn = el.querySelector(".exp-play");
    const prevBtn = el.querySelector(".exp-prev");
    const nextBtn = el.querySelector(".exp-next");
    const capBtn = el.querySelector(".exp-captions");

    let beats = [];
    let cum = [];
    let total = 0;
    let idx = 0;
    let offset = 0;
    let playing = false;
    let audios = null;

    const storeKey = `k2exp:${slug}:${lang}`;

    const fmt = (s) => {
      const m = Math.floor(s / 60);
      const r = Math.floor(s % 60);
      return `${m}:${String(r).padStart(2, "0")}`;
    };

    const setStage = (i) => {
      if (stage) {
        stage.className.baseVal = `stage beat-${i + 1}`;
        stage.querySelectorAll("[data-show]").forEach((g) => {
          g.classList.toggle("on", i + 1 >= Number(g.dataset.show));
        });
        stage.querySelectorAll("[data-active]").forEach((g) => {
          g.classList.toggle("active", i + 1 === Number(g.dataset.active));
        });
      }
    };

    const setCaption = (i) => {
      if (bar && beats[i]) bar.textContent = beats[i].caption;
    };

    const updateTime = (t) => {
      if (timeEl) timeEl.textContent = `${fmt(t)} / ${fmt(total)}`;
      if (slider) slider.value = String(t);
    };

    const updateUI = () => {
      updateTime(cum[idx] + offset);
      setCaption(idx);
      setStage(idx);
    };

    let saveTimer = null;
    const save = (t) => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        try { localStorage.setItem(storeKey, String(Math.min(t, total))); } catch (e) {}
      }, 400);
    };

    const stopAll = () => {
      if (!audios) return;
      playing = false;
      playBtn?.setAttribute("aria-pressed", "false");
      audios.forEach((a) => { try { a.pause(); } catch (e) {} });
    };

    const startAt = (i, off) => {
      if (!audios) return;
      stopAll();
      idx = Math.max(0, Math.min(i, beats.length - 1));
      offset = Math.max(0, Math.min(off, beats[idx].dur));
      const a = audios[idx];
      a.currentTime = Math.min(offset, Number.isFinite(a.duration) ? a.duration : beats[idx].dur);
      playing = true;
      playBtn?.setAttribute("aria-pressed", "true");
      updateUI();

      a.play().then(() => {
  
      }).catch((e) => {
        playing = false;
        playBtn?.setAttribute("aria-pressed", "false");

      });
    };

    const seek = (t) => {
      t = Math.max(0, Math.min(t, total));
      let i = 0;
      for (let k = 0; k < cum.length; k++) if (t >= cum[k]) i = k;
      startAt(i, Math.max(0, t - cum[i]));
      save(t);
    };

    const bindAudio = (i) => {
      const a = audios[i];
      a.addEventListener("timeupdate", () => {

        if (i !== idx || !playing) return;
        offset = a.currentTime;
        updateTime(cum[i] + offset);
        save(cum[i] + offset);
      });
      a.addEventListener("ended", () => {

        if (i !== idx) return;
        if (i + 1 < beats.length) startAt(i + 1, 0);
        else { stopAll(); offset = beats[i].dur; updateUI(); save(total); }
      });
    };

    playBtn?.addEventListener("click", () => {
      if (playing) { stopAll(); return; }
      startAt(idx, offset);
    });
    prevBtn?.addEventListener("click", () => {
      if (idx === 0) { seek(0); return; }
      startAt(idx - 1, 0);
    });
    nextBtn?.addEventListener("click", () => {
      if (idx + 1 >= beats.length) { seek(total); return; }
      startAt(idx + 1, 0);
    });
    slider?.addEventListener("input", (e) => seek(Number(e.target.value)));
    capBtn?.addEventListener("click", () => {
      if (!bar) return;
      const off = bar.classList.toggle("captions-off");
      capBtn.setAttribute("aria-pressed", String(!off));
    });

    document.addEventListener("keydown", (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); playBtn?.click(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prevBtn?.click(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); nextBtn?.click(); }
    });

    el.querySelectorAll("[data-seek]").forEach((n) => {
      n.addEventListener("click", () => {
        const i = Number(n.dataset.seek) - 1;
        startAt(i, 0);
        save(cum[i]);
      });
      n.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); n.click(); }
      });
    });

    el.querySelectorAll("[data-reveal]").forEach((n) => {
      const target = el.querySelector(n.dataset.reveal);
      if (!target) return;
      n.addEventListener("click", () => {
        target.classList.add("revealed");
        n.setAttribute("aria-expanded", "true");
      });
    });

    fetch(`${BASE}/exp/${slug}/${lang}/config.json`)
      .then((r) => r.json())
      .then((cfg) => {
        beats = cfg.beats || [];
        if (!beats.length) throw new Error("empty config");
        total = beats.reduce((s, b) => s + b.dur, 0);
        cum = beats.map((b, i) => beats.slice(0, i).reduce((s, x) => s + x.dur, 0));


        audios = beats.map((b) => {
          const a = new Audio(`${BASE}/exp/${slug}/${b.audio}`);
          a.preload = "auto";
          return a;
        });
        audios.forEach((a, i) => bindAudio(i));


        if (slider) { slider.max = String(total); slider.value = "0"; }

        const saved = Number(localStorage.getItem(storeKey) || 0);
        if (saved > 0 && saved < total) {
          let i = 0;
          for (let k = 0; k < cum.length; k++) if (saved >= cum[k]) i = k;
          idx = i;
          offset = saved - cum[i];
          playing = false;
          updateUI();
          if (timeEl) timeEl.textContent = `${fmt(saved)} / ${fmt(total)} · resume`;
        } else {
          idx = 0; offset = 0; playing = false;
          updateUI();
        }
      })
      .catch(() => {
        if (bar) bar.textContent = "Narration is not available here.";
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".exp").forEach(init);
  });
})();
