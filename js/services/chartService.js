/** @module ChartService — Chart.js instance management */
const ChartService = (() => {
  const _inst = {};
  const FONT  = "'Plus Jakarta Sans', sans-serif";
  const GRID  = 'rgba(232,230,225,0.8)';
  const TICK  = '#9b9890';

  function _kill(id) { if (_inst[id]) { _inst[id].destroy(); delete _inst[id]; } }

  function _tooltip() {
    return {
      backgroundColor: '#ffffff',
      borderColor: '#e8e6e1',
      borderWidth: 1,
      titleColor: '#1a1917',
      bodyColor: '#5c5a55',
      padding: 12,
      cornerRadius: 10,
      titleFont: { family:FONT, weight:'700', size:12 },
      bodyFont:  { family:FONT, size:11 },
      boxPadding: 4,
      callbacks: {
        label: ctx => `  ${ctx.dataset.label}: ${Formatters.currency(ctx.parsed.y??ctx.parsed)}`,
      },
    };
  }

  function renderLineChart(id, data) {
    _kill(id);
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const mkGrad = (r,g,b) => {
      const g2 = ctx.createLinearGradient(0,0,0,260);
      g2.addColorStop(0, `rgba(${r},${g},${b},.15)`);
      g2.addColorStop(1, `rgba(${r},${g},${b},0)`);
      return g2;
    };

    _inst[id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          { label:'Entradas', data:data.entradas, borderColor:'#1a7a4a', backgroundColor:mkGrad(26,122,74),  borderWidth:2, pointRadius:3, pointHoverRadius:5, pointBackgroundColor:'#1a7a4a', pointBorderColor:'#fff', pointBorderWidth:2, fill:true, tension:.4 },
          { label:'Saídas',   data:data.saidas,   borderColor:'#b54d3a', backgroundColor:mkGrad(181,77,58), borderWidth:2, pointRadius:3, pointHoverRadius:5, pointBackgroundColor:'#b54d3a', pointBorderColor:'#fff', pointBorderWidth:2, fill:true, tension:.4 },
          { label:'Lucro',    data:data.lucros,   borderColor:'#1e5fa8', backgroundColor:'transparent',      borderWidth:1.5, borderDash:[5,4], pointRadius:2, pointHoverRadius:4, pointBackgroundColor:'#1e5fa8', pointBorderColor:'#fff', pointBorderWidth:2, fill:false, tension:.4 },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        animation:{ duration:500, easing:'easeInOutQuart' },
        interaction:{ mode:'index', intersect:false },
        plugins: {
          legend:{ position:'top', align:'end', labels:{ color:TICK, font:{family:FONT,size:11}, boxWidth:8, boxHeight:8, usePointStyle:true, pointStyleWidth:8 } },
          tooltip: _tooltip(),
        },
        scales: {
          x:{ grid:{ color:GRID, drawBorder:false }, ticks:{ color:TICK, font:{family:FONT,size:11} }, border:{display:false} },
          y:{ grid:{ color:GRID, drawBorder:false }, ticks:{ color:TICK, font:{family:FONT,size:11}, callback:v=>Formatters.currency(v) }, border:{display:false} },
        },
      },
    });
  }

  function renderDonutChart(id, data) {
    _kill(id);
    const canvas = document.getElementById(id);
    if (!canvas) return;

    const empty = !data.values || data.values.every(v=>v===0);
    _inst[id] = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: empty ? ['Sem dados'] : data.labels,
        datasets: [{ data: empty ? [1] : data.values, backgroundColor: empty ? ['#e8e6e1'] : data.colors, borderColor:'#ffffff', borderWidth:3, hoverOffset:6 }],
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'72%',
        animation:{ animateRotate:true, duration:500 },
        plugins: {
          legend:{ display:false },
          tooltip: empty ? { enabled:false } : {
            ..._tooltip(),
            callbacks: {
              label: ctx => { const t=ctx.dataset.data.reduce((a,b)=>a+b,0); const p=t>0?Math.round(ctx.parsed/t*100):0; return `  ${Formatters.currency(ctx.parsed)} (${p}%)`; },
            },
          },
        },
      },
    });
  }

  function updateLineChart(id, data) {
    if (!_inst[id]) { renderLineChart(id, data); return; }
    const c = _inst[id];
    c.data.labels = data.labels;
    c.data.datasets[0].data = data.entradas;
    c.data.datasets[1].data = data.saidas;
    c.data.datasets[2].data = data.lucros;
    c.update('active');
  }

  return { renderLineChart, renderDonutChart, updateLineChart };
})();
