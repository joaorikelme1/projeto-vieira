const MainController = (() => {
  const validSections = ['dashboard', 'contas-pagar', 'contas-receber', 'categorias', 'funcionarios', 'vales', 'relatorios'];

  function applyTheme() {
    const theme = StorageService.getTheme();
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
  }

  function toggleTheme() {
    const next = StorageService.getTheme() === 'dark' ? 'light' : 'dark';
    StorageService.setTheme(next);
    applyTheme();
    DashboardView.showToast('Tema atualizado', next === 'dark' ? 'Modo escuro ativado.' : 'Modo claro ativado.');
    DashboardView.render(DashboardView.state.currentSection);
  }

  function setDateLabel() {
    const el = document.querySelector('#headerDate span');
    if (!el) return;
    el.textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
  }

  function navigate(section) {
    const target = validSections.includes(section) ? section : 'dashboard';
    document.querySelectorAll('.nav-item[data-section]').forEach((item) => item.classList.toggle('active', item.dataset.section === target));
    DashboardView.render(target);
    window.location.hash = target;
    closeSidebar();
  }

  function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('show');
    document.body.style.overflow = '';
  }

  function bindNavigation() {
    document.querySelectorAll('.nav-item[data-section]').forEach((item) => {
      item.addEventListener('click', () => navigate(item.dataset.section));
    });
    document.getElementById('btnMenu')?.addEventListener('click', openSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
  }

  function getEntityList(type) {
    if (type === 'categoria') return StorageService.getCategories();
    if (type === 'funcionario') return StorageService.getEmployees();
    if (type === 'pagar') return StorageService.getPayables();
    if (type === 'receber') return StorageService.getReceivables();
    if (type === 'vale') return StorageService.getAdvances();
    return [];
  }

  function saveEntityList(type, list) {
    if (type === 'categoria') return StorageService.saveCategories(list);
    if (type === 'funcionario') return StorageService.saveEmployees(list);
    if (type === 'pagar') return StorageService.savePayables(list);
    if (type === 'receber') return StorageService.saveReceivables(list);
    if (type === 'vale') return StorageService.saveAdvances(list);
  }

  function openForm(type, id = null) {
    DashboardView.toggleForm(type, true);
    if (type === 'categoria') fillCategory(id);
    if (type === 'funcionario') fillEmployee(id);
    if (type === 'pagar') fillPayable(id);
    if (type === 'receber') fillReceivable(id);
    if (type === 'vale') fillAdvance(id);
  }

  function cancelForm(type) {
    DashboardView.toggleForm(type, false);
    const formMap = { categoria: 'categoriaForm', funcionario: 'funcionarioForm', pagar: 'payableForm', receber: 'receivableForm', vale: 'advanceForm' };
    document.getElementById(formMap[type])?.reset();
  }

  function fillCategory(id) {
    const item = StorageService.getCategories().find((x) => x.id === id);
    document.getElementById('categoriaId').value = item?.id || '';
    document.getElementById('categoriaNome').value = item?.nome || '';
    document.getElementById('categoriaTipo').value = item?.tipo || 'entrada';
  }
  function fillEmployee(id) {
    const item = StorageService.getEmployees().find((x) => x.id === id);
    document.getElementById('funcionarioId').value = item?.id || '';
    document.getElementById('funcionarioNome').value = item?.nome || '';
    document.getElementById('funcionarioCpf').value = item?.cpf || '';
    document.getElementById('funcionarioCargo').value = item?.cargo || '';
    document.getElementById('funcionarioTelefone').value = item?.telefone || '';
    document.getElementById('funcionarioAdmissao').value = item?.admissao || '';
    document.getElementById('funcionarioStatus').value = item?.status || 'ativo';
  }
  function fillPayable(id) {
    const item = StorageService.getPayables().find((x) => x.id === id);
    document.getElementById('payableId').value = item?.id || '';
    document.getElementById('payableDescricao').value = item?.descricao || '';
    document.getElementById('payableCategoria').value = item?.categoriaId || document.getElementById('payableCategoria').value;
    document.getElementById('payableFornecedor').value = item?.fornecedor || '';
    document.getElementById('payableValor').value = item?.valor || '';
    document.getElementById('payableVencimento').value = item?.dataVencimento || '';
    document.getElementById('payablePagamento').value = item?.dataPagamento || '';
    document.getElementById('payableStatus').value = item?.status || '';
    document.getElementById('payableObservacao').value = item?.observacao || '';
  }
  function fillReceivable(id) {
    const item = StorageService.getReceivables().find((x) => x.id === id);
    document.getElementById('receivableId').value = item?.id || '';
    document.getElementById('receivableDescricao').value = item?.descricao || '';
    document.getElementById('receivableCategoria').value = item?.categoriaId || document.getElementById('receivableCategoria').value;
    document.getElementById('receivableOrigem').value = item?.origemCliente || '';
    document.getElementById('receivableValor').value = item?.valor || '';
    document.getElementById('receivableDataLancamento').value = item?.dataLancamento || item?.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    document.getElementById('receivableRecebimento').value = item?.dataRecebimento || '';
    document.getElementById('receivableStatus').value = item?.status || '';
    document.getElementById('receivableObservacao').value = item?.observacao || '';
  }
  function fillAdvance(id) {
    const item = StorageService.getAdvances().find((x) => x.id === id);
    document.getElementById('advanceId').value = item?.id || '';
    document.getElementById('advanceFuncionario').value = item?.funcionarioId || document.getElementById('advanceFuncionario').value;
    document.getElementById('advanceData').value = item?.data || '';
    document.getElementById('advanceValor').value = item?.valor || '';
    document.getElementById('advanceMotivo').value = item?.motivo || '';
  }

  function removeEntity(type, id) {
    const list = getEntityList(type).filter((item) => item.id !== id);
    saveEntityList(type, list);
    FinanceService.updateStatuses();
    DashboardView.showToast('Registro removido');
    navigate(DashboardView.state.currentSection);
  }

  function bindDelegatedEvents() {
    document.body.addEventListener('click', (event) => {
      const openBtn = event.target.closest('[data-open-form]');
      if (openBtn) openForm(openBtn.dataset.openForm);

      const cancelBtn = event.target.closest('[data-cancel-form]');
      if (cancelBtn) cancelForm(cancelBtn.dataset.cancelForm);

      const editBtn = event.target.closest('[data-edit]');
      if (editBtn) openForm(editBtn.dataset.edit, editBtn.dataset.id);

      const deleteBtn = event.target.closest('[data-delete]');
      if (deleteBtn && confirm('Deseja realmente excluir este registro?')) removeEntity(deleteBtn.dataset.delete, deleteBtn.dataset.id);

      if (event.target.id === 'btnFilterReports') navigate('relatorios');
      if (event.target.id === 'btnPrintReport') window.print();
    });

    document.body.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (event.target.id === 'categoriaForm') await saveCategory();
      if (event.target.id === 'funcionarioForm') await saveEmployee();
      if (event.target.id === 'payableForm') await savePayable();
      if (event.target.id === 'receivableForm') await saveReceivable();
      if (event.target.id === 'advanceForm') await saveAdvance();
    });
  }

  async function saveCategory() {
    const id = document.getElementById('categoriaId').value;
    const payload = { id: id || StorageService.uid('cat'), nome: document.getElementById('categoriaNome').value.trim(), tipo: document.getElementById('categoriaTipo').value, createdAt: new Date().toISOString() };
    if (!payload.nome) return DashboardView.showToast('Preencha o nome da categoria', '', 'error');
    let list = StorageService.getCategories();
    list = id ? list.map((item) => item.id === id ? { ...item, ...payload } : item) : [...list, payload];
    StorageService.saveCategories(list);
    cancelForm('categoria');
    navigate('categorias');
  }

  async function saveEmployee() {
    const id = document.getElementById('funcionarioId').value;
    const payload = {
      id: id || StorageService.uid('emp'), nome: document.getElementById('funcionarioNome').value.trim(), cpf: document.getElementById('funcionarioCpf').value.trim(), cargo: document.getElementById('funcionarioCargo').value.trim(), telefone: document.getElementById('funcionarioTelefone').value.trim(), admissao: document.getElementById('funcionarioAdmissao').value, status: document.getElementById('funcionarioStatus').value, createdAt: new Date().toISOString()
    };
    if (!payload.nome || !payload.cpf || !payload.cargo || !payload.telefone || !payload.admissao) return DashboardView.showToast('Preencha todos os campos do funcionário', '', 'error');
    let list = StorageService.getEmployees();
    list = id ? list.map((item) => item.id === id ? { ...item, ...payload } : item) : [...list, payload];
    StorageService.saveEmployees(list);
    cancelForm('funcionario');
    navigate('funcionarios');
  }

  async function savePayable() {
    const id = document.getElementById('payableId').value;
    const arquivo = await FileService.toBase64(document.getElementById('payableArquivo').files[0]);
    const comprovante = await FileService.toBase64(document.getElementById('payableComprovante').files[0]);
    const payload = {
      id: id || StorageService.uid('pay'),
      descricao: document.getElementById('payableDescricao').value.trim(),
      categoriaId: document.getElementById('payableCategoria').value,
      fornecedor: document.getElementById('payableFornecedor').value.trim(),
      valor: Number(document.getElementById('payableValor').value || 0),
      dataVencimento: document.getElementById('payableVencimento').value,
      dataPagamento: document.getElementById('payablePagamento').value,
      status: document.getElementById('payableStatus').value.trim(),
      observacao: document.getElementById('payableObservacao').value.trim(),
      arquivo,
      comprovante,
      createdAt: new Date().toISOString()
    };
    if (!payload.descricao || !payload.categoriaId || !payload.fornecedor || !payload.valor || !payload.dataVencimento) return DashboardView.showToast('Preencha os campos obrigatórios da conta a pagar', '', 'error');
    payload.status = FinanceService.normalizePayableStatus(payload);
    let list = StorageService.getPayables();
    if (id) {
      const original = list.find((item) => item.id === id);
      payload.arquivo = arquivo || original.arquivo;
      payload.comprovante = comprovante || original.comprovante;
      list = list.map((item) => item.id === id ? { ...item, ...payload } : item);
    } else list = [...list, payload];
    StorageService.savePayables(list);
    cancelForm('pagar');
    navigate('contas-pagar');
  }

  async function saveReceivable() {
    const id = document.getElementById('receivableId').value;
    const comprovante = await FileService.toBase64(document.getElementById('receivableComprovante').files[0]);
    const payload = {
      id: id || StorageService.uid('rec'),
      descricao: document.getElementById('receivableDescricao').value.trim(),
      categoriaId: document.getElementById('receivableCategoria').value,
      origemCliente: document.getElementById('receivableOrigem').value.trim(),
      valor: Number(document.getElementById('receivableValor').value || 0),
      dataLancamento: document.getElementById('receivableDataLancamento')?.value || new Date().toISOString().slice(0, 10),
      dataRecebimento: document.getElementById('receivableRecebimento').value,
      status: document.getElementById('receivableStatus').value.trim(),
      observacao: document.getElementById('receivableObservacao').value.trim(),
      comprovante,
      createdAt: new Date().toISOString()
    };
    if (!payload.descricao || !payload.categoriaId || !payload.origemCliente || !payload.valor) return DashboardView.showToast('Preencha os campos obrigatórios da conta a receber', '', 'error');
    payload.status = FinanceService.normalizeReceivableStatus(payload);
    let list = StorageService.getReceivables();
    if (id) {
      const original = list.find((item) => item.id === id);
      payload.comprovante = comprovante || original.comprovante;
      list = list.map((item) => item.id === id ? { ...item, ...payload } : item);
    } else list = [...list, payload];
    StorageService.saveReceivables(list);
    cancelForm('receber');
    navigate('contas-receber');
  }

  async function saveAdvance() {
    const id = document.getElementById('advanceId').value;
    const comprovante = await FileService.toBase64(document.getElementById('advanceComprovante').files[0]);
    const payload = { id: id || StorageService.uid('val'), funcionarioId: document.getElementById('advanceFuncionario').value, data: document.getElementById('advanceData').value, valor: Number(document.getElementById('advanceValor').value || 0), motivo: document.getElementById('advanceMotivo').value.trim(), comprovante, createdAt: new Date().toISOString() };
    if (!payload.funcionarioId || !payload.data || !payload.valor || !payload.motivo) return DashboardView.showToast('Preencha os campos obrigatórios do vale', '', 'error');
    let list = StorageService.getAdvances();
    if (id) {
      const original = list.find((item) => item.id === id);
      payload.comprovante = comprovante || original.comprovante;
      list = list.map((item) => item.id === id ? { ...item, ...payload } : item);
    } else list = [...list, payload];
    StorageService.saveAdvances(list);
    cancelForm('vale');
    navigate('vales');
  }

  function init() {
    if (!AuthController.requireAuth()) return;
    StorageService.seed();
    applyTheme();
    FinanceService.updateStatuses();
    setDateLabel();
    bindNavigation();
    bindDelegatedEvents();
    document.getElementById('btnTheme')?.addEventListener('click', toggleTheme);
    document.getElementById('btnLogout')?.addEventListener('click', AuthController.logout);
    const hash = window.location.hash.replace('#', '');
    navigate(hash || 'dashboard');
  }

  return { init, navigate };
})();
