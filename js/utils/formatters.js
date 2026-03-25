/** @module Formatters — display formatting utilities */
const Formatters = (() => {

  function currency(value) {
    return (parseFloat(value) || 0).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  function date(str) {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    return (y && m && d) ? `${d}/${m}/${y}` : str;
  }

  function toInputDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function monthYear(year, month) {
    const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${names[month - 1]}/${year}`;
  }

  function monthName(month) {
    const names = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return names[month - 1] || '';
  }

  function yearMonth(str) {
    return (str || '').substring(0, 7);
  }

  function entradaTipoLabel(tipo) {
    return { venda: 'Venda do Dia', pix: 'PIX', cartao: 'Cartão', dinheiro: 'Dinheiro' }[tipo] || tipo;
  }

  function saidaCategoriaLabel(cat) {
    return { fornecedor: 'Fornecedor', conta_fixa: 'Conta Fixa', operacional: 'Operacional' }[cat] || cat;
  }

  return { currency, date, toInputDate, monthYear, monthName, yearMonth, entradaTipoLabel, saidaCategoriaLabel };
})();
