import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Save, X, Eye } from 'lucide-react';
import './components.css';
import api from '../api/api';

function ConsultasList({ user, token, showMessage }) {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editMedico, setEditMedico] = useState('');
  const [editEspecialidade, setEditEspecialidade] = useState('');
  const [editPaciente, setEditPaciente] = useState(''); // NOVO: Estado para o ID do paciente selecionado na edição

  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [pacientes, setPacientes] = useState([]); // NOVO: Lista de pacientes para o select

  // Estados para adicionar nova consulta
  const [newData, setNewData] = useState('');
  const [newDescricao, setNewDescricao] = useState('');
  const [newMedico, setNewMedico] = useState('');
  const [newEspecialidade, setNewEspecialidade] = useState('');
  const [newPaciente, setNewPaciente] = useState(''); // NOVO: Estado para o ID do paciente ao adicionar (para admin)


  useEffect(() => {
    fetchConsultas();
    fetchMedicos();
    fetchEspecialidades();
    fetchPacientes(); // NOVO: Carregar pacientes ao montar o componente
    // eslint-disable-next-line
  }, []);

  const fetchConsultas = () => {
    setLoading(true);
    api.get('/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setConsultas(res.data);
        setLoading(false);
        setErro(''); // Limpa erro se a busca for bem-sucedida
      })
      .catch(() => {
        setErro('Erro ao carregar consultas');
        setLoading(false);
      });
  };

  const fetchMedicos = () => {
    api.get('/doctors', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMedicos(res.data))
      .catch(err => console.error('Erro ao carregar médicos:', err));
  };

  const fetchEspecialidades = () => {
    api.get('/specialties', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setEspecialidades(res.data))
      .catch(err => console.error('Erro ao carregar especialidades:', err));
  };

  // NOVO: Função para buscar pacientes
  const fetchPacientes = () => {
    api.get('/users', { // Supondo que você tem um endpoint /users que retorna todos os usuários/pacientes
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        // Filtra apenas usuários com role 'user' se aplicável, ou ajuste conforme a sua lógica de roles
        const pacientesData = res.data.filter(u => u.role === 'user'); // Assumindo que pacientes têm role 'user'
        setPacientes(pacientesData);
      })
      .catch(err => console.error('Erro ao carregar pacientes:', err));
  };

  // Adicionar consulta
  const handleAdd = (e) => {
    e.preventDefault();

    // Validação básica
    if (!newData || !newMedico || !newEspecialidade || (user?.role === 'admin' && !newPaciente)) {
        showMessage && showMessage('Preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    const payload = {
        data: newData,
        medicoId: Number(newMedico),
        especialidadeId: Number(newEspecialidade),
        descricao: newDescricao
    };

    // Adiciona pacienteId ao payload APENAS se for admin e um paciente foi selecionado
    if (user?.role === 'admin' && newPaciente) {
        payload.pacienteId = Number(newPaciente);
    }

    api.post('/appointments', payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        // Limpar estados do formulário após adição
        setNewData('');
        setNewDescricao('');
        setNewMedico('');
        setNewEspecialidade('');
        setNewPaciente(''); // Limpar também o estado do paciente
        fetchConsultas(); // Recarrega a lista para mostrar a nova consulta
        showMessage && showMessage('Consulta adicionada com sucesso!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao adicionar consulta.', 'error');
      });
  };

  // Editar consulta
  const handleEdit = (e) => {
    e.preventDefault();

    // Validação básica
    if (!editData || !editMedico || !editEspecialidade || (user?.role === 'admin' && !editPaciente)) {
      showMessage && showMessage('Preencha todos os campos obrigatórios para edição.', 'warning');
      return;
    }

    const payload = {
      data: editData,
      medicoId: Number(editMedico),
      especialidadeId: Number(editEspecialidade),
      descricao: editDescricao
    };

    // Adiciona pacienteId ao payload APENAS se for admin e um paciente foi selecionado
    if (user?.role === 'admin' && editPaciente) {
        payload.pacienteId = Number(editPaciente);
    }

    api.put(`/appointments/${editId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        // Limpar estados do formulário de edição
        setEditId(null);
        setEditData('');
        setEditDescricao('');
        setEditMedico('');
        setEditEspecialidade('');
        setEditPaciente(''); // Limpar o estado do paciente de edição
        fetchConsultas(); // Recarrega a lista para mostrar as alterações
        showMessage && showMessage('Consulta atualizada com sucesso!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao editar consulta.', 'error');
      });
  };

  // Eliminar consulta
  const handleDelete = (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar esta consulta?')) return;
    api.delete(`/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        fetchConsultas(); // Recarrega a lista
        showMessage && showMessage('Consulta eliminada com sucesso!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao eliminar consulta.', 'error');
      });
  };

  // Funções para formatar data e hora
  const formatDateTimeForInput = (isoString) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        // Formato 'YYYY-MM-DDTHH:MM' para input type="datetime-local"
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
        console.error("Erro ao formatar data para input:", isoString, e);
        return '';
    }
  };

  const formatDateTimeForDisplay = (isoString) => {
    if (!isoString) return '';
    try {
        return new Date(isoString).toLocaleString('pt-PT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Formato 24 horas
        });
    } catch (e) {
        console.error("Erro ao formatar data para exibição:", isoString, e);
        return '';
    }
  };


  if (loading) return <div className="consultas-container"><div className="consultas-table">A carregar consultas...</div></div>;
  if (erro) return <div className="consultas-container"><div className="consultas-table">{erro}</div></div>;

  return (
    <div className="consultas-container">
      <div className="consultas-table">
        <h2>Consultas</h2>

        {/* Formulário para adicionar consulta (Visível apenas para admins, ou pode ajustar) */}
        {user?.role === 'admin' && ( // Adicionado condição para admin para este formulário completo
            <form onSubmit={handleAdd} className="consulta-form">
                <h3>Adicionar Nova Consulta</h3>
                <input
                    type="datetime-local"
                    value={newData}
                    onChange={e => setNewData(e.target.value)}
                    className="consulta-input"
                    required
                />
                <select
                    value={newEspecialidade}
                    onChange={e => {
                        setNewEspecialidade(e.target.value);
                        setNewMedico(''); // Limpa o médico quando a especialidade muda
                    }}
                    className="consulta-input"
                    required
                >
                    <option value="">Especialidade</option>
                    {especialidades.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <select
                    value={newMedico}
                    onChange={e => setNewMedico(e.target.value)}
                    className="consulta-input"
                    required
                >
                    <option value="">Médico</option>
                    {medicos
                        .filter(m => !newEspecialidade || m.specialty?.id === Number(newEspecialidade))
                        .map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                </select>
                {/* NOVO: Select para Paciente ao adicionar (apenas para admin) */}
                <select
                    value={newPaciente}
                    onChange={e => setNewPaciente(e.target.value)}
                    className="consulta-input"
                    required
                >
                    <option value="">Paciente</option>
                    {pacientes.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={newDescricao}
                    onChange={e => setNewDescricao(e.target.value)}
                    className="consulta-input"
                />
                <button type="submit" className="consulta-btn add">Adicionar Consulta</button>
            </form>
        )}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Especialidade</th>
              <th>Médico</th>
              <th>Descrição</th>
              <th>Paciente</th> {/* NOVO: Cabeçalho da coluna Paciente */}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {consultas.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>
                  {editId === c.id ? (
                    <input
                      type="datetime-local"
                      value={editData}
                      onChange={e => setEditData(e.target.value)}
                      className="consulta-input"
                    />
                  ) : (
                    formatDateTimeForDisplay(c.data)
                  )}
                </td>
                <td>
                  {editId === c.id ? (
                    <select
                      value={editEspecialidade}
                      onChange={e => {
                          setEditEspecialidade(e.target.value);
                          setEditMedico(''); // Limpa o médico se a especialidade de edição mudar
                      }}
                      className="consulta-input"
                    >
                      <option value="">Especialidade</option>
                      {especialidades.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    c.specialty?.name
                  )}
                </td>
                <td>
                  {editId === c.id ? (
                    <select
                      value={editMedico}
                      onChange={e => setEditMedico(e.target.value)}
                      className="consulta-input"
                    >
                      <option value="">Médico</option>
                      {medicos
                        .filter(m => !editEspecialidade || m.specialty?.id === Number(editEspecialidade))
                        .map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                  ) : (
                    c.medico?.name || ''
                  )}
                </td>
                <td>
                  {editId === c.id ? (
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={editDescricao}
                      onChange={e => setEditDescricao(e.target.value)}
                      className="consulta-input"
                    />
                  ) : (
                    c.descricao
                  )}
                </td>
                {/* Célula do Paciente - visível durante a exibição e, se admin, pode ter um select */}
                <td>
                  {editId === c.id && user?.role === 'admin' ? ( // Se está em edição E é admin, mostra o select
                    <select
                      value={editPaciente}
                      onChange={e => setEditPaciente(e.target.value)}
                      className="consulta-input"
                      required
                    >
                      <option value="">Paciente</option>
                      {pacientes.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : ( // Caso contrário (não está em edição ou não é admin), apenas exibe o nome
                    c.paciente ? c.paciente.name : 'N/A'
                  )}
                </td>
                <td>
                  {editId === c.id ? (
                    <>
                      <button className="consulta-btn save" onClick={handleEdit} title="Guardar">
                        <Save size={18} />
                      </button>
                      <button className="consulta-btn cancel" onClick={() => setEditId(null)} title="Cancelar">
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="consulta-btn edit" onClick={() => {
                        setEditId(c.id);
                        // Formata a data para o input datetime-local
                        setEditData(formatDateTimeForInput(c.data));
                        setEditDescricao(c.descricao || '');
                        setEditEspecialidade(c.specialty?.id || '');
                        setEditMedico(c.medico?.id || '');
                        setEditPaciente(c.paciente?.id || ''); // NOVO: Inicializa o estado do paciente para edição
                      }} title="Editar">
                        <Edit size={18} />
                      </button>
                      <button className="consulta-btn delete" onClick={() => handleDelete(c.id)} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ConsultasList;