import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Save, X, Eye } from 'lucide-react'; // Certifique-se que Save e X estão importados!
import './components.css';
import api from '../api/api';

// Recebe `token` como prop do App.js
function EspecialidadesList({ user, showMessage, token }) {
    const [specialties, setSpecialties] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [erro, setErro] = useState('');
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
                setErro('');
            })
            .catch(() => {
                setErro('Erro ao carregar especialidades');
                setLoading(false);
            });
    };

    // Consulta médicos da especialidade
    const fetchDoctors = (id) => {
        setDoctors([]);
        setErro('');
        // Usa o token recebido via props
        api.get(`/specialties/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setDoctors(res.data.doctors || []);
            })
            .catch((err) => {
                console.error("Erro ao carregar médicos da especialidade:", err);
                setErro('Erro ao carregar médicos desta especialidade.');
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
    const handleEdit = (e) => {
        e.preventDefault();
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
            setErro(''); // Limpa o erro ao fechar
        } else {
            setExpandedId(id);
            fetchDoctors(id);
        }
    };

    if (loading) return <div className="especialidades-container"><div className="especialidades-card">A carregar especialidades...</div></div>;

    return (
        <div className="especialidades-container">
            <div className="especialidades-card">
                <h2>Especialidades</h2>

                {/* Formulário para adicionar (apenas admin) */}
                {user?.role === 'admin' && (
                    <form onSubmit={handleAdd} className="especialidade-form">
                        <input
                            type="text"
                            placeholder="Nova especialidade"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="especialidade-input"
                        />
                        <button type="submit" className="especialidade-btn add">Adicionar</button>
                    </form>
                )}

                {erro && <div className="error-message">{erro}</div>}

                <ul className="especialidades-list">
                    {specialties.map(spec => (
                        <li key={spec.id} className="especialidade-item"> {/* Alterado de especialidade-link-item para especialidade-item */}
                            <div className="especialidade-header" onClick={() => handleExpand(spec.id)}> {/* Envolve o nome e o ícone de expandir/contrair */}
                                <button
                                    className="especialidade-link"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#1976d2',
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        fontSize: '1.1rem',
                                        padding: 0,
                                        marginBottom: 4
                                    }}
                                >
                                    {spec.name}
                                </button>
                                {/* Opcional: Adicione um ícone para indicar expandir/contrair */}
                                {expandedId === spec.id ? <X size={20} /> : <Eye size={20} />}
                            </div>

                            {expandedId === spec.id && (
                                <div className="especialidade-details"> {/* Classe já existente e bem definida */}
                                    {editId === spec.id ? (
                                        // Modo de Edição
                                        <form onSubmit={handleEdit} className="especialidade-edit-form"> {/* Use especialidade-edit-form aqui */}
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="especialidade-input"
                                            />
                                            <button type="submit" className="especialidade-btn save" title="Guardar">
                                                <Save size={18} /> {/* Ícone para Guardar */}
                                            </button>
                                            <button type="button" className="especialidade-btn cancel" onClick={() => setEditId(null)} title="Cancelar">
                                                <X size={18} /> {/* Ícone para Cancelar */}
                                            </button>
                                        </form>
                                    ) : (
                                        // Modo de Visualização (dentro da área expandida)
                                        <>
                                            {user?.role === 'admin' && (
                                                <div className="especialidade-actions-row"> {/* Div para alinhar os botões de ação */}
                                                    <button
                                                        className="especialidade-btn edit"
                                                        onClick={() => { setEditId(spec.id); setEditName(spec.name); }}
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} /> {/* Ícone de Lápis */}
                                                    </button>
                                                    <button
                                                        className="especialidade-btn delete"
                                                        onClick={() => handleDelete(spec.id)}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} /> {/* Ícone de Lixo */}
                                                    </button>
                                                </div>
                                            )}
                                            <div style={{ marginTop: 10 }}> {/* Este div pode ser estilizado no CSS */}
                                                <strong>Médicos desta especialidade:</strong>
                                                {doctors.length === 0 ? (
                                                    erro ? <div className="error-message">{erro}</div> : <div className="sem-medicos">Sem médicos associados.</div>
                                                ) : (
                                                    <ul className="doctors-list-inline"> {/* Use a classe existente para médicos inline */}
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