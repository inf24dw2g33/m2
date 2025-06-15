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
  const [editMedico, setEditMedico] = useState(''); // Estado para o ID do médico selecionado na edição
  const [editEspecialidade, setEditEspecialidade] = useState(''); // Estado para o ID da especialidade selecionada na edição
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [newData, setNewData] = useState('');
  const [newDescricao, setNewDescricao] = useState('');
  const [newMedico, setNewMedico] = useState('');
  const [newEspecialidade, setNewEspecialidade] = useState('');

  

  useEffect(() => {
    fetchConsultas();
    fetchMedicos(); // Necessário para os selects de adicionar/editar
    fetchEspecialidades(); // Necessário para os selects de adicionar/editar
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
      })
      .catch(() => {
        setErro('Erro ao carregar consultas');
        setLoading(false);
      });
  };

  const fetchMedicos = () => {
    api.get('/doctors', { // Assumindo que este endpoint retorna médicos com a sua especialidade aninhada
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMedicos(res.data))
      .catch(err => console.error('Erro ao carregar médicos:', err)); // Adicionar tratamento de erro
  };

  const fetchEspecialidades = () => {
    api.get('/specialties', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setEspecialidades(res.data))
      .catch(err => console.error('Erro ao carregar especialidades:', err)); // Adicionar tratamento de erro
  };

  // Adicionar consulta
  const handleAdd = (e) => {
    e.preventDefault();
    if (!newData || !newMedico || !newEspecialidade) return;

    const medicoIdNum = Number(newMedico);
    const especialidadeIdNum = Number(newEspecialidade);

    api.post('/appointments', {
      data: newData,
      medicoId: medicoIdNum,
      especialidadeId: especialidadeIdNum,
      descricao: newDescricao
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setNewData('');
        setNewDescricao('');
        setNewMedico('');
        setNewEspecialidade('');
        fetchConsultas();
        showMessage && showMessage('Consulta adicionada!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao adicionar', 'error');
      });
  };

  // Editar consulta
  const handleEdit = (e) => {
    e.preventDefault();
    if (!editData || !editMedico || !editEspecialidade) return;
    api.put(`/appointments/${editId}`, {
      data: editData,
      medicoId: editMedico,
      especialidadeId: editEspecialidade,
      descricao: editDescricao
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setEditId(null);
        setEditData('');
        setEditDescricao('');
        setEditMedico('');
        setEditEspecialidade('');
        fetchConsultas();
        showMessage && showMessage('Consulta atualizada!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao editar', 'error');
      });
  };

  // Eliminar consulta
  const handleDelete = (id) => {
    if (!window.confirm('Eliminar esta consulta?')) return;
    api.delete(`/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        fetchConsultas();
        showMessage && showMessage('Consulta eliminada!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao eliminar', 'error');
      });
  };

  if (loading) return <div className="consultas-container"><div className="consultas-table">A carregar consultas...</div></div>;
  if (erro) return <div className="consultas-container"><div className="consultas-table">{erro}</div></div>;

  return (
    <div className="consultas-container">
      <div className="consultas-table">
        <h2>Consultas</h2>

        {/* Botão para adicionar consulta */}
        <form onSubmit={handleAdd} className="consulta-form">
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
          <input
            type="text"
            placeholder="Descrição"
            value={newDescricao}
            onChange={e => setNewDescricao(e.target.value)}
            className="consulta-input"
          />
          <button type="submit" className="consulta-btn add">Adicionar</button>
        </form>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Especialidade</th>
              <th>Médico</th> {/* Este é o cabeçalho que queremos popular */}
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
                    // Aqui, c.data já é formatado pelo backend como ISO 8601 string
                    c.data ? new Date(c.data).toLocaleString() : ''
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
                    // O backend já envia c.specialty.name
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
                    // Alterado de `medicos.find(m => m.id === c.medicoId)?.name || ''`
                    // para usar a estrutura que vem do backend: c.medico.name
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
                  {editId === c.id ? (
                    <>
                      <button className="consulta-btn save" onClick={handleEdit} title="Guardar">
                        <Save size={18} />
                      </button>
                      {/* BOTÃO CANCELAR */}
                      <button className="consulta-btn cancel" onClick={() => setEditId(null)} title="Cancelar">
                        <X size={18} /> {/* Ícone 'X' para cancelar */}
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="consulta-btn edit" onClick={() => {
                        setEditId(c.id);
                        setEditData(c.data ? c.data.slice(0, 16) : '');
                        setEditDescricao(c.descricao || '');
                        setEditEspecialidade(c.specialty?.id || '');
                        setEditMedico(c.medico?.id || '');
                      }} title="Editar">
                        <Edit size={18} />
                      </button>
                      {/* BOTÃO ELIMINAR */}
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