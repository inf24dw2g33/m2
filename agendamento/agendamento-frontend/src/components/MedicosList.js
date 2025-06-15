import React, { useEffect, useState } from 'react';
// Importar os ícones do lucide-react
import { Trash2, Edit, Save, X, Eye, PlusCircle, Calendar } from 'lucide-react'; // Adicione Calendar para 'Consultas'
import './components.css';
import api from '../api/api';

function MedicosList({ user, token, showMessage, setView }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [newName, setNewName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
    // eslint-disable-next-line
  }, []);

  const fetchDoctors = () => {
    setLoading(true);
    //const token = localStorage.getItem('token'); // 'token' já é passado como prop
    api.get('/doctors', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setDoctors(res.data);
        setLoading(false);
      })
      .catch(() => {
        setErro('Erro ao carregar médicos');
        setLoading(false);
      });
  };

  const fetchSpecialties = () => {
    //const token = localStorage.getItem('token'); // 'token' já é passado como prop
    api.get('/specialties', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setSpecialties(res.data);
      });
  };

  // Adicionar médico
  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newSpecialty) {
      showMessage && showMessage('Por favor, preencha o nome e a especialidade.', 'error');
      return;
    }
    //const token = localStorage.getItem('token'); // 'token' já é passado como prop
    api.post('/doctors', { name: newName, specialty_id: Number(newSpecialty) }, { // Converter para Number
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setNewName('');
        setNewSpecialty('');
        fetchDoctors();
        showMessage && showMessage('Médico adicionado!', 'success');
      })
      .catch(err => {
        console.error("Erro ao adicionar médico:", err.response?.data || err);
        showMessage && showMessage(err.response?.data?.error || 'Erro ao adicionar médico', 'error');
      });
  };

  // Editar médico
  const handleEdit = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editSpecialty) {
      showMessage && showMessage('Por favor, preencha o nome e a especialidade.', 'error');
      return;
    }
    //const token = localStorage.getItem('token'); // 'token' já é passado como prop
    api.put(`/doctors/${editId}`, { name: editName, specialty_id: Number(editSpecialty) }, { // Converter para Number
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setEditId(null);
        setEditName('');
        setEditSpecialty('');
        fetchDoctors();
        showMessage && showMessage('Médico atualizado!', 'success');
      })
      .catch(err => {
        console.error("Erro ao editar médico:", err.response?.data || err);
        showMessage && showMessage(err.response?.data?.error || 'Erro ao editar médico', 'error');
      });
  };

  // Eliminar médico
  const handleDelete = (id) => {
    if (!window.confirm('Eliminar este médico? Todas as consultas associadas também serão afetadas.')) return;
    //const token = localStorage.getItem('token'); // 'token' já é passado como prop
    api.delete(`/doctors/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        fetchDoctors();
        showMessage && showMessage('Médico eliminado!', 'success');
      })
      .catch(err => {
        console.error("Erro ao eliminar médico:", err.response?.data || err);
        showMessage && showMessage(err.response?.data?.error || 'Erro ao eliminar médico', 'error');
      });
  };

  if (loading) return <div className="medicos-container"><div className="medicos-table">A carregar médicos...</div></div>;
  if (erro) return <div className="medicos-container"><div className="medicos-table">{erro}</div></div>;

  return (
    <div className="medicos-container">
      <div className="medicos-table">
        <h2>Médicos</h2>

        {/* Botão para adicionar médico (apenas admin) */}
        {user?.role === 'admin' && (
          <form onSubmit={handleAdd} className="medico-form">
            <input
              type="text"
              placeholder="Nome do médico"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="medico-input"
              required
            />
            <select
              value={newSpecialty}
              onChange={e => setNewSpecialty(e.target.value)}
              className="medico-input"
              required
            >
              <option value="">Especialidade</option>
              {specialties.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {/* BOTÃO ADICIONAR */}
            <button type="submit" className="medico-btn add" title="Adicionar Médico">
              <PlusCircle size={20} /> Adicionar
            </button>
          </form>
        )}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Especialidade</th>
              {user?.role === 'admin' && <th>Ações</th>}
              <th>Consultas</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(doc => (
              <tr key={doc.id}>
                <td>{doc.id}</td>
                <td>
                  {editId === doc.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="medico-input"
                    />
                  ) : (
                    doc.name
                  )}
                </td>
                <td>
                  {editId === doc.id ? (
                    <select
                      value={editSpecialty}
                      onChange={e => setEditSpecialty(e.target.value)}
                      className="medico-input"
                    >
                      <option value="">Especialidade</option>
                      {specialties.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    doc.specialty?.name
                  )}
                </td>
                {user?.role === 'admin' && (
                  <td>
                    {editId === doc.id ? (
                      <>
                        {/* BOTÃO GUARDAR */}
                        <button className="medico-btn save" onClick={handleEdit} title="Guardar">
                          <Save size={18} />
                        </button>
                        {/* BOTÃO CANCELAR */}
                        <button className="medico-btn cancel" onClick={() => setEditId(null)} title="Cancelar">
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* BOTÃO EDITAR */}
                        <button className="medico-btn edit" onClick={() => { setEditId(doc.id); setEditName(doc.name); setEditSpecialty(doc.specialty?.id || ''); }} title="Editar">
                          <Edit size={18} />
                        </button>
                        {/* BOTÃO ELIMINAR */}
                        <button className="medico-btn delete" onClick={() => handleDelete(doc.id)} title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                )}
                <td>
                  {/* BOTÃO CONSULTAR/VER CONSULTAS */}
                  <button
                    className="medico-btn consultas"
                    onClick={() => {
                      // Para passar o ID do médico para a rota de consultas
                      localStorage.setItem('filterDoctorId', doc.id);
                      localStorage.setItem('filterDoctorName', doc.name);
                      setView('Consultas');
                    }}
                    title="Ver Consultas do Médico"
                  >
                    <Calendar size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MedicosList;