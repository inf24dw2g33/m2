import React, { useEffect, useState } from 'react';
import './components.css';
import api from '../api/api';
import { Trash2, Edit, Save, X, Eye, PlusCircle } from 'lucide-react';

// MUDANÇA: 'setView' não será mais necessário aqui, pois as consultas serão exibidas diretamente
function UsersList({ showMessage, token, user }) { // Removido 'setView' das props
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGoogleId, setNewGoogleId] = useState('');
  const [newRole, setNewRole] = useState('user');

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');

  const [expandedUserId, setExpandedUserId] = useState(null);

  const [doctorsForExpandedUser, setDoctorsForExpandedUser] = useState([]);
  const [appointmentsForExpandedUser, setAppointmentsForExpandedUser] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [specAppointmentsForExpandedUser, setSpecAppointmentsForExpandedUser] = useState([]);
  const [selectedSpecialtyForAppointments, setSelectedSpecialtyForAppointments] = useState('');

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchSpecialties();
    } else {
      setErro('Token de autenticação não encontrado.');
      setLoading(false);
    }
  }, [token]);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erro ao carregar utilizadores:', error);
        setErro('Erro ao carregar utilizadores: ' + (error.response?.data?.error || error.message));
        setLoading(false);
      });
  };

  const fetchSpecialties = () => {
    api.get('/specialties', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setSpecialties(res.data))
      .catch(err => console.error('Erro ao carregar especialidades:', err));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newRole) {
      showMessage && showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }
    api.post('/users', { name: newName, email: newEmail, google_id: newGoogleId, role: newRole }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setNewName('');
        setNewEmail('');
        setNewGoogleId('');
        setNewRole('user');
        fetchUsers();
        showMessage && showMessage('Utilizador adicionado!', 'success');
      })
      .catch(err => {
        console.error("Erro ao adicionar utilizador:", err.response?.data || err);
        showMessage && showMessage(err.response?.data?.error || 'Erro ao adicionar utilizador', 'error');
      });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!editName || !editEmail || !editRole) {
      showMessage && showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }
    api.put(`/users/${editId}`, { name: editName, email: editEmail, role: editRole }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setEditId(null);
        setEditName('');
        setEditEmail('');
        setEditRole('');
        fetchUsers();
        showMessage && showMessage('Utilizador atualizado!', 'success');
      })
      .catch(err => {
        console.error("Erro ao editar utilizador:", err.response?.data || err);
        showMessage && showMessage(err.response?.data?.error || 'Erro ao editar utilizador', 'error');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Tem certeza que quer eliminar este utilizador?')) return;
    api.delete(`/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        fetchUsers();
        showMessage && showMessage('Utilizador eliminado!', 'success');
      })
      .catch(err => {
        console.error("Erro ao eliminar utilizador:", err.response?.data || err);
        showMessage && showMessage(err.response?.data?.error || 'Erro ao eliminar utilizador', 'error');
      });
  };

  const handleToggleDetails = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
    if (expandedUserId !== userId) {
      fetchDoctorsForUser(userId);
      fetchAppointmentsForUser(userId);
      setSpecAppointmentsForExpandedUser([]);
      setSelectedSpecialtyForAppointments('');
    }
  };

  const fetchDoctorsForUser = (userId) => {
    api.get(`/users/${userId}/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setDoctorsForExpandedUser(res.data))
      .catch(error => console.error('Erro ao carregar médicos do utilizador:', error));
  };

  const fetchAppointmentsForUser = (userId) => {
    api.get(`/users/${userId}/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setAppointmentsForExpandedUser(res.data);
      })
      .catch(error => console.error('Erro ao carregar consultas do utilizador:', error));
  };

  const handleFetchSpecAppointments = (userId, specialtyId) => {
    if (!specialtyId) {
      setSpecAppointmentsForExpandedUser([]);
      return;
    }
    api.get(`/users/${userId}/specialties/${specialtyId}/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setSpecAppointmentsForExpandedUser(res.data))
      .catch(error => console.error('Erro ao carregar consultas por especialidade:', error));
  };

  // MUDANÇA: Esta função não é mais necessária
  // const handleViewAllUserAppointmentsPage = (userId, userName) => {
  //   localStorage.setItem('filterPatientId', userId);
  //   localStorage.setItem('filterPatientName', userName);
  //   setView('Consultas');
  // };

  if (loading) return <div className="users-container"><div className="users-table">A carregar utilizadores...</div></div>;
  if (erro) return <div className="users-container"><div className="users-table">{erro}</div></div>;

  return (
    <div className="users-container">
      <div className="users-table">
        <h2>Gestão de Utilizadores</h2>

        {user?.role === 'admin' && (
          <form onSubmit={handleAdd} className="user-form">
            <input type="text" placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} className="user-input" required />
            <input type="email" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="user-input" required />
            <input type="text" placeholder="Google ID (Opcional)" value={newGoogleId} onChange={e => setNewGoogleId(e.target.value)} className="user-input" />
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="user-input">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="user-btn add" title="Adicionar Utilizador">
              <PlusCircle size={20} /> Adicionar
            </button>
          </form>
        )}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Role</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <React.Fragment key={u.id}>
                <tr onClick={() => handleToggleDetails(u.id)} className="user-list-item-header">
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <button className="user-btn view-details" onClick={() => handleToggleDetails(u.id)} title="Ver Detalhes">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
                {expandedUserId === u.id && (
                  <tr>
                    <td colSpan="5">
                      <div className="user-details-expanded">
                        {editId === u.id ? (
                          <form onSubmit={handleEdit} className="user-edit-form">
                            <label>Nome:</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="user-input"
                              placeholder="Nome"
                            />
                            <label>Email:</label>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={e => setEditEmail(e.target.value)}
                              className="user-input"
                              placeholder="Email"
                            />
                            <label>Role:</label>
                            <select
                              value={editRole}
                              onChange={e => setEditRole(e.target.value)}
                              className="user-input"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button type="submit" className="user-btn save" title="Guardar">
                              <Save size={18} />
                            </button>
                            <button type="button" className="user-btn cancel" onClick={() => setEditId(null)} title="Cancelar">
                              <X size={18} />
                            </button>
                          </form>
                        ) : (
                          <div className="user-actions-details">
                            {user?.role === 'admin' && (
                              <div className="user-actions-row">
                                <button
                                  className="user-btn edit"
                                  onClick={() => {
                                    setEditId(u.id);
                                    setEditName(u.name);
                                    setEditEmail(u.email);
                                    setEditRole(u.role);
                                  }}
                                  title="Editar Utilizador"
                                >
                                  <Edit size={18} />
                                </button>
                                <button className="user-btn delete" onClick={() => handleDelete(u.id)} title="Eliminar Utilizador">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            )}

                            <div className="user-info-lists">
                                <div className="user-sub-section">
                                    <h4>Médicos consultados:</h4>
                                    {doctorsForExpandedUser.length === 0 ? (
                                    <p>Nenhum médico consultado.</p>
                                    ) : (
                                    <ul className="doctors-list-inline">
                                        {doctorsForExpandedUser.map(d => (
                                        <li key={d.id}>{d.name}</li>
                                        ))}
                                    </ul>
                                    )}
                                </div>

                                <div className="user-sub-section">
                                    <h4>Todas as Consultas:</h4>
                                    {appointmentsForExpandedUser.length === 0 ? (
                                    <p>Nenhuma consulta agendada.</p>
                                    ) : (
                                    <ul className="appointments-list-scroll">
                                        {appointmentsForExpandedUser.map(a => (
                                        <li key={a.id}>
                                            {/* Corrigir exibição da data/hora */}
                                            {a.data ? new Date(a.data).toLocaleString() : 'Data Inválida'} - {a.descricao} - {a.medico?.name} ({a.specialty?.name})
                                        </li>
                                        ))}
                                    </ul>
                                    )}
                                    {/* MUDANÇA: BOTÃO REMOVIDO */}
                                    {/* <button
                                        className="user-btn view-all-consultas"
                                        onClick={() => handleViewAllUserAppointmentsPage(u.id, u.name)}
                                        title="Ver todas as Consultas"
                                    >
                                        <Eye size={18} /> Ver todas as Consultas na página dedicada
                                    </button> */}
                                </div>

                                <div className="user-sub-section">
                                    <h4>Consultas por Especialidade:</h4>
                                    <select
                                    className="user-input"
                                    value={selectedSpecialtyForAppointments}
                                    onChange={e => {
                                        setSelectedSpecialtyForAppointments(e.target.value);
                                        handleFetchSpecAppointments(u.id, e.target.value);
                                    }}
                                    >
                                    <option value="">Selecione uma Especialidade</option>
                                    {specialties.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                    </select>
                                    {selectedSpecialtyForAppointments && (
                                    specAppointmentsForExpandedUser.length === 0 ? (
                                        <p>Nenhuma consulta encontrada para esta especialidade.</p>
                                    ) : (
                                        <ul className="appointments-list-scroll">
                                        {specAppointmentsForExpandedUser.map(a => (
                                            <li key={a.id}>
                                            {/* Corrigir exibição da data/hora */}
                                            {a.data ? new Date(a.data).toLocaleString() : 'Data Inválida'} - {a.descricao} - {a.medico?.name}
                                            </li>
                                        ))}
                                        </ul>
                                    )
                                    )}
                                </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersList;