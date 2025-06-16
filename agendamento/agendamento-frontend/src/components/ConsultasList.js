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
  const [editPaciente, setEditPaciente] = useState('');

  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [pacientes, setPacientes] = useState([]);

  // Estados para adicionar nova consulta
  const [newData, setNewData] = useState('');
  const [newDescricao, setNewDescricao] = useState('');
  const [newMedico, setNewMedico] = useState('');
  const [newEspecialidade, setNewEspecialidade] = useState('');
  const [newPaciente, setNewPaciente] = useState('');

  // *** NOVO: Estados para os filtros ***
  const [filterEspecialidade, setFilterEspecialidade] = useState('');
  const [filterMedico, setFilterMedico] = useState('');

  // UseEffect para carregar dados iniciais e re-carregar em mudanças de token/filtros
  useEffect(() => {
    fetchConsultas();
    fetchMedicos();
    fetchEspecialidades();
    fetchPacientes();
    // eslint-disable-next-line
  }, [token, filterEspecialidade, filterMedico]); // Dependências para re-fetch com filtros

  const fetchConsultas = () => {
    setLoading(true);
    setErro(''); // Limpa erro antes de nova busca
    let url = '/appointments';
    const params = new URLSearchParams();

    // *** NOVO: Adiciona filtros aos parâmetros da URL ***
    if (filterEspecialidade) {
        params.append('specialtyId', filterEspecialidade);
    }
    if (filterMedico) {
        params.append('medicoId', filterMedico);
    }

    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    api.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setConsultas(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar consultas:", err);
        setErro('Erro ao carregar consultas. ' + (err.response?.data?.error || ''));
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

  const fetchPacientes = () => {
    api.get('/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const pacientesData = res.data.filter(u => u.role === 'user');
        setPacientes(pacientesData);
      })
      .catch(err => console.error('Erro ao carregar pacientes:', err));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newData || !newMedico || !newEspecialidade || (user?.role === 'admin' && !newPaciente)) {
        showMessage && showMessage('Preencha todos os campos obrigatórios para adicionar.', 'warning');
        return;
    }

    const payload = {
        data: newData,
        medicoId: Number(newMedico),
        especialidadeId: Number(newEspecialidade),
        descricao: newDescricao
    };

    if (user?.role === 'admin' && newPaciente) {
        payload.pacienteId = Number(newPaciente);
    }

    api.post('/appointments', payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setNewData('');
        setNewDescricao('');
        setNewMedico('');
        setNewEspecialidade('');
        setNewPaciente('');
        fetchConsultas();
        showMessage && showMessage('Consulta adicionada com sucesso!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao adicionar consulta.', 'error');
      });
  };

  const handleEdit = (e) => {
    e.preventDefault();
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

    if (user?.role === 'admin' && editPaciente) {
        payload.pacienteId = Number(editPaciente);
    }

    api.put(`/appointments/${editId}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setEditId(null);
        setEditData('');
        setEditDescricao('');
        setEditMedico('');
        setEditEspecialidade('');
        setEditPaciente('');
        fetchConsultas();
        showMessage && showMessage('Consulta atualizada com sucesso!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao editar consulta.', 'error');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar esta consulta?')) return;
    api.delete(`/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        fetchConsultas();
        showMessage && showMessage('Consulta eliminada com sucesso!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao eliminar consulta.', 'error');
      });
  };

  const formatDateTimeForInput = (isoString) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
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
        // Converte para um objeto Date. Se a string já estiver em UTC (com 'Z'), será tratada como tal.
        // Se for uma string local sem 'Z', Date() a tratará como local.
        const date = new Date(isoString);
        // Garante que a data seja formatada para o fuso horário local do usuário, com 24h.
        return date.toLocaleString('pt-PT', {
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
        {user?.role === 'admin' && (
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
                        setNewMedico('');
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

        {/* *** NOVO: Filtros para a tabela de consultas *** */}
        <div className="consulta-filters">
            <h3>Filtrar Consultas</h3>
            <select
                value={filterEspecialidade}
                onChange={e => {
                    setFilterEspecialidade(e.target.value);
                    setFilterMedico(''); // Reseta médico quando especialidade muda
                }}
                className="consulta-input"
            >
                <option value="">Todas as Especialidades</option>
                {especialidades.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
            <select
                value={filterMedico}
                onChange={e => setFilterMedico(e.target.value)}
                className="consulta-input"
            >
                <option value="">Todos os Médicos</option>
                {medicos
                    .filter(m => !filterEspecialidade || m.specialty?.id === Number(filterEspecialidade))
                    .map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
            </select>
            {/* Um botão para limpar os filtros pode ser útil */}
            {(filterEspecialidade || filterMedico) && (
                <button onClick={() => { setFilterEspecialidade(''); setFilterMedico(''); }} className="consulta-btn cancel" style={{ marginLeft: '10px' }}>
                    Limpar Filtros
                </button>
            )}
        </div>


        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Especialidade</th>
              <th>Médico</th>
              <th>Descrição</th>
              <th>Paciente</th>
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
                          setEditMedico('');
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
                <td>
                  {editId === c.id && user?.role === 'admin' ? (
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
                  ) : (
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
                        setEditData(formatDateTimeForInput(c.data));
                        setEditDescricao(c.descricao || '');
                        // Certifica-se de que os IDs são strings para o select value
                        setEditEspecialidade(c.specialty?.id?.toString() || '');
                        setEditMedico(c.medico?.id?.toString() || '');
                        setEditPaciente(c.paciente?.id?.toString() || '');
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