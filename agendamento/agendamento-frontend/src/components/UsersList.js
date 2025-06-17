import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Save, X, Eye, PlusCircle } from 'lucide-react';
import './components.css';
import api from '../api/api';

const generateUUID = () => crypto.randomUUID();

function UsersList({ user, token, showMessage }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [editUserId, setEditUserId] = useState(null);
    const [editUserName, setEditUserName] = useState('');
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editUserRole, setEditUserRole] = useState('');

    const [expandedUserId, setExpandedUserId] = useState(null);
    const [expandedUserDetails, setExpandedUserDetails] = useState(null);
    
    const [allUserConsultas, setAllUserConsultas] = useState([]);
    const [filteredUserConsultas, setFilteredUserConsultas] = useState([]);
    
    const [userDoctors, setUserDoctors] = useState([]);

    const [userConsultasError, setUserConsultasError] = useState('');
    const [specialtiesForFilter, setSpecialtiesForFilter] = useState([]);
    const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('');

    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    //const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');


    useEffect(() => {
        fetchUsers();
        fetchSpecialtiesForFilter();
        // eslint-disable-next-line
    }, [token]);

    useEffect(() => {
        if (selectedSpecialtyFilter && allUserConsultas.length > 0) {
            const filtered = allUserConsultas.filter(consulta =>
                consulta.medico?.specialty?.id === parseInt(selectedSpecialtyFilter)
            );
            setFilteredUserConsultas(filtered);
        } else {
            setFilteredUserConsultas(allUserConsultas);
        }
    }, [selectedSpecialtyFilter, allUserConsultas]);


    /**
     * @brief Procura a lista de todos os utilizadores do backend.
     * Assume que esta rota ( /users ) não traz email e role.
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
     * @brief Procura os detalhes completos de um utilizador específico.
     * Essencial para obter email e role se /users não os retornar.
     * @param {string} userId - O ID do utilizador cujos detalhes serão Procurados.
     * @returns {Promise<object|null>} Os detalhes do utilizador ou null em caso de erro.
     */
    const fetchUserDetails = async (userId) => {
        try {
            const response = await api.get(`/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (err) {
            console.error(`Erro ao carregar detalhes do utilizador ${userId}:`, err);
            showMessage('Erro ao carregar detalhes do utilizador.', 'error');
            return null;
        }
    };

    /**
     * @brief Procura a lista de especialidades para o filtro de consultas.
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
     * @brief Procura as consultas de um utilizador específico.
     * Separado para ser chamado por handleExpandUser.
     * Inclui dados do médico e especialidade para o filtro.
     * @param {string} userId - O ID do utilizador cujas consultas serão Procuradas.
     * @returns {Promise<void>}
     */
    const fetchUserAppointments = async (userId) => {
        setAllUserConsultas([]);
        setUserConsultasError('');
        try {
            const response = await api.get(`/users/${userId}/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const formattedConsultas = response.data.map(c => {
                const dateTimeString = `${c.date}T${c.time}`;
                const dateObj = new Date(dateTimeString);
                const dataDisplay = isNaN(dateObj.getTime()) ? 'Data Inválida' : dateObj.toLocaleString('pt-PT', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });

                return {
                    ...c,
                    dataDisplay,
                    pacienteName: c.paciente?.name || 'Paciente Desconhecido',
                    medicoName: c.medico?.name || 'Médico Desconhecido',
                    specialtyName: c.medico?.specialty?.name || 'Especialidade Desconhecida',
                    specialtyId: c.medico?.specialty?.id
                };
            });
            setAllUserConsultas(formattedConsultas);
        } catch (err) {
            console.error(`Erro ao carregar consultas para o utilizador ${userId}:`, err);
            setUserConsultasError('Erro ao carregar consultas do utilizador. ' + (err.response?.data?.error || ''));
        }
    };

    /**
     * @brief Procura os médicos consultados por um utilizador específico.
     * @param {string} userId - O ID do utilizador cujos médicos serão Procurados.
     * @returns {Promise<void>}
     */
    const fetchUserDoctors = async (userId) => {
        setUserDoctors([]);
        try {
            const doctorsResponse = await api.get(`/users/${userId}/doctors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserDoctors(doctorsResponse.data || []);
        } catch (err) {
            console.error(`Erro ao carregar médicos para o utilizador ${userId}:`, err);
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
            setAllUserConsultas([]);
            setFilteredUserConsultas([]);
            setUserDoctors([]);
            setSelectedSpecialtyFilter('');
        } else {
            setExpandedUserId(userId);
            setSelectedSpecialtyFilter('');
            
            const details = await fetchUserDetails(userId);
            if (details) {
                setExpandedUserDetails(details);
            }
            
            await fetchUserAppointments(userId);
            await fetchUserDoctors(userId);
        }
    };

    /**
     * @brief Inicia o modo de edição para um utilizador.
     * @param {object} userToEdit - O objeto utilizador a ser editado.
     * @returns {void}
     */
    const startEdit = (userToEdit) => {
        setEditUserId(userToEdit.id);
        setEditUserName(userToEdit.name);
        fetchUserDetails(userToEdit.id).then(details => {
            if (details) {
                setEditUserEmail(details.email);
                setEditUserRole(details.role);
            }
        });
    };

    /**
     * @brief Salva as edições de um utilizador no backend.
     * @param {string} userId - O ID do utilizador a ser salvo.
     * @returns {Promise<void>}
     */
    const handleSaveEdit = async (userId) => {
        try {
            const payload = {
                name: editUserName,
                email: editUserEmail,
                role: editUserRole
            };

            await api.put(`/users/${userId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Utilizador atualizado com sucesso!', 'success');
            setEditUserId(null);
            fetchUsers();
            if (expandedUserId === userId) {
                const details = await fetchUserDetails(userId);
                if (details) {
                    setExpandedUserDetails(details);
                }
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
                setAllUserConsultas([]);
                setFilteredUserConsultas([]);
                setUserDoctors([]);
                setSelectedSpecialtyFilter('');
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
            const generatedGoogleId = generateUUID(); // Gerar um UUID para googleId

            const payload = {
                name: newUserName,
                email: newUserEmail,
                //password: newUserPassword,
                role: newUserRole,
                google_id: generatedGoogleId // Envia o UUID gerado
            };

            await api.post('/users', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Utilizador adicionado com sucesso!', 'success');
            setNewUserName('');
            setNewUserEmail('');
            //setNewUserPassword('');
            setNewUserRole('patient');
            // Não precisamos limpar newUserGoogleId, pois ele não é um estado gerido pelo usuário
            fetchUsers();
        } catch (err) {
            showMessage(err.response?.data?.error || 'Erro ao adicionar utilizador.', 'error');
        }
    };

    /**
     * @brief Atualiza o filtro de especialidade. O filtro será aplicado automaticamente pelo useEffect.
     * @param {Event} e - O evento de mudança do select.
     * @returns {void}
     */
    const handleSpecialtyFilterChange = (e) => {
        setSelectedSpecialtyFilter(e.target.value);
    };

    if (loading) return <div className="list-container"><div className="loading-message">A carregar utilizadores...</div></div>;
    if (error && !users.length) return <div className="list-container"><div className="error-message">{error}</div></div>;

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
                        <select
                            value={newUserRole}
                            onChange={e => setNewUserRole(e.target.value)}
                            className="form-input"
                            required
                        >
                            <option value="patient">Paciente</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button type="submit" className="action-button add">
                        <PlusCircle size={18} /> Adicionar
                    </button>
                </form>
            )}

            {error && users.length > 0 && <div className="error-message">{error}</div>}

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
                                                value={editUserName}
                                                onChange={e => setEditUserName(e.target.value)}
                                                className="form-input small"
                                            />
                                        ) : u.name}
                                    </td>
                                    <td>
                                        {editUserId === u.id ? (
                                            <>
                                                <div className="edit-user-details" style={{display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px'}}>
                                                    <input
                                                        type="email"
                                                        value={editUserEmail}
                                                        onChange={e => setEditUserEmail(e.target.value)}
                                                        className="form-input small"
                                                        placeholder="Email"
                                                    />
                                                    <select
                                                        value={editUserRole}
                                                        onChange={e => setEditUserRole(e.target.value)}
                                                        className="form-input small"
                                                    >
                                                        <option value="patient">Paciente</option>
                                                        <option value="admin">Administrador</option>
                                                    </select>
                                                </div>
                                                <button onClick={() => handleSaveEdit(u.id)} className="action-button save" title="Guardar">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={() => setEditUserId(null)} className="action-button cancel" title="Cancelar">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <button onClick={() => startEdit(u)} className="action-button edit" title="Editar">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u.id)} className="action-button delete" title="Eliminar">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handleExpandUser(u.id)} className="action-button view" title="Ver Detalhes">
                                                    <Eye size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                {expandedUserId === u.id && (
                                    <tr>
                                        <td colSpan="3">
                                            <div className="user-details-expanded-area">
                                                <h4>Detalhes para {expandedUserDetails?.name || u.name}</h4>
                                                <p><strong>Email:</strong> {expandedUserDetails?.email || 'N/A'}</p>
                                                <p><strong>Perfil:</strong> {expandedUserDetails?.role || 'N/A'}</p>

                                                {userConsultasError && <div className="error-message">{userConsultasError}</div>}
                                                <div className="user-details-cards-grid">
                                                    <div className="card">
                                                        <h5 className="card-title">Médicos consultados:</h5>
                                                        {userDoctors.length > 0 ? (
                                                            <div className="doctor-tags">
                                                                {userDoctors.map(doc => (
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
                                                            onChange={handleSpecialtyFilterChange}
                                                            className="form-input small"
                                                            style={{ marginBottom: '10px' }}
                                                        >
                                                            <option value="">Todas as Especialidades</option>
                                                            {specialtiesForFilter.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                        {filteredUserConsultas.length > 0 ? (
                                                            <ul className="consultas-list-small">
                                                                {filteredUserConsultas.map(c => (
                                                                    <li key={c.id} className="card-text small-text">
                                                                        {c.dataDisplay} - {c.medicoName} ({c.specialtyName || 'N/A'}) - Notas: {c.notes || 'N/A'}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="card-text">Nenhuma consulta encontrada para este utilizador {selectedSpecialtyFilter ? `na especialidade selecionada` : ''}.</p>
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