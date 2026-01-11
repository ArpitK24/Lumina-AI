import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, Sparkles, MessageSquare, Zap, Bot, Command } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    
    // Refs
    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const terminalRef = useRef(null);
    const containerRef = useRef(null);
    
    const [isVisible, setIsVisible] = useState({ hero: false, features: false });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    // --- 1. Mouse Tracking & Light Effect ---
    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = e.clientX;
            const y = e.clientY;
            setMousePosition({ x, y });

            // Calculate tilt for the terminal
            if (terminalRef.current) {
                const rect = terminalRef.current.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Limit tilt to small degrees
                const tiltX = ((y - centerY) / rect.height) * 5; 
                const tiltY = ((centerX - x) / rect.width) * 5; // Invert Y for correct feel

                setTilt({ x: tiltX, y: tiltY });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Scroll Observers
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(prev => ({ ...prev, hero: true }));
        }, { threshold: 0.1 });
        
        const observerFeatures = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(prev => ({ ...prev, features: true }));
        }, { threshold: 0.1 });

        if (heroRef.current) observer.observe(heroRef.current);
        if (featuresRef.current) observerFeatures.observe(featuresRef.current);

        return () => {
            if (heroRef.current) observer.unobserve(heroRef.current);
            if (featuresRef.current) observerFeatures.unobserve(featuresRef.current);
        };
    }, []);

    // --- Typing Logic ---
    const [demoText, setDemoText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!isVisible.hero) return;

        const scenarios = [
            { 
                q: "> system_check --deep", 
                a: "Analyzing core modules...\n- Neural Engine: ONLINE (Latency 12ms)\n- Logic Gates: OPTIMIZED\n- Creativity Subroutines: UNLOCKED\n\nSystem functioning at 104% efficiency. Ready for input." 
            },
            { 
                q: "> generate_idea --topic=space", 
                a: "Concept: 'The Silent Orbit'\n\nA psychological thriller set on a station where sound travels faster than light. The crew begins to hear whispers from their own future moments before they happen." 
            },
            { 
                q: "> optimize_code --lang=python", 
                a: "Refactoring algorithm...\n\n1. Replaced nested loops with hash maps (O(n^2) -> O(n)).\n2. Implemented memoization for recursive calls.\n3. Execution time reduced by 85%." 
            },
            { 
                q: "> analyze_user_intent", 
                a: "Intent detected: 'Curiosity & Exploration'.\nRecommended Action: Initiate 'Showcase' protocol.\nEngagement probability: 98.4%." 
            }
        ];

        let scenarioIndex = 0;
        let phase = 'question'; 
        let textIndex = 0;
        let currentContent = "";

        const runLoop = () => {
            if (scenarioIndex >= scenarios.length) scenarioIndex = 0;
            const currentScenario = scenarios[scenarioIndex];

            if (phase === 'question') {
                if (textIndex < currentScenario.q.length) {
                    currentContent += currentScenario.q.charAt(textIndex);
                    setDemoText(currentContent);
                    textIndex++;
                    setTimeout(runLoop, 40); 
                } else {
                    phase = 'pause';
                    textIndex = 0;
                    setTimeout(runLoop, 600);
                }
            } else if (phase === 'pause') {
                phase = 'answer';
                currentContent += "\n\n"; 
                setDemoText(currentContent);
                setTimeout(runLoop, 100);
            } else if (phase === 'answer') {
                if (textIndex < currentScenario.a.length) {
                    currentContent += currentScenario.a.charAt(textIndex);
                    setDemoText(currentContent);
                    textIndex++;
                    setIsTyping(true);
                    setTimeout(runLoop, 20); // Faster typing
                } else {
                    setIsTyping(false);
                    phase = 'reset';
                    setTimeout(() => {
                        scenarioIndex++;
                        currentContent = "";
                        setDemoText("");
                        phase = 'question';
                        textIndex = 0;
                        runLoop();
                    }, 4000); 
                }
            }
        };
        const timerId = setTimeout(runLoop, 1000);
        return () => clearTimeout(timerId);
    }, [isVisible.hero]);


    return (
        <div className="landing-container" ref={containerRef}>
            {/* --- Mouse Follower Light Effect --- */}
            <div 
                className="mouse-light" 
                style={{ 
                    left: mousePosition.x, 
                    top: mousePosition.y 
                }} 
            />

            {/* Animated Background Gradient Blobs */}
            <div className="ambient-light">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                {/* New 3rd blob for depth */}
                <div className="blob blob-3"></div>
            </div>

            {/* Navbar */}
            <nav className="nav glass">
                <div className="container nav-content">
                    <div className="logo-brand" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
                        <Sparkles className="icon-accent animate-pulse-slow" />
                        <span className="brand-name">Lumina AI</span>
                    </div>
                    <div className="nav-links">
                        <button className="btn btn-ghost" onClick={() => navigate('/auth')}>Log In</button>
                        <button className="btn btn-primary" onClick={() => navigate('/auth')}>Sign Up</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero container" ref={heroRef}>
                <div className={`hero-content-wrapper ${isVisible.hero ? 'visible' : ''}`}>
                    <div className="hero-text">
                        <div className="badge">
                            <Command size={14} />
                            <span>Neural Network v3.0</span>
                        </div>
                        <h1 className="hero-title">
                            Intelligence <br />
                            <span className="text-gradient">Beyond Logic</span>
                        </h1>
                        <p className="hero-subtitle">
                            Experience the first AI architecture capable of non-linear reasoning.
                            We don't just retrieve data; we synthesize new concepts in real-time.
                        </p>
                        <div className="hero-btns">
                            <button className="btn btn-primary btn-lg group" onClick={() => navigate('/auth')}>
                                Initialize System
                                <ArrowRight size={20} className="icon-move group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>
                    
                    {/* 3D Tilt Terminal */}
                    <div 
                        className="demo-terminal glass"
                        ref={terminalRef}
                        style={{
                            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
                        }}
                    >
                        <div className="terminal-header">
                            <div className="dots">
                                <span className="dot red"></span>
                                <span className="dot yellow"></span>
                                <span className="dot green"></span>
                            </div>
                            <div className="terminal-title">root@lumina-core:~</div>
                            <div className="terminal-status">
                                <Bot size={14} className={isTyping ? "status-active" : ""} />
                            </div>
                        </div>
                        <div className="terminal-body">
                            <pre className="typewriter-text">
                                {demoText}
                                <span className={`cursor ${isTyping ? 'blink' : 'hidden'}`}>▋</span>
                            </pre>
                        </div>
                        {/* Decorative reflection overlay */}
                        <div className="terminal-reflection"></div>
                    </div>
                </div>
            </header>

            {/* Features */}
            <section className="features container" ref={featuresRef}>
                <h2 className={`section-title ${isVisible.features ? 'visible' : ''}`}>System Capabilities</h2>
                <div className="features-grid">
                    {[
                        { icon: Cpu, title: "Hyper-Threading", desc: "Processes multiple logic streams simultaneously for instant complex answers." },
                        { icon: MessageSquare, title: "Deep Context", desc: "Remembers conversation nuances across unlimited session history." },
                        { icon: Zap, title: "Zero Latency", desc: "Edge-computed inference ensures responses arrive before you finish scrolling." }
                    ].map((feature, index) => (
                        <div 
                            key={index} 
                            className={`feature-card glass ${isVisible.features ? 'visible' : ''}`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="icon-wrapper">
                                <feature.icon className="feature-icon" />
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <style jsx>{`
                /* --- Core Variables --- */
                :global(:root) {
                    --accent-primary: #00f0ff; /* Cyberpunk Cyan */
                    --accent-secondary: #7000ff; /* Electric Purple */
                    --bg-dark: #050505;
                    --text-main: #e0e0e0;
                    --text-dim: #888888;
                    --glass-bg: rgba(20, 20, 20, 0.6);
                    --glass-border: rgba(255, 255, 255, 0.08);
                }

                .landing-container {
                    background-color: var(--bg-dark);
                    color: var(--text-main);
                    min-height: 100vh;
                    overflow-x: hidden;
                    position: relative;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    cursor: default;
                }

                /* --- NEW: Mouse Light Effect --- */
                .mouse-light {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, rgba(0,0,0,0) 60%);
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                    z-index: 0; /* Behind content, in front of background */
                    mix-blend-mode: screen;
                }

                /* --- Ambient Background --- */
                .ambient-light {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    z-index: -1;
                    overflow: hidden;
                    pointer-events: none;
                }

                .blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.3;
                    animation: moveBlob 25s infinite alternate;
                }

                .blob-1 {
                    top: -10%; left: -10%; width: 50vw; height: 50vw;
                    background: var(--accent-secondary);
                }
                .blob-2 {
                    bottom: -10%; right: -10%; width: 60vw; height: 60vw;
                    background: var(--accent-primary);
                    animation-delay: -5s;
                }
                .blob-3 {
                    top: 40%; left: 40%; width: 30vw; height: 30vw;
                    background: #ff0055;
                    filter: blur(120px);
                    animation-duration: 40s;
                    opacity: 0.15;
                }

                @keyframes moveBlob {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(100px, 50px) scale(1.1); }
                }

                .glass {
                    background: var(--glass-bg);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid var(--glass-border);
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
                }

                /* --- Navbar --- */
                .nav {
                    position: fixed;
                    top: 20px; left: 50%;
                    transform: translateX(-50%);
                    width: 90%; max-width: 1200px;
                    z-index: 1000;
                    padding: 15px 30px;
                    border-radius: 100px; /* Pill shape */
                }
                .nav-content { display: flex; justify-content: space-between; align-items: center; }
                .logo-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.4rem; letter-spacing: -0.05em; }
                .icon-accent { color: var(--accent-primary); filter: drop-shadow(0 0 8px var(--accent-primary)); }
                .nav-links { display: flex; gap: 15px; }

                /* --- Buttons --- */
                .btn {
                    padding: 10px 24px; border-radius: 100px; font-weight: 600; cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none;
                    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                }
                .btn-ghost { background: transparent; color: var(--text-dim); }
                .btn-ghost:hover { color: white; background: rgba(255, 255, 255, 0.05); }
                .btn-primary {
                    background: var(--text-main);
                    color: black;
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
                }
                .btn-primary:hover {
                    background: var(--accent-primary);
                    box-shadow: 0 0 30px var(--accent-primary);
                    transform: scale(1.05);
                }

                /* --- Hero --- */
                .hero { padding-top: 180px; min-height: 100vh; display: flex; align-items: center; position: relative; z-index: 1; }
                .hero-content-wrapper {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 80px; width: 100%;
                    opacity: 0; transform: translateY(30px);
                    transition: opacity 1s ease, transform 1s ease;
                }
                .hero-content-wrapper.visible { opacity: 1; transform: translateY(0); }
                
                .hero-title { font-size: 4.5rem; line-height: 1; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.03em; }
                .text-gradient {
                    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .badge {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 6px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 100px; color: var(--accent-primary); font-size: 0.8rem;
                    font-weight: 600; margin-bottom: 24px; width: fit-content;
                    text-transform: uppercase; letter-spacing: 0.1em;
                }
                .hero-subtitle { font-size: 1.15rem; color: var(--text-dim); margin-bottom: 40px; line-height: 1.6; max-width: 90%; }

                /* --- Terminal with 3D Tilt --- */
                .demo-terminal {
                    border-radius: 16px; overflow: hidden;
                    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    height: 450px; display: flex; flex-direction: column;
                    font-family: 'Fira Code', monospace;
                    transition: transform 0.1s ease-out; /* Smooth follow */
                    transform-style: preserve-3d;
                }
                .terminal-header {
                    background: rgba(255,255,255,0.03); padding: 12px 20px;
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .dots { display: flex; gap: 6px; }
                .dot { width: 12px; height: 12px; border-radius: 50%; }
                .red { background: #ff5f56; } .yellow { background: #ffbd2e; } .green { background: #27c93f; }
                .terminal-title { color: #555; font-size: 0.85rem; position: absolute; left: 50%; transform: translateX(-50%); }
                .terminal-status { color: #555; }
                .status-active { color: var(--accent-primary); filter: drop-shadow(0 0 5px var(--accent-primary)); }
                
                .terminal-body { flex: 1; padding: 24px; overflow: hidden; background: rgba(0, 0, 0, 0.4); position: relative; }
                .typewriter-text { margin: 0; color: #eee; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; }
                .cursor { color: var(--accent-primary); font-weight: bold; }
                .blink { animation: blinker 1s linear infinite; }
                @keyframes blinker { 50% { opacity: 0; } }
                
                /* Reflection effect on glass */
                .terminal-reflection {
                    position: absolute; top: 0; left: 0; right: 0; height: 50%;
                    background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
                    pointer-events: none;
                }

                /* --- Features --- */
                .features { padding-bottom: 150px; position: relative; z-index: 1; }
                .section-title { text-align: center; font-size: 3rem; font-weight: 700; margin-bottom: 80px; }
                .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
                .feature-card {
                    padding: 40px 30px; border-radius: 20px; text-align: left;
                    transition: all 0.4s ease; position: relative; overflow: hidden;
                }
                .feature-card:hover {
                    transform: translateY(-10px);
                    background: rgba(255, 255, 255, 0.08);
                    border-color: var(--accent-primary);
                }
                .icon-wrapper {
                    width: 50px; height: 50px; background: rgba(255,255,255,0.05);
                    border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    margin-bottom: 20px; color: var(--accent-primary);
                }
                .feature-card h3 { font-size: 1.4rem; margin-bottom: 12px; color: white; }
                .feature-card p { color: var(--text-dim); line-height: 1.6; font-size: 0.95rem; }

                /* --- Visibility Animations --- */
                .section-title, .feature-card {
                    opacity: 0; transform: translateY(30px);
                    transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .section-title.visible, .feature-card.visible { opacity: 1; transform: translateY(0); }

                /* --- Responsive --- */
                @media (max-width: 968px) {
                    .hero-content-wrapper { grid-template-columns: 1fr; text-align: center; gap: 50px; }
                    .hero-title { font-size: 3rem; }
                    .demo-terminal { height: 350px; }
                    .terminal-title { display: none; }
                    .mouse-light { display: none; } /* Disable on touch */
                }
            `}</style>
        </div>
    );
};

export default LandingPage;