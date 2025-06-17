import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Save, X, Eye, PlusCircle } from 'lucide-react'; // Added PlusCircle
import './components.css';
import api from '../api/api';

// Recebe `token` como prop do App.js
function EspecialidadesList({ user, showMessage, token }) {
    const [specialties, setSpecialties] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [error, setError] = useState(''); // Changed from 'erro' to 'error' for consistency
    const [loading, setLoading] = useState(true);

    // Estados para adicionar/editar
    const [newName, setNewName] = useState('');
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchSpecialties();
        // eslint-disable-next-line
    }, [token]); // Adiciona token como dependência

    const fetchSpecialties = () => {
        setLoading(true);
        // Usa o token recebido via props
        api.get('/specialties', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
                setSpecialties(sorted);
                setLoading(false);
                setError('');
            })
            .catch(() => {
                setError('Erro ao carregar especialidades');
                setLoading(false);
            });
    };

    // Consulta médicos da especialidade
    const fetchDoctors = (id) => {
        setDoctors([]);
        setError(''); // Limpa o erro anterior antes de uma nova busca
        // Usa o token recebido via props
        api.get(`/specialties/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setDoctors(res.data.doctors || []);
            })
            .catch((err) => {
                console.error("Erro ao carregar médicos da especialidade:", err);
                setError('Erro ao carregar médicos desta especialidade.');
            });
    };

    // Adicionar especialidade
    const handleAdd = (e) => {
        e.preventDefault();
        if (!newName.trim()) {
            showMessage && showMessage('Nome da especialidade não pode ser vazio.', 'warning');
            return;
        }
        // Usa o token recebido via props
        api.post('/specialties', { name: newName }, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => {
                setNewName('');
                fetchSpecialties();
                showMessage && showMessage('Especialidade adicionada!', 'success');
            })
            .catch(err => {
                showMessage && showMessage(err.response?.data?.error || 'Erro ao adicionar especialidade.', 'error');
            });
    };

    // Editar especialidade
    const handleSaveEdit = (e) => { // Renamed from handleEdit to handleSaveEdit for consistency
        e.preventDefault(); // Prevent default form submission if it's a form
        if (!editName.trim()) {
            showMessage && showMessage('Nome da especialidade não pode ser vazio.', 'warning');
            return;
        }
        // Usa o token recebido via props
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
                showMessage && showMessage(err.response?.data?.error || 'Erro ao atualizar especialidade.', 'error');
            });
    };

    // Eliminar especialidade
    const handleDelete = (id) => {
        if (!window.confirm('Tem certeza que deseja eliminar esta especialidade?')) return;
        // Usa o token recebido via props
        api.delete(`/specialties/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => {
                fetchSpecialties();
                showMessage && showMessage('Especialidade eliminada!', 'success');
                if (expandedId === id) { // Close expanded section if deleted
                    setExpandedId(null);
                    setDoctors([]);
                }
            })
            .catch(err => {
                showMessage && showMessage(err.response?.data?.error || 'Erro ao eliminar especialidade.', 'error');
            });
    };

    // Expand/collapse especialidade
    const handleExpand = (id) => {
        if (expandedId === id) {
            setExpandedId(null);
            setDoctors([]);
            setError(''); // Limpa o erro ao fechar
        } else {
            setExpandedId(id);
            fetchDoctors(id);
        }
    };

    // Function to start editing
    const startEdit = (specialtyToEdit) => {
        setEditId(specialtyToEdit.id);
        setEditName(specialtyToEdit.name);
    };


    if (loading) return <div className="list-container"><div className="loading-message">A carregar especialidades...</div></div>;
    if (error && !specialties.length) return <div className="list-container"><div className="error-message">{error}</div></div>;


    return (
        <div className="list-container">
            <h2 className="list-title">Gestão de Especialidades</h2>

            {/* Formulário para adicionar (apenas admin) */}
            {user?.role === 'admin' && (
                <form onSubmit={handleAdd} className="form-container" style={{ marginBottom: '20px' }}>
                    <h3 className="form-section-title">Adicionar Nova Especialidade</h3>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Nome da Especialidade"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                    <button type="submit" className="action-button add">
                        <PlusCircle size={18} /> Adicionar
                    </button>
                </form>
            )}

            {error && specialties.length > 0 && <div className="error-message">{error}</div>} {/* Show error if there's data but also an error */}

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
                        {specialties.map(spec => (
                            <React.Fragment key={spec.id}>
                                <tr>
                                    <td>{spec.id}</td>
                                    <td>
                                        {editId === spec.id ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="form-input small"
                                            />
                                        ) : spec.name}
                                    </td>
                                    <td>
                                        {editId === spec.id ? (
                                            <>
                                                <button onClick={handleSaveEdit} className="action-button save" title="Guardar">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={() => setEditId(null)} className="action-button cancel" title="Cancelar">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <button onClick={() => startEdit(spec)} className="action-button edit" title="Editar">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(spec.id)} className="action-button delete" title="Eliminar">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handleExpand(spec.id)} className="action-button view" title="Ver Médicos">
                                                    <Eye size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                {expandedId === spec.id && (
                                    <tr>
                                        <td colSpan="3"> {/* span all 3 columns */}
                                            <div className="medico-details-expanded-area"> {/* Re-using this class as it's general for expanded details */}
                                                <h4>Médicos nesta especialidade:</h4>
                                                {error && <div className="error-message">{error}</div>} {/* Show error specific to doctors fetch */}
                                                {doctors.length > 0 ? (
                                                    <ul className="consultas-list-small"> {/* Re-using this style for a scrollable list */}
                                                        {doctors.map(doc => (
                                                            <li key={doc.id} className="card-text small-text">
                                                                {doc.name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="card-text">Nenhum médico associado a esta especialidade.</p>
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

export default EspecialidadesList;