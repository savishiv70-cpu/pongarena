import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Gamepad2, Pause, Play, RotateCcw } from 'lucide-react';

type Mode = 'career' | 'rival' | 'free' | 'boss';
type GameState = {
  x: number; y: number; vx: number; vy: number; paddle: number; bot: number;
  running: boolean; score: number; lives: number; level: number; rally: number;
  returns: number; mission: number; aiScore: number; playerHits: number[];
  bossHp: number; bossMax: number; phase: number; gateX: number; gateDir: number;
  speed: number; paddleWidth: number; targetX: number; targetY: number; targetHits: number;
};
const W = 900, H = 520;
const MODES: { id: Mode; name: string; symbol: string; tag: string; desc: string }[] = [
  { id: 'career', name: 'CAREER: THE JOURNEY', symbol: '🏁', tag: 'MISSION CAMPAIGN', desc: 'Clear sector missions, cross shifting gates and unlock the next arena.' },
  { id: 'rival', name: 'AI RIVAL: THE MIND GAME', symbol: '🤖', tag: 'ADAPTIVE DUEL', desc: 'The rival studies your shot history and changes its interception strategy.' },
  { id: 'free', name: 'FREE PLAY: THE LAB', symbol: '🎯', tag: 'PRACTICE SANDBOX', desc: 'Tune ball speed and paddle size, then train on moving target zones.' },
  { id: 'boss', name: 'BOSS RUSH: OVERDRIVE', symbol: '👑', tag: 'BOSS BATTLE', desc: 'Fight a living boss with three attack phases and a visible health bar.' }
];
const makeState = (mode: Mode): GameState => ({
  x: 450, y: 260, vx: 4.4 * (Math.random() > .5 ? 1 : -1), vy: 3.7, paddle: 450, bot: 450,
  running: false, score: 0, lives: 3, level: 1, rally: 0, returns: 0, mission: 0, aiScore: 0,
  playerHits: [], bossHp: 12, bossMax: 12, phase: 1, gateX: 450, gateDir: 1,
  speed: 1, paddleWidth: mode === 'free' ? 150 : 112, targetX: 450, targetY: 250, targetHits: 0
});
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useRef<GameState>(makeState('career'));
  const keys = useRef<Record<string, boolean>>({});
  const [mode, setMode] = useState<Mode>('career');
  const [entered, setEntered] = useState(false);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [mission, setMission] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [bossHp, setBossHp] = useState(12);
  const [comment, setComment] = useState('Choose a mode. Every mode has its own rules.');
  const [speed, setSpeed] = useState(1);
  const [paddleWidth, setPaddleWidth] = useState(150);
  const [targetHits, setTargetHits] = useState(0);
  const announce = (message: string) => setComment(message);
  const reset = useCallback((nextMode: Mode = mode) => {
    game.current = makeState(nextMode);
    game.current.speed = nextMode === 'free' ? speed : 1;
    game.current.paddleWidth = nextMode === 'free' ? paddleWidth : 112;
    setScore(0); setLives(3); setLevel(1); setMission(0); setAiScore(0);
    setBossHp(12); setTargetHits(0); setRunning(false);
    announce(nextMode === 'boss' ? 'BOSS 01 ONLINE — survive the attack pattern and strike back.' : 'Arena reset. Your next run starts now.');
  }, [mode, speed, paddleWidth]);
  const start = () => {
    game.current.running = true; setRunning(true);
    announce(mode === 'boss' ? 'WARNING: BOSS PHASE 1 — attack pattern incoming.' : 'Match live. Read the ball and control the rally.');
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', ' ', 'a', 'd'].includes(k)) e.preventDefault();
      keys.current[k] = e.type === 'keydown';
      if (k === ' ' && e.type === 'keydown') {
        if (game.current.running) { game.current.running = false; setRunning(false); }
        else start();
      }
    };
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0;
    const draw = (time: number) => {
      const s = game.current, dpr = Math.min(window.devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
      const cw = Math.max(1, r.width), ch = Math.max(1, r.height);
      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      }
      ctx.setTransform(dpr * cw / W, 0, 0, dpr * ch / H, 0, 0);
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, mode === 'boss' ? '#250b28' : '#07172d');
      bg.addColorStop(1, mode === 'free' ? '#092b35' : mode === 'rival' ? '#1b1039' : '#10102b');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) { ctx.fillStyle = i % 3 ? '#8bdcff55' : '#d4a2ff55'; ctx.fillRect((i * 137) % W, (i * 79) % H, 2, 2); }
      ctx.strokeStyle = '#6ceaff55'; ctx.lineWidth = 2; ctx.strokeRect(34, 26, 832, 468);
      ctx.setLineDash([9, 12]); ctx.strokeStyle = '#a9bfff33'; ctx.beginPath(); ctx.moveTo(50, 260); ctx.lineTo(850, 260); ctx.stroke(); ctx.setLineDash([]);
      const paddle = (x: number, y: number, w: number, color: string) => {
        ctx.shadowColor = color; ctx.shadowBlur = 22; ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 9, w, 18, 9); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffffaa'; ctx.fillRect(x - w * .28, y - 3, w * .56, 2);
      };
      if (mode === 'career') {
        const gap = 150, left = s.gateX - gap / 2, right = s.gateX + gap / 2;
        ctx.strokeStyle = '#ffc65e'; ctx.lineWidth = 8; ctx.shadowColor = '#ffc65e'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.moveTo(55, 260); ctx.lineTo(left, 260); ctx.moveTo(right, 260); ctx.lineTo(845, 260); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffd88a'; ctx.font = 'bold 15px Orbitron, sans-serif'; ctx.fillText('SECTOR GATE', 65, 244);
      }
      if (mode === 'free') {
        ctx.strokeStyle = '#59f2bd'; ctx.lineWidth = 3; ctx.shadowColor = '#59f2bd'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(s.targetX, s.targetY, 34 + Math.sin(time / 250) * 7, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#9dffe0'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PRACTICE TARGET', s.targetX, s.targetY - 48); ctx.textAlign = 'left';
      }
      if (mode === 'boss') {
        const bossColor = s.phase === 1 ? '#ff5e8d' : s.phase === 2 ? '#ffad4d' : '#d78cff';
        ctx.fillStyle = bossColor; ctx.shadowColor = bossColor; ctx.shadowBlur = 26;
        ctx.beginPath(); ctx.arc(s.bot, 62, 36 + Math.sin(time / 130) * 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#220d28'; ctx.beginPath(); ctx.arc(s.bot - 12, 58, 5, 0, Math.PI * 2); ctx.arc(s.bot + 12, 58, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BOSS CORE', s.bot, 112); ctx.textAlign = 'left';
        ctx.fillStyle = '#4b2038'; ctx.fillRect(250, 15, 400, 10); ctx.fillStyle = bossColor; ctx.fillRect(250, 15, 400 * (s.bossHp / s.bossMax), 10);
        ctx.strokeStyle = '#ffd0e2'; ctx.strokeRect(250, 15, 400, 10);
        ctx.fillStyle = '#ffd6e5'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BOSS HP', 450, 43); ctx.textAlign = 'left';
      } else paddle(s.bot, 62, mode === 'rival' ? 132 : 112, mode === 'rival' ? '#c18aff' : '#c77aff');
      paddle(s.paddle, 455, s.paddleWidth, '#4ceaff');
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#6ceaff'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(s.x, s.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#b6d9ff'; ctx.font = '12px Orbitron, sans-serif';
      ctx.fillText(mode === 'career' ? 'MISSION: 5 CLEAN RETURNS' : mode === 'rival' ? 'FIRST TO 5 POINTS' : mode === 'free' ? 'HIT THE MOVING TARGET' : 'STRIKE THE CORE', 55, 480);
      if (s.running) {
        const step = 7.5;
        if (keys.current.arrowleft || keys.current.a) s.paddle -= step;
        if (keys.current.arrowright || keys.current.d) s.paddle += step;
        s.paddle = Math.max(60, Math.min(840, s.paddle));
        if (mode === 'career') { s.gateX += s.gateDir * (2.1 + s.level * .08); if (s.gateX < 170 || s.gateX > 730) s.gateDir *= -1; }
        if (mode === 'free') { s.targetX = 450 + Math.sin(time / 650) * 300; s.targetY = 210 + Math.cos(time / 900) * 55; }
        if (mode === 'boss') s.bot = 450 + Math.sin(time / (s.phase === 1 ? 650 : s.phase === 2 ? 390 : 250)) * 300;
        else if (mode === 'rival') {
          const history = s.playerHits.slice(-8), avg = history.length ? history.reduce((a, b) => a + b, 0) / history.length : 450;
          const predicted = s.x + s.vx * Math.max(0, (s.y - 62) / Math.max(2, Math.abs(s.vy)));
          const counter = avg < 410 ? 95 : avg > 490 ? -95 : 0;
          s.bot += (predicted + counter - s.bot) * .11;
        } else s.bot += (s.x - s.bot) * .045;
        s.bot = Math.max(75, Math.min(825, s.bot));
        const oldY = s.y; s.x += s.vx * (mode === 'free' ? s.speed : 1); s.y += s.vy * (mode === 'free' ? s.speed : 1);
        if (mode === 'free' && Math.abs(s.y - s.targetY) < 8 && Math.abs(s.x - s.targetX) < 42) {
          s.targetHits++; s.score += 400; setTargetHits(s.targetHits); setScore(s.score); announce('TARGET HIT! +400 practice points.');
          s.targetX = 120 + Math.random() * 660; s.targetY = 180 + Math.random() * 120;
        }
        if (mode === 'career' && ((oldY < 260 && s.y >= 260) || (oldY > 260 && s.y <= 260)) && Math.abs(s.x - s.gateX) > 75) {
          s.vy *= -1; s.y = oldY; announce('Gate blocked the route. Time the moving opening!');
        }
        if (s.x < 45 || s.x > 855) { s.vx *= -1; s.x = Math.max(45, Math.min(855, s.x)); }
        if (s.vy < 0 && s.y <= 82) {
          if (mode === 'boss') { s.vy = Math.abs(s.vy); s.y = 84; announce('Boss attack returned. Keep the rally alive and strike again.'); }
          else if (Math.abs(s.x - s.bot) < (mode === 'rival' ? 76 : 66)) {
            s.vy = Math.abs(s.vy); s.y = 84;
            if (mode === 'rival') { s.aiScore++; setAiScore(s.aiScore); if (s.aiScore >= 5) { s.running = false; setRunning(false); announce('RIVAL WINS THIS SET. Change your shot pattern and rematch.'); } }
          } else { s.vy = Math.abs(s.vy); s.y = 84; }
        }
        if (s.vy > 0 && s.y >= 444) {
          if (Math.abs(s.x - s.paddle) < s.paddleWidth / 2 + 10) {
            const offset = (s.x - s.paddle) / (s.paddleWidth / 2 + 10); s.y = 443; s.vy = -Math.max(3.7, Math.abs(s.vy));
            s.vx = Math.max(-7.5, Math.min(7.5, offset * 7 + (Math.random() - .5) * .7)); s.rally++; s.returns++;
            if (mode === 'career') {
              s.mission++; setMission(s.mission); s.score += 100;
              if (s.mission >= 5) { s.mission = 0; s.level++; setMission(0); setLevel(s.level); s.score += 500; announce('SECTOR CLEARED! New gate pattern unlocked.'); }
              else announce('Clean return. Mission progress ' + s.mission + '/5.');
            } else if (mode === 'rival') {
              s.playerHits.push(s.paddle); if (s.playerHits.length > 12) s.playerHits.shift(); s.score += 100; setAiScore(s.aiScore);
              if (s.returns >= 5) { s.returns = 0; s.aiScore = 0; setAiScore(0); announce('SET WON! The rival is recalibrating for the next duel.'); }
              else announce('The rival logged that shot. Change your angle to stay unpredictable.');
            } else if (mode === 'free') { s.score += 100; announce('Return logged. Aim for the moving target ring.'); }
            else {
              const damage = Math.abs(offset) < .2 ? 2 : 1; s.bossHp = Math.max(0, s.bossHp - damage); setBossHp(s.bossHp); s.score += damage * 150;
              if (s.bossHp === 0) { s.level++; setLevel(s.level); s.bossMax = 12 + Math.min(18, s.level * 2); s.bossHp = s.bossMax; s.phase = 1; setBossHp(s.bossHp); announce('BOSS DEFEATED! A stronger champion has entered.'); }
              else {
                const next = s.bossHp <= s.bossMax / 3 ? 3 : s.bossHp <= s.bossMax * 2 / 3 ? 2 : 1;
                if (next !== s.phase) { s.phase = next; announce('BOSS PHASE ' + next + '! Attack speed increased.'); }
                else announce(damage === 2 ? 'CRITICAL HIT! Boss core takes 2 damage.' : 'Direct hit! Keep attacking the core.');
              }
            }
            setScore(s.score);
          } else if (mode === 'free') {
            s.x = 450; s.y = 280; s.vx = 4.5 * (Math.random() > .5 ? 1 : -1); s.vy = 3.7; announce('Practice reset — no lives lost. Try a different angle.');
          } else {
            s.lives--; setLives(s.lives); s.x = 450; s.y = 280; s.vx = 4.5 * (Math.random() > .5 ? 1 : -1); s.vy = 3.7;
            if (s.lives <= 0) { s.running = false; setRunning(false); announce('RUN OVER. Restart and try a new strategy.'); }
            else announce('Missed! ' + s.lives + ' lives remaining.');
          }
        }
      }
      if (!s.running) {
        ctx.fillStyle = '#02081788'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.font = 'bold 28px Orbitron, sans-serif'; ctx.shadowColor = '#6ceaff'; ctx.shadowBlur = 16;
        ctx.fillText(s.lives <= 0 ? 'RUN COMPLETE' : mode === 'boss' ? 'BOSS ENCOUNTER' : 'READY PLAYER ONE', 450, 245);
        ctx.shadowBlur = 0; ctx.font = '15px sans-serif'; ctx.fillStyle = '#c1d8f5';
        ctx.fillText('Press START or SPACE to play', 450, 280); ctx.textAlign = 'left';
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mode, entered]);
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    game.current.paddle = Math.max(60, Math.min(840, (e.clientX - r.left) / r.width * W));
  };
  const touch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    game.current.paddle = Math.max(60, Math.min(840, (e.touches[0].clientX - r.left) / r.width * W));
  };
  const choose = (next: Mode) => {
    setMode(next); game.current = makeState(next); game.current.speed = next === 'free' ? speed : 1;
    game.current.paddleWidth = next === 'free' ? paddleWidth : 112;
    setScore(0); setLives(3); setLevel(1); setMission(0); setAiScore(0); setBossHp(12); setTargetHits(0);
    setRunning(false); setEntered(true); announce(MODES.find(m => m.id === next)!.tag + ' loaded.');
  };
  const active = MODES.find(m => m.id === mode)!;
  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="orb">✦</div><div><h1>PONG<span>³</span></h1><small>REFLECT • ADAPT • CONQUER</small></div></div><span className="live"><i /> SYSTEM ONLINE</span></header>
    {!entered ? <>
      <section className="mode-hero"><span className="mode-kicker">NEON ARCADE SYSTEMS PRESENTS</span><h2>SELECT YOUR <span>GAME MODE</span></h2><p>Four different rule sets. Four different ways to win.</p></section>
      <section className="mode-grid">{MODES.map(m => <button key={m.id} className={'mode-card ' + (mode === m.id ? 'selected' : '')} onClick={() => setMode(m.id)}><span className="mode-symbol">{m.symbol}</span><span className="mode-name">{m.name}</span><span className="mode-subtitle">{m.tag}</span><span className="mode-detail">{m.desc}</span><span className="mode-select">{mode === m.id ? '✓ SELECTED' : 'SELECT MODE'}</span></button>)}</section>
      {mode === 'free' && <div className="free-settings"><label>Ball speed <strong>{speed.toFixed(1)}×</strong><input type="range" min="0.6" max="1.8" step="0.1" value={speed} onChange={e => setSpeed(Number(e.target.value))} /></label><label>Paddle width <strong>{paddleWidth}px</strong><input type="range" min="70" max="210" step="10" value={paddleWidth} onChange={e => setPaddleWidth(Number(e.target.value))} /></label></div>}
      <div className="mode-footer"><span>KEYBOARD · MOUSE · TOUCH</span><button className="primary mode-continue" onClick={() => choose(mode)}><Play size={18} /> ENTER {active.name}</button></div>
    </> : <>
      <section className="stats"><div className="stat cyan"><span>✦ SCORE</span><strong>{score.toLocaleString()}</strong></div><div className="stat purple"><span>{mode === 'career' ? 'SECTOR' : mode === 'rival' ? 'SETS WON' : mode === 'free' ? 'TARGET HITS' : 'BOSS LEVEL'}</span><strong>{mode === 'career' ? level : mode === 'rival' ? Math.floor(score / 500) : mode === 'free' ? targetHits : level}</strong></div><div className="stat pink"><span>{mode === 'boss' ? 'BOSS HP' : mode === 'rival' ? 'RIVAL POINTS' : 'LIVES'}</span><strong>{mode === 'boss' ? bossHp : mode === 'rival' ? aiScore + '/5' : mode === 'free' ? '∞' : lives}</strong></div><div className="stat gold"><span>OBJECTIVE</span><strong>{mode === 'career' ? mission + '/5' : mode === 'rival' ? 'FIRST TO 5' : mode === 'free' ? 'TARGET PRACTICE' : 'PHASE ' + game.current.phase}</strong></div></section>
      <section className="arena-head"><span>{active.name} · {active.tag}</span><span>{mode === 'career' ? 'CLEAR 5 RETURNS TO ADVANCE' : mode === 'rival' ? 'DODGE THE ADAPTIVE RIVAL' : mode === 'free' ? 'TUNE SETTINGS · HIT THE RING' : 'DAMAGE THE CORE · SURVIVE 3 PHASES'}</span></section>
      <div className="arena"><canvas ref={canvasRef} onPointerMove={move} onTouchMove={touch} aria-label="Pong game arena" /></div>
      <div className="game-actions"><button className="secondary" onClick={() => { game.current.running = false; setRunning(false); setEntered(false); }}><Gamepad2 size={17} /> CHANGE MODE</button><button className="primary" onClick={() => { if (game.current.running) { game.current.running = false; setRunning(false); } else start(); }}>{running ? <Pause size={18} /> : <Play size={18} />} {running ? 'PAUSE' : 'START GAME'}</button><button className="secondary" onClick={() => reset(mode)}><RotateCcw size={17} /> RESTART</button></div>
      <section className="mode-insight"><div className="panel-title"><Bot /> {mode === 'boss' ? 'BOSS INTELLIGENCE' : mode === 'rival' ? 'RIVAL ANALYSIS' : mode === 'free' ? 'TRAINING FEEDBACK' : 'MISSION CONTROL'}</div><p>{comment}</p>{mode === 'rival' && <small>AI tracks your last 12 paddle positions and counters repeated side bias.</small>}{mode === 'boss' && <div className="boss-meter"><span style={{ width: (bossHp / Math.max(1, game.current.bossMax) * 100) + '%' }} /></div>}{mode === 'free' && <small>{targetHits} target rings hit · speed {speed.toFixed(1)}× · paddle {paddleWidth}px</small>}</section>
    </>}
    <footer><span>NEON ARCADE SYSTEMS</span><span>BUILT TO PLAY · DESIGNED TO REFLECT</span><span>PHONE · TABLET · DESKTOP</span></footer>
  </main>;
}
