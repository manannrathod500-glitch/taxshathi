import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Marquee from 'react-fast-marquee';
import { Shield, MessageCircle, Zap, Globe, CheckCircle, ArrowDown, Star, Menu, X, ChevronRight, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SalesChatWidget from '@/components/SalesChatWidget';

gsap.registerPlugin(ScrollTrigger);

// ── THREE.JS HERO SCENE ──────────────────────────────────────────────────────
const HeroScene = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Stars/particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 35;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x86efac, size: 0.04, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Green orbital particles
    const orbGeo = new THREE.BufferGeometry();
    const orbCount = 80;
    const orbPos = new Float32Array(orbCount * 3);
    for (let i = 0; i < orbCount; i++) {
      const angle = (i / orbCount) * Math.PI * 2;
      const r = 3.5 + Math.random() * 1.5;
      orbPos[i * 3] = Math.cos(angle) * r;
      orbPos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      orbPos[i * 3 + 2] = Math.sin(angle) * r;
    }
    orbGeo.setAttribute('position', new THREE.BufferAttribute(orbPos, 3));
    const orbParticles = new THREE.Points(orbGeo, new THREE.PointsMaterial({ color: 0x16a34a, size: 0.1, transparent: true, opacity: 0.85 }));
    scene.add(orbParticles);

    // Shield shape
    const shield = new THREE.Shape();
    shield.moveTo(0, 2.2);
    shield.bezierCurveTo(0.6, 2.2, 1.7, 1.7, 1.7, 0.7);
    shield.bezierCurveTo(1.7, -0.4, 1.1, -1.3, 0, -2.3);
    shield.bezierCurveTo(-1.1, -1.3, -1.7, -0.4, -1.7, 0.7);
    shield.bezierCurveTo(-1.7, 1.7, -0.6, 2.2, 0, 2.2);
    const shieldGeo = new THREE.ExtrudeGeometry(shield, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4 });
    shieldGeo.center();
    const shieldMat = new THREE.MeshPhysicalMaterial({ color: 0x16a34a, emissive: 0x0d4d20, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.2, transparent: true, opacity: 0.92 });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    scene.add(shieldMesh);

    // Glow rings
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.5 }));
    ring1.rotation.x = Math.PI / 2;
    scene.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.012, 8, 64), new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.25 }));
    ring2.rotation.x = Math.PI / 2.2;
    scene.add(ring2);

    // Golden coins (cylinders)
    const coins = [];
    for (let i = 0; i < 20; i++) {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.07, 20),
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.95, roughness: 0.05, emissive: 0x7c4d0d, emissiveIntensity: 0.25 })
      );
      coin.position.set((Math.random() - 0.5) * 18, Math.random() * 14 + 5, (Math.random() - 0.5) * 6 - 1);
      coin.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.4, Math.random() * Math.PI, 0);
      coin.userData = { speed: Math.random() * 0.018 + 0.006, rotSpeed: (Math.random() - 0.5) * 0.025 };
      scene.add(coin);
      coins.push(coin);
    }

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dl = new THREE.DirectionalLight(0x16a34a, 3); dl.position.set(4, 4, 6); scene.add(dl);
    const pl = new THREE.PointLight(0x16a34a, 5, 18); pl.position.set(0, 0, 5); scene.add(pl);
    const gl = new THREE.PointLight(0xF59E0B, 1.5, 22); gl.position.set(-6, 6, 4); scene.add(gl);

    let animId, t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.012;
      shieldMesh.rotation.y += 0.007;
      shieldMesh.rotation.x = Math.sin(t * 0.28) * 0.06;
      shieldMat.emissiveIntensity = 0.45 + Math.sin(t * 0.55) * 0.22;
      ring1.rotation.z += 0.004;
      ring2.rotation.z -= 0.003;
      orbParticles.rotation.y += 0.0012;
      coins.forEach(c => {
        c.position.y -= c.userData.speed;
        c.rotation.y += c.userData.rotSpeed;
        if (c.position.y < -7) { c.position.y = 12 + Math.random() * 5; c.position.x = (Math.random() - 0.5) * 18; }
      });
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      if (mount && renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="hero-canvas-container" />;
};

// ── PRICING CARD WITH TILT ────────────────────────────────────────────────────
const PricingCard = ({ name, monthlyPrice, features, popular, plan, onSubscribe }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 22;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -22;
    setTilt({ x, y });
  };

  return (
    <div
      data-testid={`pricing-card-${plan}`}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className={`relative rounded-2xl p-8 pricing-card-transition cursor-pointer ${popular
        ? 'bg-gradient-to-br from-green-900/60 to-green-800/40 border-2 border-green-400 shadow-[0_0_50px_rgba(22,163,74,0.4)] scale-105'
        : 'glass-card'}`}
      style={{ transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-400 text-black text-xs font-bold px-4 py-1 rounded-full float-anim">
          Most Popular
        </div>
      )}
      <div className={`text-sm font-semibold mb-2 ${popular ? 'text-green-300' : 'text-green-500'}`}>{name}</div>
      <div className="flex items-end gap-1 mb-6">
        <span className="text-4xl font-bold text-white font-['Outfit']">₹{monthlyPrice.toLocaleString()}</span>
        <span className="text-gray-400 mb-1">/month</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
            <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        data-testid={`subscribe-btn-${plan}`}
        onClick={() => onSubscribe(plan, monthlyPrice)}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${popular
          ? 'bg-green-500 hover:bg-green-400 text-black pulse-glow'
          : 'border border-green-500 text-green-400 hover:bg-green-500/10'}`}
      >
        Get Started — ₹{monthlyPrice.toLocaleString()}/mo
      </button>
    </div>
  );
};

// ── TESTIMONIAL CARD ─────────────────────────────────────────────────────────
const TestimonialCard = ({ name, city, business, review, stars = 5, avatar }) => (
  <div className="glass-card rounded-2xl p-6 mx-3 w-72 flex-shrink-0">
    <div className="flex gap-1 mb-3">
      {[...Array(stars)].map((_, i) => <Star key={i} size={14} fill="#F59E0B" className="text-yellow-400" />)}
    </div>
    <p className="text-gray-300 text-sm mb-4 leading-relaxed">"{review}"</p>
    <div className="flex items-center gap-3">
      {avatar
        ? <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
        : <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-white font-bold text-sm">{name[0]}</div>}
      <div>
        <div className="text-white text-sm font-semibold">{name}</div>
        <div className="text-gray-400 text-xs">{city} — {business}</div>
      </div>
    </div>
  </div>
);

// ── HOW IT WORKS STEP ─────────────────────────────────────────────────────────
const HowStep = ({ step, title, desc, icon: Icon, index }) => (
  <div data-testid={`how-step-${index}`} className="how-step flex items-start gap-6 opacity-0">
    <div className="flex-shrink-0">
      <div className="w-14 h-14 rounded-full bg-green-900/60 border border-green-500/40 flex items-center justify-center">
        <Icon size={22} className="text-green-400" />
      </div>
    </div>
    <div className="flex-1 pb-8 border-b border-white/5">
      <div className="text-green-500 text-xs font-bold tracking-wider mb-1">STEP {step}</div>
      <div className="text-white font-semibold text-lg mb-1 font-['Outfit']">{title}</div>
      <div className="text-gray-400 text-sm leading-relaxed">{desc}</div>
    </div>
  </div>
);

// ── MAIN LANDING PAGE ─────────────────────────────────────────────────────────
const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Feature cards
      gsap.utils.toArray('.feature-card').forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%' },
          opacity: 0, x: i === 0 ? -80 : i === 2 ? 80 : 0, y: i === 1 ? 50 : 0,
          duration: 0.8, ease: 'power2.out'
        });
      });
      // How it works steps
      gsap.utils.toArray('.how-step').forEach((el, i) => {
        gsap.to(el, {
          scrollTrigger: { trigger: el, start: 'top 82%' },
          opacity: 1, x: 0, duration: 0.7, delay: i * 0.15, ease: 'power2.out',
          from: { opacity: 0, x: -50 }
        });
      });
    });
    return () => { ctx.revert(); ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  const handleStartTrial = () => navigate(user ? '/dashboard' : '/register');
  const handleSubscribe = (plan, price) => navigate(user ? `/dashboard?subscribe=${plan}` : `/register?plan=${plan}`);

  const testimonials = [
    { name: 'Ramesh Patel', city: 'Surat', business: 'Kapda merchant', review: 'GSTR-3B mein confusion tha — TaxSaathi ne 5 minute mein samjha diya. Zabardast service!', avatar: 'https://images.unsplash.com/photo-1753184863498-72e77c60888b?crop=entropy&cs=srgb&fm=jpg&q=85&w=100' },
    { name: 'Kavita Shah', city: 'Rajkot', business: 'Jewellery shop', review: 'Pehle CA ko ₹4,000 deti thi. Ab sirf ₹1,500 mein poora GST guidance milta hai. Best investment!', avatar: 'https://images.pexels.com/photos/26861411/pexels-photo-26861411.jpeg?auto=compress&w=100' },
    { name: 'Dinesh Bhai', city: 'Ahmedabad', business: 'Hardware store', review: 'Hindi mein jawab milta hai — bilkul seedha aur samajh aata hai. Bahut kaam ka tool hai.', avatar: null },
    { name: 'Suresh Mehta', city: 'Vadodara', business: 'Kirana wholesale', review: 'E-way bill aur ITC ke sawaal instant solve ho jaate hain. 24/7 available hai — perfect!', avatar: 'https://images.pexels.com/photos/32913713/pexels-photo-32913713.jpeg?auto=compress&w=100' },
    { name: 'Priya Joshi', city: 'Gandhinagar', business: 'Textile trader', review: 'GST notice aaya tha — TaxSaathi ne step-by-step guide kiya. Notice successfully handle ho gaya!', avatar: null },
    { name: 'Mehul Desai', city: 'Anand', business: 'Grocery store', review: 'Composition scheme ke baare mein puri jaankari di. Ab confident hoon apna GST file karne mein.', avatar: null },
  ];

  return (
    <div className="bg-[#040906] min-h-screen font-['Noto_Sans']">
      {/* ── NAVBAR ── */}
      <nav data-testid="navbar" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#040906]/95 backdrop-blur-xl border-b border-green-900/30' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-black" />
            </div>
            <span className="text-white font-bold text-lg font-['Outfit']">TaxSaathi</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Pricing'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-gray-400 hover:text-white text-sm transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" data-testid="nav-dashboard-btn" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" data-testid="nav-login-btn" className="text-gray-300 hover:text-white text-sm transition-colors">Login</Link>
                <Link to="/register" data-testid="nav-register-btn" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)} data-testid="nav-mobile-menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#040906]/98 border-t border-green-900/30 px-6 py-4 flex flex-col gap-4">
            {['Features', 'How It Works', 'Pricing'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} onClick={() => setMenuOpen(false)} className="text-gray-300 text-sm">{item}</a>
            ))}
            <Link to="/register" onClick={() => setMenuOpen(false)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm text-center font-medium">Start Free Trial</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #061a0e 0%, #040906 70%)' }}>
        <HeroScene />
        <div className="hero-content text-center px-6 max-w-4xl mx-auto fade-in-up">
          <div className="inline-flex items-center gap-2 bg-green-900/40 border border-green-700/40 rounded-full px-4 py-1.5 text-green-300 text-xs font-semibold mb-6 tracking-wide">
            <div className="w-2 h-2 bg-green-400 rounded-full glow-pulse-anim" />
            India's #1 AI GST Advisor — Live 24/7
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight font-['Outfit'] mb-4 text-glow-green tracking-tight">
            GST की टेंशन<br />
            <span className="shimmer-text">छोड़ो</span>
          </h1>
          <p className="text-gray-300 text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            India's smartest AI GST advisor. Instant answers 24/7 in Hindi, Gujarati & English.
            <span className="text-green-400 font-semibold"> Starting ₹1,500/month.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              data-testid="hero-start-trial-btn"
              onClick={handleStartTrial}
              className="pulse-glow bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-base transition-all flex items-center gap-2 min-w-[200px] justify-center"
            >
              Start Free Trial <ChevronRight size={18} />
            </button>
            <button
              data-testid="hero-talk-ai-btn"
              onClick={() => setChatOpen(true)}
              className="border border-white/30 hover:border-white text-white px-8 py-4 rounded-xl font-semibold text-base transition-all flex items-center gap-2 min-w-[200px] justify-center hover:bg-white/5"
            >
              <MessageCircle size={18} className="text-green-400" /> Talk to AI Now
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> 10 free questions</span>
            <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Hindi + Gujarati</span>
          </div>
        </div>
        <a href="#features" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 hover:text-green-400 transition-colors bounce-arrow" data-testid="scroll-down">
          <ArrowDown size={24} />
        </a>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-green-500 text-sm font-bold tracking-widest uppercase mb-3">Why TaxSaathi</div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white font-['Outfit'] tracking-tight">Built for Indian Traders</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">Everything you need to manage GST — no CA required for day-to-day queries.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Bot, title: 'AI answers in seconds', desc: 'Ask any GST question — get accurate, step-by-step answers instantly. No waiting, no appointments.', tag: 'Instant' },
            { icon: Globe, title: 'Hindi + Gujarati + English', desc: 'Converse in your preferred language. Our AI understands all three and responds naturally.', tag: 'Multilingual' },
            { icon: Shield, title: 'CA-verified guidance', desc: 'Every answer is backed by GST law and CA-reviewed frameworks. Trusted and accurate.', tag: 'Trusted' },
          ].map((f, i) => (
            <div key={i} data-testid={`feature-card-${i}`} className="feature-card glass-card rounded-2xl p-8">
              <div className="w-12 h-12 bg-green-900/60 rounded-xl flex items-center justify-center mb-5 border border-green-700/30">
                <f.icon size={22} className="text-green-400" />
              </div>
              <div className="text-green-500 text-xs font-bold tracking-wider mb-2">{f.tag}</div>
              <h3 className="text-white font-semibold text-lg mb-2 font-['Outfit']">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-green-500 text-sm font-bold tracking-widest uppercase mb-3">Simple Process</div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white font-['Outfit'] tracking-tight">How It Works</h2>
        </div>
        <div className="space-y-2">
          <HowStep step={1} index={0} icon={CheckCircle} title="Click and Pay" desc="Choose your plan — Basic ₹1,500, Pro ₹1,800, or Premium ₹2,000/month. Or start with 10 free questions." />
          <HowStep step={2} index={1} icon={Zap} title="Login Instantly" desc="Your account is ready the moment you sign up. No waiting, no setup. Dashboard accessible immediately." />
          <HowStep step={3} index={2} icon={MessageCircle} title="Ask Anything 24/7" desc="Type your GST question in Hindi, Gujarati, or English. Get complete answers with form names, deadlines, and portal steps." />
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-green-500 text-sm font-bold tracking-widest uppercase mb-3">Simple Pricing</div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-['Outfit'] tracking-tight">Pick Your Plan</h2>
            <p className="text-gray-400 mt-3">All plans include 24/7 AI support. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <PricingCard name="Basic" monthlyPrice={1500} plan="basic" onSubscribe={handleSubscribe} features={[
              'Unlimited GST questions', 'Hindi + English support', 'GSTR-1, 3B, 9 help', 'HSN code lookup', 'PDF download of answers'
            ]} />
            <PricingCard name="Pro" monthlyPrice={1800} plan="pro" popular onSubscribe={handleSubscribe} features={[
              'Everything in Basic', 'Gujarati language support', 'E-invoicing & E-way bill', 'Priority response', 'GST notice handling guide', 'Composition scheme advice'
            ]} />
            <PricingCard name="Premium" monthlyPrice={2000} plan="premium" onSubscribe={handleSubscribe} features={[
              'Everything in Pro', 'Complete GST audit support', 'Monthly GST calendar', 'ITC reconciliation guide', 'Annual return (GSTR-9)', 'WhatsApp integration'
            ]} />
          </div>
          <div className="text-center mt-10 text-gray-400 text-sm">
            Not sure? <button onClick={handleStartTrial} data-testid="pricing-free-trial-link" className="text-green-400 hover:underline font-medium">Start with 10 free questions — no card needed</button>
          </div>
        </div>
      </section>

      {/* ── FREE TRIAL CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center glass-card rounded-3xl p-12" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(4,9,6,0.8))' }}>
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <Bot size={28} className="text-green-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-['Outfit'] mb-3 tracking-tight">Try Free — 10 Questions</h2>
          <p className="text-gray-400 mb-2">No credit card needed. No commitment.</p>
          <p className="text-gray-500 text-sm mb-8">10 free GST questions. Ask anything — GSTR, ITC, e-way bill, HSN codes.</p>
          <button
            data-testid="free-trial-cta-btn"
            onClick={handleStartTrial}
            className="pulse-glow bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-2"
          >
            Try Free Now <ChevronRight size={20} />
          </button>
          <p className="text-gray-600 text-xs mt-4">10 free GST questions. No payment. No card.</p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 overflow-hidden">
        <div className="text-center mb-12 px-6">
          <div className="text-green-500 text-sm font-bold tracking-widest uppercase mb-3">Trusted by Traders</div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white font-['Outfit'] tracking-tight">What Our Clients Say</h2>
        </div>
        <Marquee speed={35} gradient gradientColor="#040906" gradientWidth={100} pauseOnHover>
          {testimonials.map((t, i) => <TestimonialCard key={i} {...t} />)}
        </Marquee>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                <Shield size={14} className="text-black" />
              </div>
              <span className="text-white font-bold font-['Outfit']">TaxSaathi</span>
            </div>
            <div className="text-gray-500 text-sm text-center">
              Official website: <a href="https://taxsaathi.info" className="text-green-500 hover:text-green-400 transition-colors">taxsaathi.info</a>
              <span className="mx-3">•</span>
              GST advisory for Indian small businesses
            </div>
            <div className="flex items-center gap-4 text-gray-500 text-xs">
              <span>© 2025 TaxSaathi</span>
              <span className="text-green-600">|</span>
              <span>Gujarat, India</span>
            </div>
          </div>
          <div className="mt-6 text-center text-gray-600 text-xs">
            ⚠️ TaxSaathi provides AI-powered GST guidance. Always verify with your CA before filing.
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP FLOATING BUTTON ── */}
      <button
        data-testid="whatsapp-float-btn"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full shadow-[0_4px_20px_rgba(22,163,74,0.6)] flex items-center justify-center transition-all hover:scale-110 pulse-glow"
        title="Chat with TaxSaathi AI"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </button>

      {/* ── SALES CHAT WIDGET ── */}
      <SalesChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default LandingPage;
