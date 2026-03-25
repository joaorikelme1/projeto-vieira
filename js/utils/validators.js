/** @module Validators — form data validation */
const Validators = (() => {

  function entrada(data) {
    const errors = [];
    if (!data.data) errors.push('A data é obrigatória.');
    else if (isNaN(new Date(data.data + 'T00:00:00').getTime())) errors.push('Data inválida.');
    if (!['venda','pix','cartao','dinheiro'].includes(data.tipo)) errors.push('Tipo de entrada inválido.');
    if (!data.descricao || data.descricao.trim().length < 2) errors.push('Descrição deve ter ao menos 2 caracteres.');
    const v = parseFloat(data.valor);
    if (isNaN(v) || v <= 0) errors.push('O valor deve ser maior que zero.');
    return { valid: errors.length === 0, errors };
  }

  function saida(data) {
    const errors = [];
    if (!data.data) errors.push('A data é obrigatória.');
    else if (isNaN(new Date(data.data + 'T00:00:00').getTime())) errors.push('Data inválida.');
    if (!['fornecedor','conta_fixa','operacional'].includes(data.categoria)) errors.push('Categoria inválida.');
    if (!data.descricao || data.descricao.trim().length < 2) errors.push('Descrição deve ter ao menos 2 caracteres.');
    const v = parseFloat(data.valor);
    if (isNaN(v) || v <= 0) errors.push('O valor deve ser maior que zero.');
    return { valid: errors.length === 0, errors };
  }

  return { entrada, saida };
})();
