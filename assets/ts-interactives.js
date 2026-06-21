
(function(){
  window.TSInteractives = window.TSInteractives || {};
  window.TSInteractives.plotlyConfig = window.TSInteractives.plotlyConfig || {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    scrollZoom: true,
    toImageButtonOptions: {
      format: "png",
      filename: "time-series-interactive",
      height: 600,
      width: 900,
      scale: 2
    }
  };
  function $(id){ return document.getElementById(id); }
  function randn(){
    let u=0, v=0;
    while(u===0) u=Math.random();
    while(v===0) v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  function range(n){ return Array.from({length:n}, (_,i)=>i); }
  function mean(x){ return x.reduce((a,b)=>a+b,0)/x.length; }
  function variance(x){ const m=mean(x); return x.reduce((s,v)=>s+(v-m)*(v-m),0)/x.length; }
  function acf(x, maxLag){
    const m=mean(x), denom=x.reduce((s,v)=>s+(v-m)*(v-m),0);
    const vals=[];
    for(let h=0; h<=maxLag; h++){
      let num=0;
      for(let t=h; t<x.length; t++) num += (x[t]-m)*(x[t-h]-m);
      vals.push(denom===0 ? 0 : num/denom);
    }
    return vals;
  }
  function diff(x, d){
    let y=x.slice();
    for(let k=0;k<d;k++) y = y.slice(1).map((v,i)=>v-y[i]);
    return y;
  }
  function ar1(n, phi, sigma){
    const x=[randn()*sigma/Math.sqrt(Math.max(1e-6,1-phi*phi))];
    for(let t=1;t<n;t++) x.push(phi*x[t-1]+sigma*randn());
    return x;
  }
  function ma1(n, theta, sigma){
    const w=range(n+1).map(()=>sigma*randn());
    return range(n).map(t=>w[t+1]+theta*w[t]);
  }
  function seasonal(n, slope, amp, period, sigma){
    return range(n).map(t=>0.02 + slope*t + amp*Math.sin(2*Math.PI*t/period)+sigma*randn());
  }
  function newPlot(id, traces, layout){
    if(typeof Plotly === 'undefined' || !$(id)) return;
    Plotly.newPlot(id, traces, Object.assign({margin:{t:55,l:45,r:20,b:40}, autosize:true}, layout || {}), window.TSInteractives.plotlyConfig);
  }
  function stemTrace(x, y, name){
    const xs=[], ys=[];
    for(let i=0;i<x.length;i++){ xs.push(x[i], x[i], null); ys.push(0, y[i], null); }
    return [{x:xs,y:ys,mode:'lines',name:name||'stems',line:{width:1}}, {x:x,y:y,mode:'markers',name:name||'ACF'}];
  }
  function addButton(id, fn){ const b=$(id); if(b) b.addEventListener('click', fn); }
  function addInput(ids, fn){ ids.forEach(id=>{ const el=$(id); if(el){ el.addEventListener('input', fn); el.addEventListener('change', fn); } }); }

  function init_ch01(){
    if(!$('ch01_ts_playground_plot')) return;
    function draw(){
      const model=$('ch01_model').value, n=Number($('ch01_n').value), phi=Number($('ch01_phi').value), theta=Number($('ch01_theta').value);
      let y;
      if(model==='white') y=range(n).map(()=>randn());
      else if(model==='randomwalk'){ y=[]; let s=0; for(let i=0;i<n;i++){s+=randn(); y.push(s);} }
      else if(model==='ar1') y=ar1(n,phi,1);
      else if(model==='ma1') y=ma1(n,theta,1);
      else y=seasonal(n,0.01,2,24,0.8);
      newPlot('ch01_ts_playground_plot',[{x:range(y.length), y:y, mode:'lines', name:model}], {title:'Simulated time series', xaxis:{title:'time'}, yaxis:{title:'value'}});
      const r=acf(y, Math.min(30, Math.floor(y.length/3)));
      const st=stemTrace(range(r.length), r, 'sample ACF');
      newPlot('ch01_ts_playground_acf', st, {title:'Sample ACF', xaxis:{title:'lag'}, yaxis:{range:[-1,1]}});
    }
    addInput(['ch01_model','ch01_n','ch01_phi','ch01_theta'], draw); draw();
  }
  function init_ch02(){
    if(!$('ch02_eda_plot')) return;
    function draw(){
      const slope=Number($('ch02_slope').value), amp=Number($('ch02_amp').value), period=Number($('ch02_period').value), smooth=Number($('ch02_smooth').value);
      const y=seasonal(240,slope,amp,period,0.8);
      const sm=y.map((_,i)=>{ const a=Math.max(0,i-smooth+1), arr=y.slice(a,i+1); return mean(arr); });
      newPlot('ch02_eda_plot',[{x:range(y.length),y:y,mode:'lines',name:'observed'}, {x:range(sm.length), y:sm, mode:'lines', name:'rolling mean'}], {title:'Trend + seasonality + noise', xaxis:{title:'time'}});
      const dy=diff(y,1); newPlot('ch02_eda_diff',[{x:range(dy.length),y:dy,mode:'lines',name:'first difference'}], {title:'First difference', xaxis:{title:'time'}});
    }
    addInput(['ch02_slope','ch02_amp','ch02_period','ch02_smooth'], draw); draw();
  }
  function init_ch03(){
    if(!$('ch03_acf_plot')) return;
    function draw(){
      const phi=Number($('ch03_phi').value), n=Number($('ch03_n').value);
      const x=ar1(n, phi, 1); const r=acf(x,30); const theory=range(31).map(h=>Math.pow(phi,h));
      newPlot('ch03_series_plot',[{x:range(n), y:x, mode:'lines', name:'AR(1)'}], {title:'AR(1) sample path'});
      newPlot('ch03_acf_plot',[...stemTrace(range(r.length), r, 'sample ACF'), {x:range(theory.length), y:theory, mode:'lines', name:'theoretical ACF'}], {title:'ACF comparison', yaxis:{range:[-1,1]}, xaxis:{title:'lag'}});
    }
    addInput(['ch03_phi','ch03_n'], draw); draw();
  }
  function init_ch04(){
    if(!$('ch04_roots_plot')) return;
    function draw(){
      const r=Number($('ch04_root_radius').value), ang=Number($('ch04_root_angle').value)*Math.PI;
      const xs=[r*Math.cos(ang), r*Math.cos(-ang)], ys=[r*Math.sin(ang), r*Math.sin(-ang)];
      const circleT=range(200).map(i=>2*Math.PI*i/199);
      newPlot('ch04_roots_plot',[
        {x:circleT.map(Math.cos), y:circleT.map(Math.sin), mode:'lines', name:'unit circle'},
        {x:xs, y:ys, mode:'markers', name:'roots', marker:{size:10}}
      ], {title:'Characteristic roots', xaxis:{range:[-2.2,2.2], scaleanchor:'y'}, yaxis:{range:[-2.2,2.2]}, annotations:[{x:0,y:-1.85,text:r>1?'causal/stationary for AR roots outside unit circle':'noncausal or explosive risk',showarrow:false}]});
    }
    addInput(['ch04_root_radius','ch04_root_angle'], draw); draw();
  }
  function init_ch05(){
    if(!$('ch05_recurrence_plot')) return;
    function draw(){
      const r=Number($('ch05_r').value), w=Number($('ch05_w').value), n=80;
      const y=range(n).map(t=>Math.pow(r,t)*Math.cos(w*t));
      newPlot('ch05_recurrence_plot',[{x:range(n),y:y,mode:'lines+markers',name:'r^t cos(ωt)'}], {title:'Damped or explosive oscillation', xaxis:{title:'t'}});
    }
    addInput(['ch05_r','ch05_w'], draw); draw();
  }
  function init_ch06(){
    if(!$('ch06_projection_plot')) return;
    function draw(){
      const phi=Number($('ch06_phi').value), x0=Number($('ch06_x0').value);
      const pred=phi*x0; const sd=1;
      const z=range(201).map(i=>pred-4+8*i/200); const pdf=z.map(v=>Math.exp(-0.5*Math.pow((v-pred)/sd,2))/Math.sqrt(2*Math.PI));
      newPlot('ch06_projection_plot',[{x:z,y:pdf,mode:'lines',name:'forecast density'}, {x:[pred,pred],y:[0,Math.max(...pdf)],mode:'lines',name:'BLP'}], {title:'One-step AR(1) forecast: X_{t+1|t}=φX_t', xaxis:{title:'future value'}});
    }
    addInput(['ch06_phi','ch06_x0'], draw); draw();
  }
  function init_ch08(){
    if(!$('ch08_diff_plot')) return;
    function draw(){
      const d=Number($('ch08_d').value); let y=[]; let s=0; for(let i=0;i<180;i++){s+=0.15+randn(); y.push(s+10*Math.sin(2*Math.PI*i/60));}
      const yd=diff(y,d);
      newPlot('ch08_raw_plot',[{x:range(y.length),y:y,mode:'lines',name:'raw'}], {title:'Nonstationary series'});
      newPlot('ch08_diff_plot',[{x:range(yd.length),y:yd,mode:'lines',name:d+' difference(s)'}], {title:'After differencing'});
      const r=acf(yd,30); newPlot('ch08_acf_plot', stemTrace(range(r.length),r,'ACF'), {title:'ACF after differencing', yaxis:{range:[-1,1]}});
    }
    addInput(['ch08_d'], draw); draw();
  }
  function init_ch12(){
    if(!$('ch12_spectrum_plot')) return;
    function draw(){
      const f1=Number($('ch12_f1').value), f2=Number($('ch12_f2').value), n=256;
      const y=range(n).map(t=>Math.sin(2*Math.PI*f1*t)+0.65*Math.sin(2*Math.PI*f2*t)+0.35*randn());
      const freqs=range(128).map(k=>k/n); const power=freqs.map(f=>{ let re=0, im=0; for(let t=0;t<n;t++){ re+=y[t]*Math.cos(2*Math.PI*f*t); im-=y[t]*Math.sin(2*Math.PI*f*t);} return (re*re+im*im)/n;});
      newPlot('ch12_signal_plot',[{x:range(n),y:y,mode:'lines',name:'signal'}], {title:'Signal with two hidden frequencies'});
      newPlot('ch12_spectrum_plot',[{x:freqs,y:power,mode:'lines',name:'periodogram'}], {title:'Frequency-domain view', xaxis:{title:'cycles per time step'}, yaxis:{title:'power'}});
    }
    addInput(['ch12_f1','ch12_f2'], draw); draw();
  }
  function init_ch13(){ init_ch12(); }
  function init_ch16(){
    if(!$('ch16_additive_plot')) return;
    function draw(){
      const trend=Number($('ch16_trend').value), season=Number($('ch16_season').value), changepoint=Number($('ch16_cp').value);
      const n=200, y=range(n).map(t=> trend*t + (t>100? changepoint*(t-100):0) + season*Math.sin(2*Math.PI*t/30)+0.5*randn());
      newPlot('ch16_additive_plot',[{x:range(n),y:y,mode:'lines',name:'y(t)=g(t)+s(t)+noise'}], {title:'Prophet-style additive model'});
    }
    addInput(['ch16_trend','ch16_season','ch16_cp'], draw); draw();
  }
  function init_ch19(){
    const plot = $('ch19_window_plot');
    if(!plot) return;

    const inputSlider = $('ch19_input');
    const horizonSlider = $('ch19_horizon');
    const startSlider = $('ch19_start');
    const inputValue = $('ch19_input_value');
    const horizonValue = $('ch19_horizon_value');
    const startValue = $('ch19_start_value');
    const summary = $('ch19_window_summary');

    if(!inputSlider || !horizonSlider || !startSlider) return;

    const n = 120;
    const t = range(n);
    const y = t.map(i =>
      0.012 * i +
      Math.sin(2 * Math.PI * i / 24) +
      0.35 * Math.sin(2 * Math.PI * i / 6) +
      0.15 * Math.cos(2 * Math.PI * i / 40)
    );

    function draw(){
      const input = Number(inputSlider.value);
      const horizon = Number(horizonSlider.value);
      const maxStart = Math.max(0, n - input - horizon);

      startSlider.max = String(maxStart);
      if(Number(startSlider.value) > maxStart) startSlider.value = String(maxStart);

      const start = Number(startSlider.value);
      const inputX = range(input).map(i => start + i);
      const labelX = range(horizon).map(i => start + input + i);
      const inputY = y.slice(start, start + input);
      const labelY = y.slice(start + input, start + input + horizon);
      const origin = start + input - 1;

      if(inputValue) inputValue.textContent = String(input);
      if(horizonValue) horizonValue.textContent = String(horizon);
      if(startValue) startValue.textContent = String(start);
      if(summary){
        summary.innerHTML =
          `Input window: <strong>Y_${start}</strong> to <strong>Y_${origin}</strong>. ` +
          `Label window: <strong>Y_${origin + 1}</strong> to <strong>Y_${origin + horizon}</strong>. ` +
          `The supervised example has shape <strong>R<sup>${input}</sup> → R<sup>${horizon}</sup></strong>.`;
      }

      const traces = [
        {x:t, y:y, mode:'lines', name:'full observed series'},
        {x:inputX, y:inputY, mode:'lines+markers', name:'input window'},
        {x:labelX, y:labelY, mode:'lines+markers', name:'label window', marker:{symbol:'x', size:9}}
      ];

      const layout = {
        title:'Sliding input and label windows',
        xaxis:{title:'time index'},
        yaxis:{title:'value'},
        margin:{t:70, l:55, r:25, b:50},
        legend:{orientation:'h', y:-0.22},
        shapes:[{
          type:'line',
          x0:origin + 0.5,
          x1:origin + 0.5,
          y0:Math.min(...y) - 0.2,
          y1:Math.max(...y) + 0.2,
          line:{dash:'dash', width:1}
        }],
        annotations:[{
          x:origin + 0.5,
          y:Math.max(...y) + 0.15,
          text:'forecast origin',
          showarrow:false,
          yanchor:'bottom'
        }]
      };

      newPlot('ch19_window_plot', traces, layout);
    }

    addInput(['ch19_input','ch19_horizon','ch19_start'], draw);
    draw();
  }
  function init_ch20(){
    const convPlot = $('ch20_conv_plot');
    const rfPlot = $('ch20_rf_plot');

    function kernelWeights(K){
      const base = [];
      for(let j=0; j<K; j++){
        const sign = (j % 2 === 0) ? 1 : -1;
        base.push(sign / (j + 1));
      }
      const norm = base.reduce((s,v)=>s+Math.abs(v),0) || 1;
      return base.map(v=>v/norm);
    }

    function sequence(n){
      return range(n).map(t =>
        Math.sin(2*Math.PI*t/24) +
        0.35*Math.sin(2*Math.PI*t/6) +
        0.015*t +
        0.12*Math.cos(2*Math.PI*t/37)
      );
    }

    function drawConv(){
      if(!convPlot) return;
      const kernelEl = $('ch20_kernel');
      const dilationEl = $('ch20_dilation');
      const timeEl = $('ch20_time');
      if(!kernelEl || !dilationEl || !timeEl) return;

      const K = Number(kernelEl.value);
      const dilation = Number(dilationEl.value);
      const t0 = Number(timeEl.value);
      const n = 96;
      const x = sequence(n);
      const w = kernelWeights(K);
      const y = range(n).map(t => {
        let total = 0;
        for(let j=0; j<K; j++){
          const idx = t - j*dilation;
          if(idx >= 0) total += w[j]*x[idx];
        }
        return total;
      });

      const used = [];
      const terms = [];
      let selected = 0;
      for(let j=0; j<K; j++){
        const idx = t0 - j*dilation;
        const xval = idx >= 0 ? x[idx] : 0;
        const contribution = w[j] * xval;
        selected += contribution;
        terms.push(`${w[j].toFixed(3)}×x_${idx}${idx < 0 ? ' (padding)' : ''}`);
        if(idx >= 0) used.push({idx:idx, value:x[idx], weight:w[j], contribution:contribution});
      }

      const kv = $('ch20_kernel_value');
      const dv = $('ch20_dilation_value');
      const tv = $('ch20_time_value');
      if(kv) kv.textContent = String(K);
      if(dv) dv.textContent = String(dilation);
      if(tv) tv.textContent = String(t0);

      const output = $('ch20_kernel_output');
      if(output){
        const minLag = t0 - (K-1)*dilation;
        output.innerHTML =
          `At output time <strong>t₀=${t0}</strong>, the filter uses lags ` +
          `<strong>${used.map(u=>u.idx).join(', ') || 'left padding only'}</strong>. ` +
          `The earliest requested index is <strong>${minLag}</strong>. ` +
          `Selected output value: <strong>${selected.toFixed(3)}</strong>. ` +
          `<br><span style="font-size:0.92em">Formula: z<sub>${t0}</sub> = ${terms.join(' + ')}</span>`;
      }

      const ymin = Math.min(...x, ...y);
      const ymax = Math.max(...x, ...y);
      const shapes = [
        {type:'line', x0:t0, x1:t0, y0:ymin-0.2, y1:ymax+0.2, line:{dash:'dash', width:1}},
        ...used.map(u => ({
          type:'line', x0:u.idx, x1:u.idx, y0:ymin-0.1, y1:u.value,
          line:{dash:'dot', width:1}
        }))
      ];

      const traces = [
        {x:range(n), y:x, mode:'lines', name:'input x_t'},
        {x:range(n), y:y, mode:'lines', name:'convolution output z_t'},
        {x:used.map(u=>u.idx), y:used.map(u=>u.value), mode:'markers', name:'inputs used for z_t₀', marker:{size:11, symbol:'circle-open'}},
        {x:[t0], y:[y[t0]], mode:'markers', name:'selected output', marker:{size:13, symbol:'diamond'}}
      ];

      const layout = {
        title:'Causal dilated convolution: highlighted inputs influence the selected output',
        xaxis:{title:'time'},
        yaxis:{title:'value'},
        margin:{t:75, l:55, r:25, b:55},
        legend:{orientation:'h', y:-0.22},
        shapes:shapes,
        annotations:[{x:t0, y:ymax+0.12, text:'t₀', showarrow:false, yanchor:'bottom'}]
      };
      newPlot('ch20_conv_plot', traces, layout);
    }

    function reachableOffsets(K, dilations){
      let offsets = new Set([0]);
      for(const d of dilations){
        const next = new Set();
        offsets.forEach(base => {
          for(let j=0; j<K; j++) next.add(base + j*d);
        });
        offsets = next;
      }
      return Array.from(offsets).sort((a,b)=>a-b);
    }

    function drawRF(){
      if(!rfPlot) return;
      const layersEl = $('ch20_layers');
      const kernelEl = $('ch20_rf_kernel');
      const dilationEl = $('ch20_rf_dilation');
      const modeEl = $('ch20_rf_mode');
      if(!layersEl || !kernelEl || !dilationEl || !modeEl) return;

      const L = Number(layersEl.value);
      const K = Number(kernelEl.value);
      const dConst = Number(dilationEl.value);
      const mode = modeEl.value;
      const dilations = range(L).map(i => mode === 'exp' ? Math.pow(2, i) : dConst);
      const offsets = reachableOffsets(K, dilations);
      const maxOffset = Math.max(...offsets);
      const width = maxOffset + 1;
      const formulaWidth = 1 + (K-1) * dilations.reduce((a,b)=>a+b,0);

      const lv = $('ch20_layers_value');
      const kv = $('ch20_rf_kernel_value');
      const dv = $('ch20_rf_dilation_value');
      if(lv) lv.textContent = String(L);
      if(kv) kv.textContent = String(K);
      if(dv) dv.textContent = String(dConst);

      const output = $('ch20_rf_output');
      if(output){
        output.innerHTML =
          `Dilation schedule: <strong>[${dilations.join(', ')}]</strong>. ` +
          `Receptive-field width: <strong>${width}</strong>. ` +
          `Formula check: <strong>1 + (K−1)Σdℓ = ${formulaWidth}</strong>. ` +
          `Number of distinct input lags represented: <strong>${offsets.length}</strong>.`;
      }

      const xVals = offsets.map(o => -o);
      const yVals = offsets.map(() => 1);
      const allLags = range(width).map(o => -o);
      const allIndicators = range(width).map(o => offsets.includes(o) ? 1 : 0);

      const traces = [
        {x:allLags, y:allIndicators, mode:'lines', name:'reachable indicator', line:{shape:'hv'}},
        {x:xVals, y:yVals, mode:'markers', name:'input lags that can affect output', marker:{size:9}},
        {x:[0], y:[1.15], mode:'markers+text', name:'output time', text:['output at t'], textposition:'top center', marker:{size:12, symbol:'diamond'}}
      ];

      const layout = {
        title:'Receptive field of stacked causal dilated convolutions',
        xaxis:{title:'relative input lag', range:[-maxOffset-2, 2]},
        yaxis:{title:'reachable?', range:[-0.1, 1.35], tickvals:[0,1]},
        margin:{t:75, l:55, r:25, b:55},
        legend:{orientation:'h', y:-0.25},
        annotations:[{
          x:-maxOffset,
          y:1.12,
          text:`oldest visible input: x_{t-${maxOffset}}`,
          showarrow:false,
          yanchor:'bottom'
        }]
      };
      newPlot('ch20_rf_plot', traces, layout);
    }

    addInput(['ch20_kernel','ch20_dilation','ch20_time'], drawConv);
    addInput(['ch20_layers','ch20_rf_kernel','ch20_rf_dilation','ch20_rf_mode'], drawRF);
    drawConv();
    drawRF();
  }
  function init_ch21(){
    function activation(name, z){
      if(name === 'linear') return z;
      if(name === 'relu') return Math.max(0, z);
      return Math.tanh(z);
    }
    function ch21Input(pattern, n){
      return range(n).map(t => {
        if(pattern === 'sine') return Math.sin(2*Math.PI*t/24);
        if(pattern === 'step') return t < Math.floor(n/2) ? 0 : 1;
        if(pattern === 'alternating') return (t % 2 === 0 ? 1 : -1) * (0.7 + 0.2*Math.sin(2*Math.PI*t/31));
        const pulse = (t >= 18 && t <= 24) ? 1.8 : 0;
        return 0.55*Math.sin(2*Math.PI*t/20) + pulse;
      });
    }
    function drawRNNState(){
      if(!$('ch21_rnn_state_plot')) return;
      const aEl = $('ch21_rnn_a');
      const bEl = $('ch21_rnn_b');
      const actEl = $('ch21_rnn_activation');
      const inputEl = $('ch21_rnn_input');
      if(!aEl || !bEl || !actEl || !inputEl) return;
      const a = Number(aEl.value);
      const b = Number(bEl.value);
      const act = actEl.value;
      const pattern = inputEl.value;
      const n = 90;
      const x = ch21Input(pattern, n);
      const h = [];
      let state = 0;
      for(let t=0; t<n; t++){
        state = activation(act, a*state + b*x[t]);
        if(!Number.isFinite(state)) state = Math.sign(state || 1) * 1e6;
        h.push(Math.max(-8, Math.min(8, state)));
      }
      const av = $('ch21_rnn_a_value');
      const bv = $('ch21_rnn_b_value');
      if(av) av.textContent = a.toFixed(2);
      if(bv) bv.textContent = b.toFixed(2);
      const msg = $('ch21_rnn_state_output');
      if(msg){
        let note = '';
        if(act === 'linear' && Math.abs(a) > 1) note = ' With a linear activation and |a|>1, the state can explode; the plot is clipped for readability.';
        else if(Math.abs(a) < 0.7) note = ' The hidden state forgets the remote past relatively quickly.';
        else if(a < 0) note = ' Negative recurrence creates alternating signs in the hidden state.';
        else note = ' Positive recurrence creates persistent memory.';
        msg.innerHTML = `Recurrence: <strong>h<sub>t</sub> = ${act}(${a.toFixed(2)} h<sub>t−1</sub> + ${b.toFixed(2)} x<sub>t</sub>)</strong>.${note}`;
      }
      const traces = [
        {x:range(n), y:x, mode:'lines', name:'input x_t'},
        {x:range(n), y:h, mode:'lines', name:'hidden state h_t'}
      ];
      const layout = {
        title:'Vanilla RNN hidden-state dynamics',
        xaxis:{title:'time'},
        yaxis:{title:'value'},
        margin:{t:75,l:55,r:25,b:55},
        legend:{orientation:'h', y:-0.22},
        shapes: pattern === 'pulse' ? [{type:'rect', x0:18, x1:24, y0:Math.min(...x,...h)-0.2, y1:Math.max(...x,...h)+0.2, opacity:0.12, line:{width:0}}] : []
      };
      newPlot('ch21_rnn_state_plot', traces, layout);
    }
    function drawGates(){
      if(!$('ch21_gate_plot')) return;
      const modelEl = $('ch21_gate_model');
      const g1El = $('ch21_gate1');
      const g2El = $('ch21_gate2');
      const g3El = $('ch21_gate3');
      const gainEl = $('ch21_gate_gain');
      if(!modelEl || !g1El || !g2El || !g3El || !gainEl) return;
      const model = modelEl.value;
      const g1 = Number(g1El.value);
      const g2 = Number(g2El.value);
      const g3 = Number(g3El.value);
      const gain = Number(gainEl.value);
      const n = 100;
      const x = range(n).map(t => {
        const burst = (t >= 20 && t <= 30) ? 1.5 : 0;
        const later = (t >= 62 && t <= 70) ? -1.1 : 0;
        return 0.35*Math.sin(2*Math.PI*t/18) + burst + later;
      });
      const candidate = x.map(v => Math.tanh(gain*v));
      const memory = [];
      const hidden = [];
      let c = 0, h = 0;
      if(model === 'lstm'){
        for(let t=0; t<n; t++){
          const cand = Math.tanh(gain*x[t]);
          c = g1*c + g2*cand;
          h = g3*Math.tanh(c);
          memory.push(c);
          hidden.push(h);
        }
      } else {
        // simplified GRU: g1 is update z, g2 is reset r, g3 is output scaling for visualization
        for(let t=0; t<n; t++){
          const z = g1;
          const r = g2;
          const cand = Math.tanh(gain*x[t] + r*h);
          h = (1-z)*h + z*cand;
          memory.push(cand);
          hidden.push(g3*h);
        }
      }
      const labels = model === 'lstm'
        ? ['Forget gate f','Input gate i','Output gate o']
        : ['Update gate z','Reset gate r','Output scale'];
      const l1 = $('ch21_gate1_label'), l2 = $('ch21_gate2_label'), l3 = $('ch21_gate3_label');
      if(l1) l1.textContent = labels[0];
      if(l2) l2.textContent = labels[1];
      if(l3) l3.textContent = labels[2];
      const v1 = $('ch21_gate1_value'), v2 = $('ch21_gate2_value'), v3 = $('ch21_gate3_value'), vg = $('ch21_gate_gain_value');
      if(v1) v1.textContent = g1.toFixed(2);
      if(v2) v2.textContent = g2.toFixed(2);
      if(v3) v3.textContent = g3.toFixed(2);
      if(vg) vg.textContent = gain.toFixed(2);
      const msg = $('ch21_gate_output');
      if(msg){
        if(model === 'lstm'){
          msg.innerHTML = `Simplified LSTM: <strong>c<sub>t</sub> = ${g1.toFixed(2)}c<sub>t−1</sub> + ${g2.toFixed(2)}ĉ<sub>t</sub></strong>, <strong>h<sub>t</sub> = ${g3.toFixed(2)} tanh(c<sub>t</sub>)</strong>. High forget gate preserves memory; high input gate overwrites memory faster.`;
        } else {
          msg.innerHTML = `Simplified GRU: <strong>h<sub>t</sub> = (1−${g1.toFixed(2)})h<sub>t−1</sub> + ${g1.toFixed(2)}h̃<sub>t</sub></strong>. A high update gate replaces the state quickly; a low update gate preserves the previous state.`;
        }
      }
      const traces = [
        {x:range(n), y:x, mode:'lines', name:'input x_t'},
        {x:range(n), y:candidate, mode:'lines', name:'candidate'},
        {x:range(n), y:memory, mode:'lines', name:model === 'lstm' ? 'cell state c_t' : 'candidate state h̃_t'},
        {x:range(n), y:hidden, mode:'lines', name:'visible hidden state h_t'}
      ];
      const layout = {
        title: model === 'lstm' ? 'Simplified LSTM gated memory' : 'Simplified GRU gated memory',
        xaxis:{title:'time'},
        yaxis:{title:'value'},
        margin:{t:75,l:55,r:25,b:55},
        legend:{orientation:'h', y:-0.25},
        shapes:[
          {type:'rect', x0:20, x1:30, y0:Math.min(...x,...memory,...hidden)-0.2, y1:Math.max(...x,...memory,...hidden)+0.2, opacity:0.10, line:{width:0}},
          {type:'rect', x0:62, x1:70, y0:Math.min(...x,...memory,...hidden)-0.2, y1:Math.max(...x,...memory,...hidden)+0.2, opacity:0.10, line:{width:0}}
        ]
      };
      newPlot('ch21_gate_plot', traces, layout);
    }
    addInput(['ch21_rnn_a','ch21_rnn_b','ch21_rnn_activation','ch21_rnn_input'], drawRNNState);
    addInput(['ch21_gate_model','ch21_gate1','ch21_gate2','ch21_gate3','ch21_gate_gain'], drawGates);
    drawRNNState();
    drawGates();
  }

  function init_ch22(){
    function softmax(scores){
      const finite = scores.filter(v => Number.isFinite(v));
      const m = finite.length ? Math.max(...finite) : 0;
      const exps = scores.map(v => Number.isFinite(v) ? Math.exp(v - m) : 0);
      const s = exps.reduce((a,b)=>a+b,0);
      return s === 0 ? exps.map(()=>0) : exps.map(v => v/s);
    }
    function ch22Signal(n){
      return range(n).map(t => {
        const seasonal = Math.sin(2*Math.PI*t/12);
        const high = 0.45*Math.cos(2*Math.PI*t/5);
        const pulse = (t >= Math.floor(0.58*n) && t <= Math.floor(0.70*n)) ? 1.3 : 0;
        const drift = 0.015*t;
        return seasonal + high + pulse + drift;
      });
    }
    function featureVector(x, t, n){
      return [
        x[t],
        Math.sin(2*Math.PI*t/12),
        Math.cos(2*Math.PI*t/12),
        t / Math.max(1, n-1),
        1
      ];
    }
    function dot(a,b){
      let s = 0;
      for(let i=0;i<a.length;i++) s += a[i]*b[i];
      return s;
    }
    function drawAttention(){
      if(!$('ch22_attention_heatmap') || !$('ch22_attention_weights')) return;
      const lenEl = $('ch22_attn_len');
      const queryEl = $('ch22_attn_query');
      const tempEl = $('ch22_attn_temperature');
      const decayEl = $('ch22_attn_decay');
      const maskEl = $('ch22_attn_mask');
      if(!lenEl || !queryEl || !tempEl || !decayEl || !maskEl) return;

      const n = Number(lenEl.value);
      queryEl.max = String(n);
      if(Number(queryEl.value) > n) queryEl.value = String(n);
      if(Number(queryEl.value) < 1) queryEl.value = '1';
      const qIndex = Number(queryEl.value) - 1;
      const tau = Math.max(0.05, Number(tempEl.value));
      const decay = Math.max(1, Number(decayEl.value));
      const causal = maskEl.value === 'causal';
      const x = ch22Signal(n);
      const feats = range(n).map(t => featureVector(x,t,n));

      const z = [];
      for(let i=0;i<n;i++){
        const rowScores = [];
        for(let j=0;j<n;j++){
          if(causal && j > i){
            rowScores.push(-Infinity);
          } else {
            const content = dot(feats[i], feats[j]) / Math.sqrt(feats[i].length);
            const localBias = -Math.abs(i-j) / decay;
            const seasonalBias = (Math.abs(i-j-12) <= 1 || Math.abs(i-j+12) <= 1) ? 0.65 : 0;
            rowScores.push((content + localBias + seasonalBias) / tau);
          }
        }
        z.push(softmax(rowScores));
      }

      const selectedWeights = z[qIndex];
      const context = selectedWeights.reduce((s,w,j)=>s + w*x[j], 0);
      const futureMass = selectedWeights.slice(qIndex+1).reduce((a,b)=>a+b,0);
      const maxWeight = Math.max(...selectedWeights);
      const maxKey = selectedWeights.indexOf(maxWeight) + 1;

      const lv = $('ch22_attn_len_value');
      const qv = $('ch22_attn_query_value');
      const tv = $('ch22_attn_temperature_value');
      const dv = $('ch22_attn_decay_value');
      if(lv) lv.textContent = String(n);
      if(qv) qv.textContent = String(qIndex + 1);
      if(tv) tv.textContent = tau.toFixed(2);
      if(dv) dv.textContent = String(decay);

      const msg = $('ch22_attention_output');
      if(msg){
        msg.innerHTML =
          `Selected query time: <strong>t=${qIndex+1}</strong>. ` +
          `Largest attention weight is on key time <strong>s=${maxKey}</strong>. ` +
          `Weighted context value Σα<sub>t,s</sub>x<sub>s</sub> = <strong>${context.toFixed(3)}</strong>. ` +
          `Future attention mass = <strong>${futureMass.toExponential(2)}</strong>${causal ? ' under the causal mask.' : ' with no mask.'}`;
      }

      const labels = range(n).map(i=>i+1);
      const heatTraces = [{
        z:z,
        x:labels,
        y:labels,
        type:'heatmap',
        colorscale:'Viridis',
        colorbar:{title:'weight'},
        hovertemplate:'query t=%{y}<br>key s=%{x}<br>weight=%{z:.3f}<extra></extra>'
      }];
      const shapes = [
        {type:'line', x0:0.5, x1:n+0.5, y0:qIndex+1, y1:qIndex+1, line:{width:2, dash:'dot'}},
        {type:'line', x0:qIndex+1, x1:qIndex+1, y0:0.5, y1:n+0.5, line:{width:2, dash:'dot'}}
      ];
      newPlot('ch22_attention_heatmap', heatTraces, {
        title: causal ? 'Causal self-attention weights' : 'Unmasked self-attention weights',
        xaxis:{title:'key time s'},
        yaxis:{title:'query time t'},
        shapes: shapes,
        margin:{t:75,l:65,r:45,b:55}
      });

      const barColors = labels.map(s => (causal && s > qIndex+1) ? 0 : selectedWeights[s-1]);
      const weightTrace = {
        x:labels,
        y:selectedWeights,
        type:'bar',
        name:'attention weights α_{t,s}',
        marker:{color:barColors, colorscale:'Viridis', showscale:false},
        hovertemplate:'key s=%{x}<br>weight=%{y:.3f}<extra></extra>'
      };
      const signalTrace = {
        x:labels,
        y:x,
        mode:'lines+markers',
        name:'sequence value x_s',
        yaxis:'y2'
      };
      newPlot('ch22_attention_weights', [weightTrace, signalTrace], {
        title:`Attention row for query time t=${qIndex+1}`,
        xaxis:{title:'key time s'},
        yaxis:{title:'attention weight', range:[0, Math.max(0.08, maxWeight*1.25)]},
        yaxis2:{title:'sequence value', overlaying:'y', side:'right', showgrid:false},
        legend:{orientation:'h', y:-0.25},
        margin:{t:75,l:60,r:60,b:55},
        shapes:[{type:'line', x0:qIndex+1, x1:qIndex+1, y0:0, y1:Math.max(0.08, maxWeight*1.2), line:{dash:'dot', width:2}}]
      });
    }

    function positionalEncoding(length, dModel){
      const pe = [];
      for(let t=0;t<length;t++){
        const row = [];
        for(let k=0;k<dModel;k++){
          const pair = Math.floor(k/2);
          const angle = t / Math.pow(10000, (2*pair)/dModel);
          row.push(k % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
        }
        pe.push(row);
      }
      return pe;
    }
    function norm(v){ return Math.sqrt(v.reduce((s,x)=>s+x*x,0)); }
    function drawPositional(){
      if(!$('ch22_pos_signal') || !$('ch22_pos_similarity')) return;
      const lenEl = $('ch22_pos_len');
      const dimEl = $('ch22_pos_dim');
      const refEl = $('ch22_pos_ref');
      const freqEl = $('ch22_pos_freq');
      if(!lenEl || !dimEl || !refEl || !freqEl) return;

      const n = Number(lenEl.value);
      const d = Number(dimEl.value);
      refEl.max = String(n-1);
      if(Number(refEl.value) > n-1) refEl.value = String(n-1);
      const maxPair = Math.floor(d/2)-1;
      freqEl.max = String(maxPair);
      if(Number(freqEl.value) > maxPair) freqEl.value = String(maxPair);
      const ref = Number(refEl.value);
      const pair = Number(freqEl.value);
      const pe = positionalEncoding(n,d);
      const positions = range(n);
      const sinDim = 2*pair;
      const cosDim = 2*pair + 1;
      const wavelength = 2*Math.PI*Math.pow(10000, (2*pair)/d);
      const refVec = pe[ref];
      const refNorm = norm(refVec);
      const sim = pe.map(v => dot(v, refVec)/(Math.max(1e-12, norm(v)*refNorm)));

      const lv = $('ch22_pos_len_value');
      const rv = $('ch22_pos_ref_value');
      const fv = $('ch22_pos_freq_value');
      if(lv) lv.textContent = String(n);
      if(rv) rv.textContent = String(ref);
      if(fv) fv.textContent = String(pair);
      const msg = $('ch22_pos_output');
      if(msg){
        msg.innerHTML =
          `Displaying component pair <strong>j=${pair}</strong>: dimensions <strong>${sinDim}</strong> and <strong>${cosDim}</strong>. ` +
          `Approximate wavelength is <strong>${wavelength.toFixed(1)}</strong> positions. ` +
          `Similarity is computed as a normalized dot product with position <strong>${ref}</strong>.`;
      }

      newPlot('ch22_pos_signal', [
        {x:positions, y:pe.map(r=>r[sinDim]), mode:'lines', name:`sin dimension ${sinDim}`},
        {x:positions, y:pe.map(r=>r[cosDim]), mode:'lines', name:`cos dimension ${cosDim}`}
      ], {
        title:'Sinusoidal positional encoding components',
        xaxis:{title:'position'},
        yaxis:{title:'encoding value', range:[-1.1,1.1]},
        legend:{orientation:'h', y:-0.25},
        margin:{t:75,l:55,r:25,b:55},
        shapes:[{type:'line', x0:ref, x1:ref, y0:-1.1, y1:1.1, line:{dash:'dot', width:2}}]
      });
      newPlot('ch22_pos_similarity', [
        {x:positions, y:sim, mode:'lines', name:'positional similarity'},
        {x:[ref], y:[sim[ref]], mode:'markers+text', text:['reference'], textposition:'top center', name:'reference position', marker:{size:11}}
      ], {
        title:'Similarity to the reference positional vector',
        xaxis:{title:'position'},
        yaxis:{title:'cosine similarity', range:[-1.05,1.05]},
        margin:{t:75,l:55,r:25,b:55},
        legend:{orientation:'h', y:-0.25}
      });
    }

    addInput(['ch22_attn_len','ch22_attn_query','ch22_attn_temperature','ch22_attn_decay','ch22_attn_mask'], drawAttention);
    addInput(['ch22_pos_len','ch22_pos_dim','ch22_pos_ref','ch22_pos_freq'], drawPositional);
    drawAttention();
    drawPositional();
  }

  function init_ch23(){
    function seeded(seed){
      let a = Math.floor(seed) >>> 0;
      return function(){
        a += 0x6D2B79F5;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function randnFrom(rng){
      let u = 0, v = 0;
      while(u === 0) u = rng();
      while(v === 0) v = rng();
      return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
    }
    function standardize(x){
      const m = mean(x);
      const sd = Math.sqrt(Math.max(1e-12, variance(x)));
      return x.map(v => (v-m)/sd);
    }
    function spectralAmp(x, period){
      let c = 0, s = 0;
      for(let t=0;t<x.length;t++){
        const angle = 2*Math.PI*t/period;
        c += x[t]*Math.cos(angle);
        s += x[t]*Math.sin(angle);
      }
      return Math.sqrt(c*c+s*s)/x.length;
    }
    function slopeFeature(x){
      const n = x.length;
      const tbar = (n-1)/2;
      const xbar = mean(x);
      let num = 0, den = 0;
      for(let t=0;t<n;t++){
        num += (t-tbar)*(x[t]-xbar);
        den += (t-tbar)*(t-tbar);
      }
      return den === 0 ? 0 : num/den;
    }
    function maxJump(x){
      let m = 0;
      for(let i=1;i<x.length;i++) m = Math.max(m, Math.abs(x[i]-x[i-1]));
      return m;
    }
    function makeWindow(kind, L, noise, rng){
      const phase = 2*Math.PI*rng();
      const x = [];
      const center = Math.floor(L*(0.30 + 0.40*rng()));
      for(let t=0;t<L;t++){
        let v;
        if(kind === 'low frequency'){
          v = Math.sin(2*Math.PI*t/Math.max(18, L/2) + phase) + 0.25*Math.sin(2*Math.PI*t/Math.max(8, L/7));
        } else if(kind === 'high frequency'){
          v = Math.sin(2*Math.PI*t/Math.max(6, L/8) + phase) + 0.20*Math.sin(2*Math.PI*t/Math.max(5, L/12));
        } else if(kind === 'trend'){
          const slope = 0.018 + 0.030*rng();
          v = slope*t + 0.30*Math.sin(2*Math.PI*t/Math.max(14, L/3) + phase);
        } else {
          v = 0.60*Math.sin(2*Math.PI*t/Math.max(16, L/2.8) + phase);
          if(t >= center && t < center+3) v += 2.2 + 1.4*rng();
        }
        v += noise*randnFrom(rng);
        x.push(v);
      }
      return standardize(x);
    }
    function featuresForWindow(x){
      const r = acf(x, 1)[1] || 0;
      return {
        mean: mean(x),
        sd: Math.sqrt(variance(x)),
        acf1: r,
        slope: slopeFeature(x),
        low: spectralAmp(x, Math.max(18, x.length/2)),
        high: spectralAmp(x, Math.max(6, x.length/8)),
        jump: maxJump(x)
      };
    }
    function generateEmbeddingData(L, noise, seed){
      const rng = seeded(1000 + 17*seed + L);
      const labels = ['low frequency','high frequency','trend','spike'];
      const windows = [], points = [];
      let idx = 0;
      labels.forEach(label => {
        for(let j=0;j<20;j++){
          const w = makeWindow(label, L, noise, rng);
          const f = featuresForWindow(w);
          const xCoord = 1.55*f.low - 1.35*f.high + 0.35*f.acf1 + 0.08*randnFrom(rng);
          const yCoord = 42*f.slope + 0.90*f.jump + 0.20*f.acf1 + 0.08*randnFrom(rng);
          windows.push(w);
          points.push({x:xCoord, y:yCoord, label:label, index:idx, features:f});
          idx += 1;
        }
      });
      return {labels:labels, windows:windows, points:points};
    }
    function drawSelectedWindow(data, selectedIndex){
      if(!$('ch23_selected_window_plot')) return;
      const w = data.windows[selectedIndex] || data.windows[0];
      const p = data.points[selectedIndex] || data.points[0];
      newPlot('ch23_selected_window_plot', [
        {x:range(w.length), y:w, mode:'lines+markers', name:p.label, hovertemplate:'time=%{x}<br>value=%{y:.3f}<extra></extra>'}
      ], {
        title:`Selected window: ${p.label}`,
        xaxis:{title:'within-window time'},
        yaxis:{title:'standardized value'},
        margin:{t:75,l:55,r:25,b:55}
      });
    }
    function drawEmbedding(){
      if(!$('ch23_embedding_plot')) return;
      const lengthEl = $('ch23_embed_length');
      const noiseEl = $('ch23_embed_noise');
      const seedEl = $('ch23_embed_seed');
      if(!lengthEl || !noiseEl || !seedEl) return;
      const L = Number(lengthEl.value);
      const noise = Number(noiseEl.value);
      const seed = Number(seedEl.value);
      if($('ch23_embed_length_value')) $('ch23_embed_length_value').textContent = String(L);
      if($('ch23_embed_noise_value')) $('ch23_embed_noise_value').textContent = noise.toFixed(2);
      if($('ch23_embed_seed_value')) $('ch23_embed_seed_value').textContent = String(seed);
      const data = generateEmbeddingData(L, noise, seed);
      const traces = data.labels.map(label => {
        const pts = data.points.filter(p => p.label === label);
        return {
          x: pts.map(p => p.x),
          y: pts.map(p => p.y),
          mode: 'markers',
          type: 'scatter',
          name: label,
          customdata: pts.map(p => p.index),
          marker: {size: 9, opacity: 0.82},
          hovertemplate: 'class=' + label + '<br>embedding 1=%{x:.3f}<br>embedding 2=%{y:.3f}<extra></extra>'
        };
      });
      newPlot('ch23_embedding_plot', traces, {
        title: 'Two-dimensional representation of synthetic time-series windows',
        xaxis:{title:'embedding coordinate 1: low-vs-high frequency structure'},
        yaxis:{title:'embedding coordinate 2: trend/jump structure'},
        legend:{orientation:'h', y:-0.23},
        margin:{t:75,l:70,r:25,b:65}
      });
      const out = $('ch23_embedding_output');
      if(out){
        out.innerHTML = `Generated <strong>${data.points.length}</strong> windows with length <strong>L=${L}</strong>. ` +
          `Noise level is <strong>${noise.toFixed(2)}</strong>. ` +
          `The embedding is computed from interpretable features: autocorrelation, trend slope, spectral energy, and maximum jump.`;
      }
      drawSelectedWindow(data, 0);
      const plotDiv = $('ch23_embedding_plot');
      if(plotDiv && typeof plotDiv.on === 'function'){
        if(typeof plotDiv.removeAllListeners === 'function') plotDiv.removeAllListeners('plotly_click');
        plotDiv.on('plotly_click', function(ev){
          if(ev && ev.points && ev.points.length > 0){
            const selected = Number(ev.points[0].customdata);
            drawSelectedWindow(data, selected);
          }
        });
      }
    }
    function bottleneckSeries(anomalySize, noise){
      const n = 128;
      const rng = seeded(2300 + Math.round(100*anomalySize) + Math.round(100*noise));
      const y = [];
      for(let t=0;t<n;t++){
        let v = Math.sin(2*Math.PI*t/32) + 0.45*Math.sin(2*Math.PI*t/11) + 0.0025*t;
        if(t >= 66 && t <= 72) v += anomalySize;
        v += noise*randnFrom(rng);
        y.push(v);
      }
      return y;
    }
    function fourierBottleneck(y, k){
      const n = y.length;
      const m = mean(y);
      const centered = y.map(v => v-m);
      const recon = range(n).map(() => m);
      for(let j=1;j<=k;j++){
        let a = 0, b = 0;
        for(let t=0;t<n;t++){
          const angle = 2*Math.PI*j*t/n;
          a += centered[t]*Math.cos(angle);
          b += centered[t]*Math.sin(angle);
        }
        a *= 2/n;
        b *= 2/n;
        for(let t=0;t<n;t++){
          const angle = 2*Math.PI*j*t/n;
          recon[t] += a*Math.cos(angle) + b*Math.sin(angle);
        }
      }
      return recon;
    }
    function drawBottleneck(){
      if(!$('ch23_bottleneck_reconstruction_plot')) return;
      const kEl = $('ch23_bottleneck_k');
      const anomalyEl = $('ch23_bottleneck_anomaly');
      const noiseEl = $('ch23_bottleneck_noise');
      if(!kEl || !anomalyEl || !noiseEl) return;
      const k = Number(kEl.value);
      const anomaly = Number(anomalyEl.value);
      const noise = Number(noiseEl.value);
      if($('ch23_bottleneck_k_value')) $('ch23_bottleneck_k_value').textContent = String(k);
      if($('ch23_bottleneck_anomaly_value')) $('ch23_bottleneck_anomaly_value').textContent = anomaly.toFixed(2);
      if($('ch23_bottleneck_noise_value')) $('ch23_bottleneck_noise_value').textContent = noise.toFixed(2);
      const y = bottleneckSeries(anomaly, noise);
      const recon = fourierBottleneck(y, k);
      const residual = y.map((v,i) => v-recon[i]);
      const sq = residual.map(v => v*v);
      const anomalyIdx = range(y.length).filter(t => t>=66 && t<=72);
      const normalIdx = range(y.length).filter(t => !(t>=66 && t<=72));
      const rmseAnom = Math.sqrt(mean(anomalyIdx.map(i => sq[i])));
      const rmseNormal = Math.sqrt(mean(normalIdx.map(i => sq[i])));
      const out = $('ch23_bottleneck_output');
      if(out){
        out.innerHTML = `The bottleneck keeps <strong>${k}</strong> Fourier components. ` +
          `Normal-region RMSE: <strong>${rmseNormal.toFixed(3)}</strong>. ` +
          `Anomaly-region RMSE: <strong>${rmseAnom.toFixed(3)}</strong>. ` +
          `A larger anomaly creates larger reconstruction residuals when it is not well represented by the bottleneck.`;
      }
      const xs = range(y.length);
      newPlot('ch23_bottleneck_reconstruction_plot', [
        {x:xs, y:y, mode:'lines', name:'observed window'},
        {x:xs, y:recon, mode:'lines', name:'bottleneck reconstruction'},
        {x:anomalyIdx, y:anomalyIdx.map(i=>y[i]), mode:'markers', name:'anomaly interval', marker:{size:8}}
      ], {
        title:'Observed window and low-dimensional reconstruction',
        xaxis:{title:'time'},
        yaxis:{title:'value'},
        legend:{orientation:'h', y:-0.23},
        margin:{t:75,l:55,r:25,b:65},
        shapes:[{type:'rect', x0:66, x1:72, y0:Math.min(...y)-0.2, y1:Math.max(...y)+0.2, opacity:0.12, line:{width:0}}]
      });
      newPlot('ch23_bottleneck_error_plot', [
        {x:xs, y:sq, type:'bar', name:'squared reconstruction error'}
      ], {
        title:'Pointwise reconstruction error',
        xaxis:{title:'time'},
        yaxis:{title:'squared error'},
        margin:{t:75,l:55,r:25,b:55},
        shapes:[{type:'rect', x0:66, x1:72, y0:0, y1:Math.max(...sq)*1.05, opacity:0.12, line:{width:0}}]
      });
    }
    addInput(['ch23_embed_length','ch23_embed_noise','ch23_embed_seed'], drawEmbedding);
    addInput(['ch23_bottleneck_k','ch23_bottleneck_anomaly','ch23_bottleneck_noise'], drawBottleneck);
    drawEmbedding();
    drawBottleneck();
  }

  function init_ch24(){
    function eigen2x2(a,b,c,d){
      const tr = a+d;
      const det = a*d-b*c;
      const disc = tr*tr-4*det;
      if(disc >= 0){
        const s = Math.sqrt(disc);
        return [{re:(tr+s)/2, im:0}, {re:(tr-s)/2, im:0}];
      }
      const s = Math.sqrt(-disc);
      return [{re:tr/2, im:s/2}, {re:tr/2, im:-s/2}];
    }
    function matVec(A,x){ return [A[0][0]*x[0]+A[0][1]*x[1], A[1][0]*x[0]+A[1][1]*x[1]]; }
    function drawVAR(){
      if(!$('ch24_var_series_plot')) return;
      const a11=Number($('ch24_var_a11').value), a22=Number($('ch24_var_a22').value);
      const a12=Number($('ch24_var_a12').value), a21=Number($('ch24_var_a21').value);
      [['ch24_var_a11_value',a11],['ch24_var_a22_value',a22],['ch24_var_a12_value',a12],['ch24_var_a21_value',a21]].forEach(([id,val])=>{ if($(id)) $(id).textContent=val.toFixed(2); });
      const A=[[a11,a12],[a21,a22]];
      const eig=eigen2x2(a11,a12,a21,a22);
      const rho=Math.max(...eig.map(z=>Math.sqrt(z.re*z.re+z.im*z.im)));
      const stable = rho < 1;
      const n=140;
      const y1=[0.5], y2=[-0.4];
      for(let t=1;t<n;t++){
        const prev=[y1[t-1], y2[t-1]];
        const next=matVec(A,prev);
        const noiseScale = stable ? 0.35 : 0.10;
        y1.push(Math.max(-20, Math.min(20, next[0]+noiseScale*randn())));
        y2.push(Math.max(-20, Math.min(20, next[1]+noiseScale*randn())));
      }
      const eigText = eig.map(z => Math.abs(z.im)<1e-8 ? z.re.toFixed(3) : `${z.re.toFixed(3)}${z.im>=0?'+':'-'}${Math.abs(z.im).toFixed(3)}i`).join(', ');
      const out=$('ch24_var_output');
      if(out){
        out.innerHTML = `Eigenvalues: <strong>${eigText}</strong>. Spectral radius: <strong>${rho.toFixed(3)}</strong>. ` +
          `The VAR(1) is <strong>${stable ? 'stable' : 'not stable'}</strong> because stability requires all eigenvalues to have modulus less than 1.`;
      }
      newPlot('ch24_var_series_plot',[
        {x:range(n), y:y1, mode:'lines', name:'series 1'},
        {x:range(n), y:y2, mode:'lines', name:'series 2'}
      ], {title:'Simulated two-dimensional VAR(1)', xaxis:{title:'time'}, yaxis:{title:'value'}, legend:{orientation:'h', y:-0.2}, margin:{t:75,l:55,r:25,b:65}});
      const H=28; let v=[1,0]; const r1=[], r2=[];
      for(let h=0; h<H; h++){
        r1.push(v[0]); r2.push(v[1]);
        v = matVec(A,v);
        if(Math.max(Math.abs(v[0]),Math.abs(v[1]))>30){ v=[Math.max(-30,Math.min(30,v[0])), Math.max(-30,Math.min(30,v[1]))]; }
      }
      newPlot('ch24_var_irf_plot',[
        {x:range(H), y:r1, mode:'lines+markers', name:'response of series 1'},
        {x:range(H), y:r2, mode:'lines+markers', name:'response of series 2'}
      ], {title:'Impulse response to a one-unit shock in series 1', xaxis:{title:'horizon'}, yaxis:{title:'response'}, legend:{orientation:'h', y:-0.25}, margin:{t:75,l:55,r:25,b:70}});
    }
    function reconcileOLS(total,a,b,c){
      // For y=[Total,A,B,C], S=[[1,1,1],[1,0,0],[0,1,0],[0,0,1]].
      // P = S(S'S)^(-1)S'. The coherent bottom vector equals (S'S)^(-1)S'y.
      const sumBottom = a+b+c;
      const delta = (total - sumBottom)/4;
      // OLS projection spreads incoherence equally across the four equations:
      // total decreases by 3/4 gap, each bottom increases by 1/4 gap.
      const ar = a + delta;
      const br = b + delta;
      const cr = c + delta;
      return [ar+br+cr, ar, br, cr];
    }
    function drawReconciliation(){
      if(!$('ch24_reconciliation_plot')) return;
      const total=Number($('ch24_rec_total').value), a=Number($('ch24_rec_a').value), b=Number($('ch24_rec_b').value), c=Number($('ch24_rec_c').value);
      [['ch24_rec_total_value',total],['ch24_rec_a_value',a],['ch24_rec_b_value',b],['ch24_rec_c_value',c]].forEach(([id,val])=>{ if($(id)) $(id).textContent=String(val); });
      const base=[total,a,b,c];
      const rec=reconcileOLS(total,a,b,c);
      const gap=total-(a+b+c);
      const out=$('ch24_rec_output');
      if(out){
        out.innerHTML = `Base incoherence gap: <strong>${gap.toFixed(1)}</strong>. ` +
          `Base total is ${total.toFixed(1)}, while base bottom forecasts sum to ${(a+b+c).toFixed(1)}. ` +
          `After OLS reconciliation, total is <strong>${rec[0].toFixed(1)}</strong> and bottoms sum to <strong>${(rec[1]+rec[2]+rec[3]).toFixed(1)}</strong>.`;
      }
      const labels=['Total','A','B','C'];
      newPlot('ch24_reconciliation_plot',[
        {x:labels, y:base, type:'bar', name:'base forecast'},
        {x:labels, y:rec, type:'bar', name:'reconciled forecast'}
      ], {title:'Base forecasts versus coherent reconciled forecasts', xaxis:{title:'node'}, yaxis:{title:'forecast'}, barmode:'group', legend:{orientation:'h', y:-0.2}, margin:{t:75,l:55,r:25,b:65}});
    }
    addInput(['ch24_var_a11','ch24_var_a22','ch24_var_a12','ch24_var_a21'], drawVAR);
    addInput(['ch24_rec_total','ch24_rec_a','ch24_rec_b','ch24_rec_c'], drawReconciliation);
    drawVAR();
    drawReconciliation();
  }


  function init_ch25(){
    function checked(id){ const el=$(id); return !!(el && el.checked); }
    function drawAudit(){
      if(!$('ch25_audit_plot')) return;
      const items = [
        ['Random split', checked('ch25_audit_random_split'), 25, 'Use chronological or rolling-origin validation.'],
        ['Global preprocessing', checked('ch25_audit_scaler_leak'), 20, 'Fit scalers and imputers inside each training fold.'],
        ['Future covariates', checked('ch25_audit_future_cov'), 25, 'Keep only variables known at the forecast origin.'],
        ['No baseline', checked('ch25_audit_no_baseline'), 15, 'Compare with naive and seasonal-naive baselines.'],
        ['No diagnostics', checked('ch25_audit_no_resid'), 15, 'Check residual ACF, calibration, and horizon-wise error.'],
        ['Selection bias', checked('ch25_audit_many_models'), 10, 'Report tuning protocol and all serious model families tried.']
      ];
      const active = items.filter(d=>d[1]);
      const score = active.reduce((s,d)=>s+d[2],0);
      let level = 'low';
      if(score >= 65) level = 'very high';
      else if(score >= 40) level = 'high';
      else if(score >= 20) level = 'moderate';
      const out=$('ch25_audit_output');
      if(out){
        const bullets = active.length ? '<ul>' + active.map(d=>`<li><strong>${d[0]}:</strong> ${d[3]}</li>`).join('') + '</ul>' : '<p>No major issue selected. Still verify feature timing, residuals, and baselines.</p>';
        out.innerHTML = `Audit risk score: <strong>${score}</strong>. Risk level: <strong>${level}</strong>. ${bullets}`;
      }
      const labels = items.map(d=>d[0]);
      const vals = items.map(d=>d[1] ? d[2] : 0);
      newPlot('ch25_audit_plot', [
        {x:labels, y:vals, type:'bar', name:'risk points'},
        {x:['Total score'], y:[score], type:'bar', name:'total'}
      ], {
        title:'Workflow audit risk contributions',
        xaxis:{title:'issue'},
        yaxis:{title:'risk points', range:[0, Math.max(100, score+10)]},
        legend:{orientation:'h', y:-0.25},
        margin:{t:75,l:55,r:25,b:95}
      });
    }
    function drawPrompt(){
      if(!$('ch25_prompt_plot')) return;
      const task=$('ch25_prompt_task') ? $('ch25_prompt_task').value : 'forecasting';
      const frequency=$('ch25_prompt_frequency') ? $('ch25_prompt_frequency').value : 'daily';
      const validation=$('ch25_prompt_validation') ? $('ch25_prompt_validation').value : 'rolling-origin';
      const model=$('ch25_prompt_model') ? $('ch25_prompt_model').value : 'SARIMA';
      const diagnostics=$('ch25_prompt_diagnostics') ? $('ch25_prompt_diagnostics').value : 'yes';
      const baseline=$('ch25_prompt_baseline') ? $('ch25_prompt_baseline').value : 'yes';
      const prompt = `I am working on a ${task} problem for a ${frequency} time series. The candidate model is ${model}. The validation design is ${validation}. Baseline comparison included: ${baseline}. Residual or calibration diagnostics included: ${diagnostics}. Please act as a skeptical time-series reviewer. Identify possible leakage, invalid validation, missing baselines, nonstationarity, horizon mismatch, and unsupported conclusions. For each concern, give a concrete verification step using a plot, statistic, unit test, or backtest.`;
      const out=$('ch25_prompt_output');
      if(out) out.textContent = prompt;
      const scores = [
        ['Task', task ? 1 : 0],
        ['Frequency', frequency ? 1 : 0],
        ['Validation', validation === 'random split' ? 0.3 : 1],
        ['Model', model ? 1 : 0],
        ['Diagnostics', diagnostics === 'yes' ? 1 : (diagnostics === 'partial' ? 0.6 : 0.1)],
        ['Baselines', baseline === 'yes' ? 1 : 0.1],
        ['Verification request', 1]
      ];
      const avg = scores.reduce((s,d)=>s+d[1],0)/scores.length;
      let summary = 'strong';
      if(avg < 0.5) summary = 'weak';
      else if(avg < 0.8) summary = 'moderate';
      newPlot('ch25_prompt_plot', [
        {x:scores.map(d=>d[0]), y:scores.map(d=>d[1]), type:'bar', name:'prompt coverage'}
      ], {
        title:`Prompt coverage score: ${(100*avg).toFixed(0)}% (${summary})`,
        xaxis:{title:'prompt component'},
        yaxis:{title:'coverage', range:[0,1.05]},
        margin:{t:75,l:55,r:25,b:95}
      });
    }
    addInput(['ch25_audit_random_split','ch25_audit_scaler_leak','ch25_audit_future_cov','ch25_audit_no_baseline','ch25_audit_no_resid','ch25_audit_many_models'], drawAudit);
    addInput(['ch25_prompt_task','ch25_prompt_frequency','ch25_prompt_validation','ch25_prompt_model','ch25_prompt_diagnostics','ch25_prompt_baseline'], drawPrompt);
    drawAudit();
    drawPrompt();
  }



  function init_ch26(){
    function deterministicNoise(t){
      return 0.65*Math.sin(12.9898*t + 0.25) + 0.35*Math.sin(78.233*t + 1.17);
    }
    function pipelineSeries(n, trend, seasonAmp, noise){
      return range(n).map(t => 50 + trend*t + seasonAmp*Math.sin(2*Math.PI*t/7) + 1.5*Math.sin(2*Math.PI*t/45) + noise*deterministicNoise(t));
    }
    function solveLinear(A,b){
      const n=b.length;
      const M=A.map((row,i)=>row.slice().concat([b[i]]));
      for(let k=0;k<n;k++){
        let maxRow=k;
        for(let i=k+1;i<n;i++) if(Math.abs(M[i][k])>Math.abs(M[maxRow][k])) maxRow=i;
        const tmp=M[k]; M[k]=M[maxRow]; M[maxRow]=tmp;
        const pivot=Math.abs(M[k][k])<1e-10 ? (M[k][k]>=0 ? 1e-10 : -1e-10) : M[k][k];
        for(let j=k;j<=n;j++) M[k][j]/=pivot;
        for(let i=0;i<n;i++){
          if(i===k) continue;
          const factor=M[i][k];
          for(let j=k;j<=n;j++) M[i][j]-=factor*M[k][j];
        }
      }
      return M.map(row=>row[n]);
    }
    function dot(a,b){ let s=0; for(let i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }
    function fitRidge(X,y,lambda){
      const p=X[0].length;
      const A=Array.from({length:p},()=>Array(p).fill(0));
      const b=Array(p).fill(0);
      for(let i=0;i<X.length;i++){
        for(let j=0;j<p;j++){
          b[j]+=X[i][j]*y[i];
          for(let k=0;k<p;k++) A[j][k]+=X[i][j]*X[i][k];
        }
      }
      for(let j=1;j<p;j++) A[j][j]+=lambda; // do not penalize intercept
      return solveLinear(A,b);
    }
    function featureVector(y,t,model,leaky,deploySafe){
      if(model==='laglinear'){
        const base=[1, y[t-1], y[t-7]];
        if(leaky) base.push(deploySafe ? y[t-1] : y[Math.min(y.length-1,t+1)]);
        return base;
      }
      const base=[1, y[t-1], y[t-7], t/y.length, Math.sin(2*Math.PI*t/7), Math.cos(2*Math.PI*t/7)];
      if(leaky) base.push(deploySafe ? y[t-1] : y[Math.min(y.length-1,t+1)]);
      return base;
    }
    function metrics(actual,pred){
      const e=actual.map((v,i)=>v-pred[i]);
      const mae=mean(e.map(Math.abs));
      const rmse=Math.sqrt(mean(e.map(v=>v*v)));
      return {mae,rmse};
    }
    function drawPipeline(){
      if(!$('ch26_pipeline_plot')) return;
      const trend=Number($('ch26_pipe_trend').value), season=Number($('ch26_pipe_season').value), noise=Number($('ch26_pipe_noise').value), trainFrac=Number($('ch26_pipe_train').value);
      const model=$('ch26_pipe_model').value;
      const leakage=!!$('ch26_pipe_leakage').checked;
      [['ch26_pipe_trend_value',trend],['ch26_pipe_season_value',season],['ch26_pipe_noise_value',noise],['ch26_pipe_train_value',trainFrac]].forEach(([id,val])=>{ if($(id)) $(id).textContent=Number(val).toFixed(id==='ch26_pipe_train_value'?2:2); });
      const n=210, y=pipelineSeries(n,trend,season,noise), xs=range(n);
      const trainEnd=Math.floor(n*trainFrac);
      const start=10;
      const testIdx=range(n-trainEnd).map(i=>trainEnd+i);
      let validPred=[], deployPred=[];
      if(model==='seasonal'){
        validPred=testIdx.map(t=>y[t-7]);
        deployPred=validPred.slice();
      } else {
        const X=[], target=[];
        for(let t=start;t<trainEnd;t++){
          X.push(featureVector(y,t,model,leakage,false));
          target.push(y[t]);
        }
        const beta=fitRidge(X,target,model==='calendar'?4.0:0.05);
        validPred=testIdx.map(t=>dot(beta, featureVector(y,t,model,leakage,false)));
        deployPred=testIdx.map(t=>dot(beta, featureVector(y,t,model,leakage,true)));
      }
      const actual=testIdx.map(t=>y[t]);
      const mv=metrics(actual,validPred), md=metrics(actual,deployPred);
      const out=$('ch26_pipe_output');
      if(out){
        const leakText = leakage ? 'The validation line uses an invalid future target feature. The deployment-safe line replaces that unavailable future value with information available at the forecast origin.' : 'No invalid future feature is used, so validation and deployment-safe forecasts coincide.';
        out.innerHTML = `Validation MAE: <strong>${mv.mae.toFixed(2)}</strong>; deployment-safe MAE: <strong>${md.mae.toFixed(2)}</strong>. ${leakText}`;
      }
      const shapes=[{type:'rect', x0:0, x1:trainEnd, y0:Math.min(...y)-5, y1:Math.max(...y)+5, opacity:0.08, line:{width:0}}, {type:'line', x0:trainEnd, x1:trainEnd, y0:Math.min(...y)-5, y1:Math.max(...y)+5, line:{dash:'dash', width:2}}];
      newPlot('ch26_pipeline_plot',[
        {x:xs, y:y, mode:'lines', name:'observed series'},
        {x:testIdx, y:validPred, mode:'lines', name: leakage ? 'leaky validation forecast' : 'validation forecast'},
        {x:testIdx, y:deployPred, mode:'lines', name:'deployment-safe forecast'}
      ], {title:'Pipeline forecast: validation versus deployment-safe behavior', xaxis:{title:'time'}, yaxis:{title:'value'}, legend:{orientation:'h', y:-0.2}, margin:{t:75,l:55,r:25,b:70}, shapes:shapes, annotations:[{x:trainEnd/2,y:Math.max(...y)+4,text:'training region',showarrow:false},{x:trainEnd+5,y:Math.max(...y)+4,text:'test / deployment region',showarrow:false,xanchor:'left'}]});
      newPlot('ch26_pipeline_metric_plot',[
        {x:['validation MAE','deployment-safe MAE','validation RMSE','deployment-safe RMSE'], y:[mv.mae,md.mae,mv.rmse,md.rmse], type:'bar', name:'error'}
      ], {title:'Error summary', xaxis:{title:'metric'}, yaxis:{title:'error'}, margin:{t:75,l:55,r:25,b:85}});
    }
    function drawMonitor(){
      if(!$('ch26_monitor_plot')) return;
      const driftTime=Number($('ch26_mon_drift_time').value), driftSize=Number($('ch26_mon_drift_size').value), w=Number($('ch26_mon_window').value), c=Number($('ch26_mon_threshold').value);
      [['ch26_mon_drift_time_value',driftTime],['ch26_mon_drift_size_value',driftSize],['ch26_mon_window_value',w],['ch26_mon_threshold_value',c]].forEach(([id,val])=>{ if($(id)) $(id).textContent=Number(val).toFixed(id==='ch26_mon_threshold_value'||id==='ch26_mon_drift_size_value'?1:0); });
      const n=230;
      const base=pipelineSeries(n,0.025,3.0,1.2);
      const y=base.map((v,t)=>v+(t>=driftTime?driftSize:0));
      const pred=range(n).map(t=> t<7 ? y[0] : base[t-7] + 0.025*7); // old seasonal model trained before drift
      const errors=y.map((v,t)=>t<7?0:v-pred[t]);
      const absErr=errors.map(Math.abs);
      const valErr=absErr.slice(20,80);
      const valMean=mean(valErr), valSd=Math.sqrt(variance(valErr));
      const threshold=valMean+c*valSd;
      const roll=range(n).map(t=>{
        const a=Math.max(7,t-w+1); const arr=absErr.slice(a,t+1); return arr.length?mean(arr):0;
      });
      const firstAlert=roll.findIndex((v,t)=>t>80 && v>threshold);
      const out=$('ch26_mon_output');
      if(out){
        out.innerHTML = `Validation mean absolute error: <strong>${valMean.toFixed(2)}</strong>. Alert threshold: <strong>${threshold.toFixed(2)}</strong>. ` +
          (firstAlert>=0 ? `First alert occurs at time <strong>${firstAlert}</strong>.` : `No alert is triggered under the current settings.`);
      }
      newPlot('ch26_monitor_plot',[
        {x:range(n), y:y, mode:'lines', name:'actual deployed series'},
        {x:range(n), y:pred, mode:'lines', name:'old forecast model'}
      ], {title:'Deployment series and old forecast model', xaxis:{title:'time'}, yaxis:{title:'value'}, legend:{orientation:'h', y:-0.2}, margin:{t:75,l:55,r:25,b:70}, shapes:[{type:'line',x0:driftTime,x1:driftTime,y0:Math.min(...y)-4,y1:Math.max(...y)+4,line:{dash:'dash',width:2}}], annotations:[{x:driftTime,y:Math.max(...y)+3,text:'drift begins',showarrow:false,xanchor:'left'}]});
      newPlot('ch26_monitor_error_plot',[
        {x:range(n), y:absErr, mode:'lines', name:'absolute error'},
        {x:range(n), y:roll, mode:'lines', name:`rolling MAE, w=${w}`},
        {x:range(n), y:range(n).map(()=>threshold), mode:'lines', name:'alert threshold'}
      ], {title:'Monitoring statistic for forecast degradation', xaxis:{title:'time'}, yaxis:{title:'absolute error'}, legend:{orientation:'h', y:-0.22}, margin:{t:75,l:55,r:25,b:70}});
    }
    addInput(['ch26_pipe_trend','ch26_pipe_season','ch26_pipe_noise','ch26_pipe_train','ch26_pipe_model','ch26_pipe_leakage'], drawPipeline);
    addInput(['ch26_mon_drift_time','ch26_mon_drift_size','ch26_mon_window','ch26_mon_threshold'], drawMonitor);
    drawPipeline();
    drawMonitor();
  }


  function init_ch27(){
    function val(id){ const el=$(id); return el ? Number(el.value) : 0; }
    function sval(id){ const el=$(id); return el ? el.value : ''; }
    function updateSpan(id, value, digits){ const el=$(id); if(el) el.textContent = Number(value).toFixed(digits); }

    function drawDesign(){
      if(!$('ch27_design_plot')) return;
      const n=val('ch27_design_length');
      const m=val('ch27_design_series');
      const miss=val('ch27_design_missing');
      const H=val('ch27_design_horizon');
      const model=sval('ch27_design_model');
      const unc=sval('ch27_design_uncertainty');
      updateSpan('ch27_design_length_value', n, 0);
      updateSpan('ch27_design_series_value', m, 0);
      updateSpan('ch27_design_missing_value', miss, 2);
      updateSpan('ch27_design_horizon_value', H, 0);

      const dataAdequacy = Math.max(0, Math.min(100, 20 + 18*Math.log10(Math.max(10,n)) + 0.35*Math.min(m,60) - 70*miss - 0.35*H));
      const complexity = Math.max(0, Math.min(100,
        (model==='baseline'?25:model==='ml'?55:model==='deep'?82:75) + 0.4*Math.min(m,80) + 0.45*H + 45*miss + (unc==='no'?0:unc==='interval'?10:18)
      ));
      const validationBurden = Math.max(0, Math.min(100, 20 + 0.5*H + 0.25*Math.min(m,100) + (unc==='no'?0:20) + (model==='deep'?20:0)));
      const interpretability = Math.max(0, Math.min(100, model==='baseline'?90:model==='ml'?65:model==='deep'?35:50));
      const feasibility = Math.max(0, Math.min(100, dataAdequacy - 0.45*complexity - 0.25*validationBurden + 45));
      let recommendation = 'good scope';
      if(feasibility < 35) recommendation = 'too ambitious: narrow the scope or simplify the model';
      else if(feasibility < 60) recommendation = 'moderate risk: strengthen baselines and validation';
      const out=$('ch27_design_output');
      if(out){
        out.innerHTML = `Estimated feasibility: <strong>${feasibility.toFixed(0)}%</strong>. Recommendation: <strong>${recommendation}</strong>. ` +
          `Data adequacy ${dataAdequacy.toFixed(0)}%, complexity ${complexity.toFixed(0)}%, validation burden ${validationBurden.toFixed(0)}%.`;
      }
      newPlot('ch27_design_plot', [
        {type:'bar', x:['data adequacy','model complexity','validation burden','interpretability','feasibility'], y:[dataAdequacy, complexity, validationBurden, interpretability, feasibility], name:'score'},
        {type:'scatter', x:['data adequacy','model complexity','validation burden','interpretability','feasibility'], y:[60,60,60,60,60], mode:'lines', name:'reference level', line:{dash:'dash'}}
      ], {
        title:'Project design profile',
        xaxis:{title:'dimension'},
        yaxis:{title:'score', range:[0,105]},
        legend:{orientation:'h', y:-0.2},
        margin:{t:75,l:55,r:25,b:95}
      });
    }

    function drawRolling(){
      if(!$('ch27_roll_plot')) return;
      const n=val('ch27_roll_n');
      const train0=Math.min(val('ch27_roll_train'), n-5);
      const H=Math.min(val('ch27_roll_horizon'), n-train0-1);
      const step=val('ch27_roll_step');
      const type=sval('ch27_roll_window');
      const winLen=val('ch27_roll_window_length');
      updateSpan('ch27_roll_n_value', n, 0);
      updateSpan('ch27_roll_train_value', train0, 0);
      updateSpan('ch27_roll_horizon_value', H, 0);
      updateSpan('ch27_roll_step_value', step, 0);
      updateSpan('ch27_roll_window_length_value', winLen, 0);
      const origins=[];
      for(let o=train0; o+H<n; o+=step) origins.push(o);
      const maxRows=Math.min(origins.length, 16);
      const traces=[];
      for(let i=0;i<maxRows;i++){
        const o=origins[i];
        const start = type==='sliding' ? Math.max(0, o-winLen) : 0;
        traces.push({x:[start,o], y:[i,i], mode:'lines', line:{width:8}, name:i===0?'training window':'training', showlegend:i===0});
        traces.push({x:[o+1,o+H], y:[i,i], mode:'lines', line:{width:8}, name:i===0?'forecast horizons':'forecast', showlegend:i===0});
        traces.push({x:[o], y:[i], mode:'markers', marker:{size:8}, name:i===0?'origin':'origin', showlegend:i===0});
      }
      const totalForecasts = origins.length * H;
      const out=$('ch27_roll_output');
      if(out){
        out.innerHTML = `Number of forecast origins: <strong>${origins.length}</strong>. Total forecasts evaluated: <strong>${totalForecasts}</strong>. ` +
          `The plot shows the first ${maxRows} origins.`;
      }
      newPlot('ch27_roll_plot', traces, {
        title:`Rolling-origin plan: ${type} window`,
        xaxis:{title:'time index', range:[0,n]},
        yaxis:{title:'forecast origin number', autorange:'reversed'},
        legend:{orientation:'h', y:-0.18},
        margin:{t:75,l:65,r:25,b:70}
      });
    }

    function drawRubric(){
      if(!$('ch27_rubric_plot')) return;
      const items=[
        ['Problem contract','ch27_rubric_contract',12],
        ['Mathematical theory','ch27_rubric_theory',14],
        ['Validation design','ch27_rubric_validation',18],
        ['Baselines','ch27_rubric_baselines',12],
        ['Diagnostics / uncertainty','ch27_rubric_diagnostics',16],
        ['Reproducibility','ch27_rubric_repro',12],
        ['Interactive explanation','ch27_rubric_interactive',8],
        ['Communication','ch27_rubric_comm',8]
      ];
      const labels=[], raw=[], weighted=[];
      items.forEach(([name,id,w])=>{
        const v=val(id);
        updateSpan(id+'_value', v, 0);
        labels.push(name); raw.push(v); weighted.push(w*v/5);
      });
      const total=weighted.reduce((a,b)=>a+b,0);
      let level='excellent trajectory';
      if(total<55) level='needs substantial revision';
      else if(total<75) level='solid but incomplete';
      else if(total<88) level='strong project draft';
      const weak=items.map((it,i)=>[it[0], raw[i]]).filter(d=>d[1]<=2).map(d=>d[0]);
      const out=$('ch27_rubric_output');
      if(out){
        out.innerHTML = `Estimated score: <strong>${total.toFixed(1)}/100</strong>. Status: <strong>${level}</strong>. ` +
          (weak.length ? `Priority improvement areas: ${weak.join(', ')}.` : 'No category is currently below 3/5.');
      }
      newPlot('ch27_rubric_plot', [
        {x:labels, y:weighted, type:'bar', name:'weighted points'},
        {x:labels, y:raw.map(v=>20*v/5), type:'scatter', mode:'lines+markers', name:'raw rating scaled to 20'}
      ], {
        title:'Final project self-check rubric',
        xaxis:{title:'category'},
        yaxis:{title:'points / scaled rating', range:[0,20]},
        legend:{orientation:'h', y:-0.23},
        margin:{t:75,l:55,r:25,b:115}
      });
    }

    addInput(['ch27_design_length','ch27_design_series','ch27_design_missing','ch27_design_horizon','ch27_design_model','ch27_design_uncertainty'], drawDesign);
    addInput(['ch27_roll_n','ch27_roll_train','ch27_roll_horizon','ch27_roll_step','ch27_roll_window','ch27_roll_window_length'], drawRolling);
    addInput(['ch27_rubric_contract','ch27_rubric_theory','ch27_rubric_validation','ch27_rubric_baselines','ch27_rubric_diagnostics','ch27_rubric_repro','ch27_rubric_interactive','ch27_rubric_comm'], drawRubric);
    drawDesign(); drawRolling(); drawRubric();
  }


  function init_generic(){
    document.querySelectorAll('[data-generic-plot]').forEach((el,idx)=>{
      const n=120, y=seasonal(n,0.005,1.2,24,0.4);
      newPlot(el.id,[{x:range(n),y:y,mode:'lines',name:'example'}],{title:el.getAttribute('data-title') || 'Interactive placeholder'});
    });
  }
  window.addEventListener('DOMContentLoaded', function(){
    init_ch01(); init_ch02(); init_ch03(); init_ch04(); init_ch05(); init_ch06(); init_ch08(); init_ch12(); init_ch13(); init_ch16(); init_ch19(); init_ch20(); init_ch21(); init_ch22(); init_ch23(); init_ch24(); init_ch25(); init_ch26(); init_ch27(); init_generic();
  });
})();
