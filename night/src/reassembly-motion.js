// A fixed eight-second recovery: ballistic release, contact-driven pulls, docking.
// These signals author the visuals only; combat and recovery duration stay in zombies.js.
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const starts=[1.34,1.12,1.47,1.68,1.29];
const docks=[6.44,6.05,6.56,6.27,6.78];
const cycles=[4,5,5,4,4];

export function reassemblyMotion(time,index){
 const t=Math.max(0,Math.min(8,time)),start=starts[index],dock=docks[index];
 const travel=clamp((t-start)/(dock-start)),steps=travel*cycles[index];
 const step=Math.min(cycles[index]-1,Math.floor(steps));
 const phase=travel===1?1:steps-step;
 // Most translation happens AFTER a hand/toe has planted; recovery holds position.
 const pull=smooth((phase-.22)/.46);
 const progress=travel===1?1:(step+pull)/cycles[index];
 const docking=smooth((t-dock)/(7.78-dock));
 const launch=smooth(t/.61),ground=smooth((t-.62)/.48)*(1-docking);
 const working=smooth((t-start)/.23)*(1-docking);
 const plant=smooth(phase/.20)*(1-smooth((phase-.69)/.25));
 const recoil=Math.sin(phase*Math.PI*2)*.020*working;
 const separation=launch*(1-progress*.91)*(1-docking);
 const twitch=(Math.sin(t*21.3+index*2.7)+Math.sin(t*33.1-index))*.5;
 return {time:t,phase,step,progress,docking,launch,ground,working,plant,pull,recoil,separation,
  lift:Math.sin(smooth((phase-.70)/.30)*Math.PI)*.04*working,
  twitch:twitch*(.25+.75*plant)*working,
  dockPulse:Math.sin(docking*Math.PI*3)*(1-docking)*docking,
  stage:t<.62?'impact':t<start?'settling':t<dock?'crawling':t<7.78?'docking':'joined'};
}
