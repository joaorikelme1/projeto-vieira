/** @module RelatoriosView — renders reports section */
const RelatoriosView = (() => {

  function init() {
    _bindTabs();
    render('diario');
  }

  function render(type) {
    const el = document.getElementById('reportContent');
    if (!el) return;
    switch (type) {
      case 'diario':      _diario(el);      break;
      case 'mensal':      _mensal(el);      break;
      case 'consolidado': _consolidado(el); break;
    }
  }

  // ── Diário ─────────────────────────────────────────────
  function _diario(el) {
    const today = Helpers.todayISO();
    el.innerHTML = `
      <div class="filter-bar" style="margin-bottom:var(--s5)">
        <span class="filter-label">Data:</span>
        <input type="date" id="rpDiarioDate" class="filter-select" value="${today}" style="width:160px"/>
      </div>
      <div id="rpDiarioBody"></div>`;
    Helpers.on('rpDiarioDate', 'change', () => {
      const d = document.getElementById('rpDiarioDate')?.value;
      if (d) _diarioBody(d);
    });
    _diarioBody(today);
  }

  function _diarioBody(dateStr) {
    const body = document.getElementById('rpDiarioBody');
    if (!body) return;
    const { entradas, saidas, totalEntradas, totalSaidas, lucro } = RelatoriosController.getDiario(dateStr);
    const cls = lucro >= 0 ? 'pos' : 'neg';
    body.innerHTML = `
      ${_strip(totalEntradas, totalSaidas, lucro)}
      <div class="grid-2" style="gap:var(--s5)">
        <div class="card">
          <div class="card-hd">
            <div class="card-title">Entradas</div>
            <span class="badge badge-income">${entradas.length}</span>
          </div>
          ${_tblEntradas(entradas)}
        </div>
        <div class="card">
          <div class="card-hd">
            <div class="card-title">Saídas</div>
            <span class="badge badge-expense">${saidas.length}</span>
          </div>
          ${_tblSaidas(saidas)}
        </div>
      </div>
      <div class="profit-banner profit-banner--${cls}" style="margin-top:var(--s5)">
        <span class="profit-label">Resultado — ${Formatters.date(dateStr)}</span>
        <span class="profit-value">${Formatters.currency(lucro)}</span>
      </div>`;
  }

  // ── Mensal ─────────────────────────────────────────────
  function _mensal(el) {
    const ym = Helpers.currentYearMonth();
    el.innerHTML = `
      <div class="filter-bar" style="margin-bottom:var(--s5)">
        <span class="filter-label">Mês:</span>
        <select id="rpMensalMes" class="filter-select"></select>
      </div>
      <div id="rpMensalBody"></div>`;
    Helpers.populateMonthSelect(document.getElementById('rpMensalMes'), 24);
    Helpers.on('rpMensalMes', 'change', () => {
      const v = document.getElementById('rpMensalMes')?.value;
      if (v) _mensalBody(v);
    });
    _mensalBody(ym);
  }

  function _mensalBody(ym) {
    const body = document.getElementById('rpMensalBody');
    if (!body) return;
    const { entradas, saidas, totalEntradas, totalSaidas, lucro, margem, porTipo, porCategoria } = RelatoriosController.getMensal(ym);
    const [y, m] = ym.split('-');
    const mesLabel = `${Formatters.monthName(parseInt(m))} ${y}`;
    const cls = lucro >= 0 ? 'pos' : 'neg';

    body.innerHTML = `
      ${_strip(totalEntradas, totalSaidas, lucro)}
      <div class="grid-2" style="gap:var(--s5);margin-bottom:var(--s5)">
        <div class="card">
          <div class="card-hd"><div class="card-title">Entradas por Tipo</div></div>
          ${_breakdown(porTipo, Formatters.entradaTipoLabel, totalEntradas, 'income')}
        </div>
        <div class="card">
          <div class="card-hd"><div class="card-title">Saídas por Categoria</div></div>
          ${_breakdown(porCategoria, Formatters.saidaCategoriaLabel, totalSaidas, 'expense')}
        </div>
      </div>
      <div class="grid-2" style="gap:var(--s5)">
        <div class="card">
          <div class="card-hd">
            <div class="card-title">Entradas — ${mesLabel}</div>
            <span class="badge badge-income">${entradas.length}</span>
          </div>
          ${_tblEntradas(entradas)}
        </div>
        <div class="card">
          <div class="card-hd">
            <div class="card-title">Saídas — ${mesLabel}</div>
            <span class="badge badge-expense">${saidas.length}</span>
          </div>
          ${_tblSaidas(saidas)}
        </div>
      </div>
      <div class="profit-banner profit-banner--${cls}" style="margin-top:var(--s5)">
        <div>
          <div class="profit-label">Lucro — ${mesLabel}</div>
          <div style="font-size:.75rem;color:var(--text-3);margin-top:2px">Margem: ${margem.toFixed(1)}%</div>
        </div>
        <span class="profit-value">${Formatters.currency(lucro)}</span>
      </div>`;
  }

  // ── Consolidado ────────────────────────────────────────
  function _consolidado(el) {
    const { totalEntradas, totalSaidas, lucro, porMes, qtdEntradas, qtdSaidas } = RelatoriosController.getConsolidado();
    const cls = lucro >= 0 ? 'pos' : 'neg';
    el.innerHTML = `
      ${_strip(totalEntradas, totalSaidas, lucro)}
      <div class="card">
        <div class="card-hd">
          <div class="card-title">Resumo por Mês</div>
          <span class="badge badge-neutral">${porMes.length} meses</span>
        </div>
        <div class="tbl-wrap">
          <table class="data-tbl">
            <thead><tr><th>Período</th><th>Entradas</th><th>Saídas</th><th>Lucro</th><th>Margem</th></tr></thead>
            <tbody>
              ${porMes.length === 0
                ? `<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:var(--s10)">Nenhum dado disponível</td></tr>`
                : porMes.map(r => {
                    const [y,m] = r.yearMonth.split('-');
                    const mg    = r.entradas > 0 ? (r.lucro/r.entradas*100) : 0;
                    const lPos  = r.lucro >= 0;
                    return `<tr>
                      <td style="font-weight:600;color:var(--text-1)">${Formatters.monthName(parseInt(m))} ${y}</td>
                      <td class="td-mono td-income">${Formatters.currency(r.entradas)}</td>
                      <td class="td-mono td-expense">${Formatters.currency(r.saidas)}</td>
                      <td class="td-mono ${lPos ? 'td-income' : 'td-expense'}">${Formatters.currency(r.lucro)}</td>
                      <td><span class="badge ${lPos ? 'badge-income' : 'badge-expense'}">${mg.toFixed(1)}%</span></td>
                    </tr>`;
                  }).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
      <div class="profit-banner profit-banner--${cls}" style="margin-top:var(--s5)">
        <div>
          <div class="profit-label">Lucro total acumulado</div>
          <div style="font-size:.75rem;color:var(--text-3);margin-top:2px">${qtdEntradas} entradas · ${qtdSaidas} saídas</div>
        </div>
        <span class="profit-value">${Formatters.currency(lucro)}</span>
      </div>`;
  }

  // ── Shared helpers ─────────────────────────────────────
  function _strip(te, ts, lucro) {
    const lPos = lucro >= 0;
    return `
      <div class="report-strip">
        <div class="report-strip-card"><div class="rsc-label">Entradas</div><div class="rsc-value c-income">${Formatters.currency(te)}</div></div>
        <div class="report-strip-card"><div class="rsc-label">Saídas</div><div class="rsc-value c-expense">${Formatters.currency(ts)}</div></div>
        <div class="report-strip-card"><div class="rsc-label">Lucro</div><div class="rsc-value ${lPos ? 'c-income' : 'c-expense'}">${Formatters.currency(lucro)}</div></div>
      </div>`;
  }

  function _breakdown(por, labelFn, total, colorClass) {
    const entries = Object.entries(por);
    if (!entries.length) return `<p style="text-align:center;color:var(--text-3);font-size:.875rem;padding:var(--s6) 0">Sem registros</p>`;
    return entries.sort(([,a],[,b]) => b-a).map(([k,v]) => {
      const pct = total > 0 ? (v/total*100) : 0;
      return `
        <div class="cmp-row cmp-row--${colorClass === 'income' ? 'in' : 'out'}" style="margin-bottom:var(--s3)">
          <div class="cmp-row-hd">
            <span class="cmp-row-label">${labelFn(k)}</span>
            <span class="cmp-row-val">${Formatters.currency(v)}</span>
          </div>
          <div class="prog-bar prog-${colorClass}"><div class="prog-fill" style="width:${pct.toFixed(1)}%"></div></div>
        </div>`;
    }).join('');
  }

  function _tblEntradas(list) {
    if (!list.length) return `<p style="text-align:center;color:var(--text-3);font-size:.875rem;padding:var(--s6) 0">Sem entradas</p>`;
    return `<div class="tbl-wrap"><table class="data-tbl">
      <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead>
      <tbody>${list.map(e => `<tr>
        <td class="td-date">${Formatters.date(e.data)}</td>
        <td style="color:var(--text-1)">${Helpers.esc(e.descricao)}</td>
        <td><span class="badge badge-income">${Formatters.entradaTipoLabel(e.tipo)}</span></td>
        <td class="td-mono td-income">${Formatters.currency(e.valor)}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

  function _tblSaidas(list) {
    if (!list.length) return `<p style="text-align:center;color:var(--text-3);font-size:.875rem;padding:var(--s6) 0">Sem saídas</p>`;
    return `<div class="tbl-wrap"><table class="data-tbl">
      <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
      <tbody>${list.map(s => `<tr>
        <td class="td-date">${Formatters.date(s.data)}</td>
        <td style="color:var(--text-1)">${Helpers.esc(s.descricao)}</td>
        <td><span class="badge badge-expense">${Formatters.saidaCategoriaLabel(s.categoria)}</span></td>
        <td class="td-mono td-expense">${Formatters.currency(s.valor)}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

  function _bindTabs() {
    const tabs = document.getElementById('reportTabs');
    if (!tabs) return;
    tabs.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      tabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.report);
    });
  }

  return { init, render };
})();
