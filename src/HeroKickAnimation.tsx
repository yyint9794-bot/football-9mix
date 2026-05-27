/** Hero နောက်ခံ — ဘောလုံးကန်နေသော live animation */
export function HeroKickAnimation() {
  return (
    <div className="hero-kick-layer" aria-hidden="true">
      <div className="hero-kick-orbit">
        <span className="hero-kick-ball" />
        <span className="hero-kick-boot" />
      </div>
      <span className="hero-kick-trail" />
      <span className="hero-kick-glow" />
    </div>
  );
}
