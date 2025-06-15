import React, { useEffect, useState } from 'react';
import './components.css';
import api from '../api/api';
// Importar os ícones do lucide-react
import { Trash2, Edit, Save, X, PlusCircle, Eye } from 'lucide-react';

function EspecialidadesList({ user, showMessage }) {
  const [specialties, setSpecialties] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [doctors, setDoctors] = useState([]); // Agora 'doctors' é o estado para os médicos da especialidade expandida
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para adicionar/editar
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchSpecialties();
    // eslint-disable-next-line
  }, []);

  const fetchSpecialties = () => {
    setLoading(true);
    const token = localStorage.getItem('jwtToken'); // Use 'jwtToken' conforme definido em App.js
    api.get('/specialties', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
        setSpecialties(sorted);
        setLoading(false);
      })
      .catch(() => {
        setErro('Erro ao carregar especialidades');
        setLoading(false);
      });
  };

  // Consulta médicos da especialidade expandida
  const fetchDoctorsForSpecialty = (specialtyId) => {
    const token = localStorage.getItem('jwtToken');
    api.get(`/specialties/${specialtyId}/doctors`, { // Assumindo que você tem este endpoint no backend
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setDoctors(res.data))
      .catch(error => console.error('Erro ao carregar médicos da especialidade:', error));
  };


  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName) {
      showMessage && showMessage('O nome da especialidade é obrigatório.', 'error');
      return;
    }
    const token = localStorage.getItem('jwtToken');
    api.post('/specialties', { name: newName }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setNewName('');
        fetchSpecialties();
        showMessage && showMessage('Especialidade adicionada!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao adicionar', 'error');
      });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!editName) {
      showMessage && showMessage('O nome da especialidade é obrigatório.', 'error');
      return;
    }
    const token = localStorage.getItem('jwtToken');
    api.put(`/specialties/${editId}`, { name: editName }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setEditId(null);
        setEditName('');
        fetchSpecialties();
        showMessage && showMessage('Especialidade atualizada!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao editar', 'error');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Tem certeza que quer eliminar esta especialidade?')) return;
    const token = localStorage.getItem('jwtToken');
    api.delete(`/specialties/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        fetchSpecialties();
        showMessage && showMessage('Especialidade eliminada!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao eliminar', 'error');
      });
  };

  const handleToggleDetails = (specialtyId) => {
    setExpandedId(expandedId === specialtyId ? null : specialtyId);
    if (expandedId !== specialtyId) {
      fetchDoctorsForSpecialty(specialtyId); // Carregar médicos da especialidade expandida
    }
  };

  if (loading) return <div className="especialidades-container"><div className="especialidades-list">A carregar especialidades...</div></div>;
  if (erro) return <div className="especialidades-container"><div className="especialidades-list">{erro}</div></div>;

  return (
    <div className="especialidades-container">
      <div className="especialidades-list">
        <h2>Gestão de Especialidades</h2>

        {user?.role === 'admin' && (
          <form onSubmit={handleAdd} className="especialidade-form">
            <input
              type="text"
              placeholder="Nome da Especialidade"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="especialidade-input"
              required
            />
            {/* BOTÃO ADICIONAR */}
            <button type="submit" className="especialidade-btn add" title="Adicionar Especialidade">
              <PlusCircle size={20} /> Adicionar
            </button>
          </form>
        )}

        <ul>
          {specialties.map(spec => (
            <li key={spec.id} className="especialidade-item">
              <div className="especialidade-header" onClick={() => handleToggleDetails(spec.id)}>
                <span>{spec.name}</span>
                {/* BOTÃO PARA EXPANDIR/VER DETALHES */}
                <button className="especialidade-btn view-details" onClick={(e) => { e.stopPropagation(); handleToggleDetails(spec.id); }} title="Ver Detalhes">
                  <Eye size={18} />
                </button>
              </div>
              {expandedId === spec.id && (
                <div className="especialidade-details">
                  {editId === spec.id ? (
                    <form onSubmit={handleEdit} className="especialidade-edit-form">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="especialidade-input"
                        required
                      />
                      {/* BOTÃO GUARDAR */}
                      <button type="submit" className="especialidade-btn save" title="Guardar">
                        <Save size={18} />
                      </button>
                      {/* BOTÃO CANCELAR */}
                      <button type="button" className="especialidade-btn cancel" onClick={() => setEditId(null)} title="Cancelar">
                        <X size={18} />
                      </button>
                    </form>
                  ) : (
                    <>
                      {user?.role === 'admin' && (
                        <div className="especialidade-actions-row">
                          {/* BOTÃO EDITAR */}
                          <button className="especialidade-btn edit" onClick={() => { setEditId(spec.id); setEditName(spec.name); }} title="Editar Especialidade">
                            <Edit size={18} />
                          </button>
                          {/* BOTÃO ELIMINAR */}
                          <button className="especialidade-btn delete" onClick={() => handleDelete(spec.id)} title="Eliminar Especialidade">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                      <div style={{ marginTop: 10 }}>
                        <strong>Médicos desta especialidade:</strong>
                        {doctors.length === 0 ? (
                          <div className="sem-medicos">Sem médicos associados.</div>
                        ) : (
                          <ul>
                            {doctors.map(doc => (
                              <li key={doc.id}>{doc.name}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default EspecialidadesList;