import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Save, X, Eye, PlusCircle } from 'lucide-react';
import './components.css';
import api from '../api/api';

function UsersList({ user, token, showMessage }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [editUserId, setEditUserId] = useState(null);
    const [editName, setEditName] = useState('');

    const [expandedUserId, setExpandedUserId] = useState(null);
    const [expandedUserDetails, setExpandedUserDetails] = useState(null);
    const [userConsultas, setUserConsultas] = useState([]);
    const [userDoctors, setUserDoctors] = useState([]);

    const [userConsultasError, setUserConsultasError] = useState('');
    const [specialtiesForFilter, setSpecialtiesForFilter] = useState([]);
    const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('');

    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserGoogleId, setNewUserGoogleId] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');

    useEffect(() => {
        fetchUsers();
        fetchSpecialtiesForFilter();
    }, [token]);

    /**
     * @brief Busca a lista de todos os utilizadores do backend.
     * @param {void}
     * @returns {void}
     */
    const fetchUsers = () => {
        setLoading(true);
        api.get('/users', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setUsers(res.data);
                setLoading(false);
                setError('');
            })
            .catch((err) => {
                console.error("Erro ao carregar utilizadores:", err);
                setError('Erro ao carregar utilizadores. ' + (err.response?.data?.error || ''));
                setLoading(false);
            });
    };

    /**
     * @brief Busca a lista de especialidades para o filtro de consultas.
     * @param {void}
     * @returns {void}
     */
    const fetchSpecialtiesForFilter = () => {
        api.get('/specialties', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setSpecialtiesForFilter(res.data))
            .catch(err => console.error('Erro ao carregar especialidades para filtro:', err));
    };

    /**
     * @brief Busca os detalhes de um utilizador específico, suas consultas e médicos consultados.
     * @param {string} userId - O ID do utilizador cujos detalhes serão buscados.
     * @returns {Promise<void>}
     */
    const fetchUserDetails = async (userId) => {
        setUserConsultas([]);
        setUserDoctors([]);
        setUserConsultasError('');

        try {
            const userDetailsResponse = await api.get(`/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedUserDetail = userDetailsResponse.data;
            setExpandedUserDetails(fetchedUserDetail);

            const appointmentsResponse = await api.get(`/users/${userId}/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const formattedConsultas = appointmentsResponse.data.map(c => {
                // Combina c.date e c.time para criar um objeto Date válido.
                // Assumindo que c.date é 'YYYY-MM-DD' e c.time é 'HH:MM:SS'
                const dateTimeString = `${c.date}T${c.time}`;
                const dateObj = new Date(dateTimeString);
                const dataDisplay = isNaN(dateObj.getTime()) ? 'Data Inválida' : dateObj.toLocaleString('pt-PT', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });

                return {
                    ...c,
                    dataDisplay,
                    medicoName: c.medico?.name || 'Médico Desconhecido',
                    specialtyName: c.medico?.specialty?.name || 'Especialidade Desconhecida'
                };
            });
            setUserConsultas(formattedConsultas);

            const doctorsResponse = await api.get(`/users/${userId}/doctors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserDoctors(doctorsResponse.data || []);

            setSelectedSpecialtyFilter('');

        } catch (err) {
            console.error(`Erro ao carregar detalhes para o usuário ${userId}:`, err);
            setUserConsultasError('Erro ao carregar detalhes do utilizador. ' + (err.response?.data?.error || ''));
            setExpandedUserDetails(null);
        }
    };

    /**
     * @brief Alterna a exibição dos detalhes de um utilizador (expande/colapsa).
     * @param {string} userId - O ID do utilizador a expandir/colapsar.
     * @returns {Promise<void>}
     */
    const handleExpandUser = async (userId) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
            setExpandedUserDetails(null);
            setUserConsultas([]);
            setUserDoctors([]);
            setSelectedSpecialtyFilter('');
        } else {
            setExpandedUserId(userId);
            await fetchUserDetails(userId);
        }
    };

    /**
     * @brief Inicia o modo de edição para um utilizador.
     * @param {object} userToEdit - O objeto utilizador a ser editado.
     * @returns {void}
     */
    const startEdit = (userToEdit) => {
        setEditUserId(userToEdit.id);
        setEditName(userToEdit.name);
    };

    /**
     * @brief Salva as edições de um utilizador no backend.
     * @param {string} userId - O ID do utilizador a ser salvo.
     * @returns {Promise<void>}
     */
    const handleSaveEdit = async (userId) => {
        try {
            const payload = {
                name: editName,
            };

            await api.put(`/users/${userId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Utilizador atualizado com sucesso!', 'success');
            setEditUserId(null);
            fetchUsers();

            if (expandedUserId === userId) {
                await fetchUserDetails(userId);
            }
        } catch (err) {
            showMessage(err.response?.data?.error || 'Erro ao atualizar utilizador.', 'error');
        }
    };

    /**
     * @brief Elimina um utilizador do backend após confirmação.
     * @param {string} userId - O ID do utilizador a ser eliminado.
     * @returns {Promise<void>}
     */
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Tem certeza que deseja eliminar este utilizador?')) {
            return;
        }
        try {
            await api.delete(`/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Utilizador eliminado com sucesso!', 'success');
            fetchUsers();
            if (expandedUserId === userId) {
                setExpandedUserId(null);
                setExpandedUserDetails(null);
            }
        } catch (err) {
            showMessage(err.response?.data?.error || 'Erro ao eliminar utilizador.', 'error');
        }
    };

    /**
     * @brief Adiciona um novo utilizador ao backend.
     * @param {Event} e - O evento de submissão do formulário.
     * @returns {Promise<void>}
     */
    const handleAddUser = async (e) => {
        e.preventDefault();

        if (!newUserName || !newUserEmail || !newUserRole) {
            showMessage('Por favor, preencha todos os campos obrigatórios (Nome, Email, Perfil).', 'error');
            return;
        }

        try {
            const payload = {
                name: newUserName,
                email: newUserEmail,
                role: newUserRole,
                google_id: newUserGoogleId || null
            };

            await api.post('/users', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Utilizador adicionado com sucesso!', 'success');
            setNewUserName('');
            setNewUserEmail('');
            setNewUserGoogleId('');
            setNewUserRole('user');
            fetchUsers();
        } catch (err) {
            showMessage(err.response?.data?.error || 'Erro ao adicionar utilizador.', 'error');
        }
    };

    /**
     * @brief Filtra as consultas do utilizador expandido por especialidade.
     * @param {string} specialtyId - O ID da especialidade para filtrar (ou vazio para todas).
     * @returns {Promise<void>}
     */
    const handleFilterConsultasBySpecialty = async (specialtyId) => {
        setSelectedSpecialtyFilter(specialtyId);
        if (expandedUserId) {
            try {
                let url = `/users/${expandedUserId}/appointments`;
                if (specialtyId) {
                    url = `/users/${expandedUserId}/specialties/${specialtyId}/appointments`;
                }

                const filteredAppointmentsResponse = await api.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const formattedFilteredConsultas = filteredAppointmentsResponse.data.map(c => {
                    const dateTimeString = `${c.date}T${c.time}`;
                    const dateObj = new Date(dateTimeString);
                    const dataDisplay = isNaN(dateObj.getTime()) ? 'Data Inválida' : dateObj.toLocaleString('pt-PT', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', hour12: false
                    });
                    return {
                        ...c,
                        dataDisplay,
                        medicoName: c.medico?.name || 'Médico Desconhecido',
                        specialtyName: c.medico?.specialty?.name || 'Especialidade Desconhecida'
                    };
                });
                setUserConsultas(formattedFilteredConsultas);
            } catch (err) {
                console.error('Erro ao filtrar consultas por especialidade:', err);
                setUserConsultasError('Erro ao filtrar consultas por especialidade. ' + (err.response?.data?.error || ''));
            }
        }
        if (!specialtyId && expandedUserId) {
            await fetchUserDetails(expandedUserId);
        }
    };

    if (loading) return <div className="list-container"><div className="loading-message">A carregar utilizadores...</div></div>;
    if (error) return <div className="list-container"><div className="error-message">{error}</div></div>;

    return (
        <div className="list-container">
            <h2 className="list-title">Gestão de Utilizadores</h2>

            {user?.role === 'admin' && (
                <form onSubmit={handleAddUser} className="form-container" style={{ marginBottom: '20px' }}>
                    <h3 className="form-section-title">Adicionar Novo Utilizador</h3>
                    <p className="form-info-text">Preencha os campos para adicionar um novo utilizador.</p>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Nome"
                            value={newUserName}
                            onChange={e => setNewUserName(e.target.value)}
                            className="form-input"
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={newUserEmail}
                            onChange={e => setNewUserEmail(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Google ID"
                            value={newUserGoogleId}
                            onChange={e => setNewUserGoogleId(e.target.value)}
                            className="form-input"
                        />
                        <select
                            value={newUserRole}
                            onChange={e => setNewUserRole(e.target.value)}
                            className="form-input"
                            required
                        >
                            <option value="user">Utilizador</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button type="submit" className="action-button add">
                        <PlusCircle size={18} /> Adicionar
                    </button>
                </form>
            )}

            <div className="card-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <React.Fragment key={u.id}>
                                <tr>
                                    <td>{u.id}</td>
                                    <td>
                                        {editUserId === u.id ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="form-input small"
                                            />
                                        ) : u.name}
                                    </td>
                                    <td>
                                        {editUserId === u.id ? (
                                            <>
                                                <button onClick={() => handleSaveEdit(u.id)} className="action-button save" title="Guardar">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={() => setEditUserId(null)} className="action-button cancel" title="Cancelar">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(u)} className="action-button edit" title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="action-button delete" title="Eliminar">
                                                    <Trash2 size={18} />
                                                </button>
                                                <button onClick={() => handleExpandUser(u.id)} className="action-button view" title="Ver Detalhes">
                                                    <Eye size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                {expandedUserId === u.id && expandedUserDetails && (
                                    <tr>
                                        <td colSpan="3"> {/* Ajustado colSpan para 3 colunas */}
                                            <div className="user-details-expanded-area">
                                                <h4>Detalhes para {expandedUserDetails.name}</h4>
                                                <p><strong>Email:</strong> {expandedUserDetails.email || 'N/A'}</p>
                                                <p><strong>Perfil:</strong> {expandedUserDetails.role || 'N/A'}</p>
                                                {userConsultasError && <div className="error-message">{userConsultasError}</div>}
                                                <div className="user-details-cards-grid">
                                                    <div className="card">
                                                        <h5 className="card-title">Médicos consultados:</h5>
                                                        {userDoctors.length > 0 ? (
                                                            <div className="doctor-tags">
                                                                {userDoctors.map(doc => (
                                                                    // AQUI ESTÁ A MUDANÇA: Usando 'doctor-tag' para estilizar
                                                                    <span key={doc.id} className="doctor-tag">{doc.name}</span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="card-text">Nenhum médico consultado.</p>
                                                        )}
                                                    </div>

                                                    <div className="card">
                                                        <h5 className="card-title">Consultas do Utilizador:</h5>
                                                        <select
                                                            value={selectedSpecialtyFilter}
                                                            onChange={e => handleFilterConsultasBySpecialty(e.target.value)}
                                                            className="form-input small"
                                                            style={{ marginBottom: '10px' }}
                                                        >
                                                            <option value="">Todas as Especialidades</option>
                                                            {specialtiesForFilter.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                        {userConsultas.length > 0 ? (
                                                            <ul className="consultas-list-small">
                                                                {userConsultas.map(c => (
                                                                    <li key={c.id} className="card-text small-text">
                                                                        {c.dataDisplay} - {c.medicoName} ({c.specialtyName}) - Notas: {c.notes || 'N/A'}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="card-text">Nenhuma consulta encontrada para este utilizador (ou filtro).</p>
                                                        )}
                                                    </div>
                                                </div>
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