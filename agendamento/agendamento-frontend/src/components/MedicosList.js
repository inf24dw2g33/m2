import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Save, X, Eye, PlusCircle } from 'lucide-react';
import './components.css'; // Supondo que você tem estilos em components.css
import api from '../api/api';

function MedicosList({ user, token, showMessage }) { // Certifique-se de passar user e token
    const [medicos, setMedicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para edição de médico
    const [editMedicoId, setEditMedicoId] = useState(null);
    const [editMedicoName, setEditMedicoName] = useState('');
    const [editMedicoSpecialty, setEditMedicoSpecialty] = useState('');
    const [specialties, setSpecialties] = useState([]); // Para o dropdown de especialidades

    // Estados para o formulário de adição de novo médico
    const [newMedicoName, setNewMedicoName] = useState('');
    const [newMedicoSpecialty, setNewMedicoSpecialty] = useState('');

    // Novos estados para a expansão e consultas do médico
    const [expandedMedicoId, setExpandedMedicoId] = useState(null);
    const [medicoConsultas, setMedicoConsultas] = useState([]);
    const [medicoConsultasError, setMedicoConsultasError] = useState('');

    useEffect(() => {
        fetchMedicos();
        fetchSpecialties();
        // eslint-disable-next-line
    }, [token]);

    const fetchMedicos = () => {
        setLoading(true);
        api.get('/doctors', { // Assumindo que este é o endpoint para listar médicos
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setMedicos(res.data);
                setLoading(false);
                setError('');
            })
            .catch((err) => {
                console.error("Erro ao carregar médicos:", err);
                setError('Erro ao carregar médicos. ' + (err.response?.data?.error || ''));
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

    // --- Nova função para buscar consultas de um médico específico ---
    const fetchMedicoAppointments = async (medicoId) => {
        setMedicoConsultas([]);
        setMedicoConsultasError('');
        try {
            // A sua rota de backend é: router.get('/:id/appointments'
            // Então, a URL para o frontend seria: /doctors/:id/appointments
            const response = await api.get(`/doctors/${medicoId}/appointments`, {
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
                    medicoName: c.medico?.name || 'Médico Desconhecido', // Já está no contexto, mas bom ter
                    specialtyName: c.medico?.c.specialty?.name || 'Especialidade Desconhecida'
                };
            });
            setMedicoConsultas(formattedConsultas);
        } catch (err) {
            console.error(`Erro ao carregar consultas para o médico ${medicoId}:`, err);
            setMedicoConsultasError('Erro ao carregar consultas do médico. ' + (err.response?.data?.error || ''));
        }
    };

    // --- Nova função para expandir/colapsar os detalhes do médico ---
    const handleExpandMedico = async (medicoId) => {
        if (expandedMedicoId === medicoId) {
            setExpandedMedicoId(null); // Colapsa
            setMedicoConsultas([]); // Limpa as consultas ao colapsar
        } else {
            setExpandedMedicoId(medicoId); // Expande
            await fetchMedicoAppointments(medicoId); // Carrega as consultas
        }
    };

    // ... (funções startEdit, handleSaveEdit, handleDeleteMedico, handleAddMedico - manter as suas existentes)

    // Apenas um exemplo de startEdit, adapte conforme seu MedicosList original
    const startEdit = (medicoToEdit) => {
        setEditMedicoId(medicoToEdit.id);
        setEditMedicoName(medicoToEdit.name);
        setEditMedicoSpecialty(medicoToEdit.specialty_id || ''); // Assumindo que o ID da especialidade vem no médico
    };

    const handleSaveEdit = async (medicoId) => {
        try {
            const payload = {
                name: editMedicoName,
                specialty_id: editMedicoSpecialty // Envie o ID da especialidade
            };

            await api.put(`/doctors/${medicoId}`, payload, { // Assumindo este endpoint
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Médico atualizado com sucesso!', 'success');
            setEditMedicoId(null);
            fetchMedicos();
        } catch (err) {
            showMessage(err.response?.data?.error || 'Erro ao atualizar médico.', 'error');
        }
    };

    const handleDeleteMedico = async (medicoId) => {
        if (!window.confirm('Tem certeza que deseja eliminar este médico?')) return;
        try {
            await api.delete(`/doctors/${medicoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Médico eliminado com sucesso!', 'success');
            fetchMedicos();
            if (expandedMedicoId === medicoId) {
                setExpandedMedicoId(null); // Fecha se o médico expandido for apagado
            }
        } catch (err) {
            showMessage(err.response?.data?.error || 'Erro ao eliminar médico.', 'error');
        }
    };

    const handleAddMedico = async (e) => {
        e.preventDefault();
        if (!newMedicoName || !newMedicoSpecialty) {
            showMessage('Por favor, preencha o nome e selecione uma especialidade para o novo médico.', 'error');
            return;
        }
        try {
            const payload = {
                name: newMedicoName,
                specialty_id: newMedicoSpecialty
            };
            await api.post('/doctors', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Médico adicionado com sucesso!', 'success');
            setNewMedicoName('');
            setNewMedicoSpecialty('');
            fetchMedicos();
        } catch (err) {
            showMessage(err.response?.data?.error || 'Erro ao adicionar médico.', 'error');
        }
    };

    if (loading) return <div className="list-container"><div className="loading-message">A carregar médicos...</div></div>;
    if (error) return <div className="list-container"><div className="error-message">{error}</div></div>;

    return (
        <div className="list-container">
            <h2 className="list-title">Gestão de Médicos</h2>

            {user?.role === 'admin' && (
                <form onSubmit={handleAddMedico} className="form-container" style={{ marginBottom: '20px' }}>
                    <h3 className="form-section-title">Adicionar Novo Médico</h3>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Nome do Médico"
                            value={newMedicoName}
                            onChange={e => setNewMedicoName(e.target.value)}
                            className="form-input"
                            required
                        />
                        <select
                            value={newMedicoSpecialty}
                            onChange={e => setNewMedicoSpecialty(e.target.value)}
                            className="form-input"
                            required
                        >
                            <option value="">Selecione a Especialidade</option>
                            {specialties.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
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
                            <th>Especialidade</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medicos.map(m => (
                            <React.Fragment key={m.id}>
                                <tr>
                                    <td>{m.id}</td>
                                    <td>
                                        {editMedicoId === m.id ? (
                                            <input
                                                type="text"
                                                value={editMedicoName}
                                                onChange={e => setEditMedicoName(e.target.value)}
                                                className="form-input small"
                                            />
                                        ) : m.name}
                                    </td>
                                    <td>
                                        {editMedicoId === m.id ? (
                                            <select
                                                value={editMedicoSpecialty}
                                                onChange={e => setEditMedicoSpecialty(e.target.value)}
                                                className="form-input small"
                                            >
                                                <option value="">Selecione</option>
                                                {specialties.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        ) : (m.Specialty ? m.Specialty.name : 'N/A')} {/* Acessa a especialidade associada */}
                                    </td>
                                    <td>
                                        {editMedicoId === m.id ? (
                                            <>
                                                <button onClick={() => handleSaveEdit(m.id)} className="action-button save" title="Guardar">
                                                    <Save size={18} />
                                                </button>
                                                <button onClick={() => setEditMedicoId(null)} className="action-button cancel" title="Cancelar">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(m)} className="action-button edit" title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteMedico(m.id)} className="action-button delete" title="Eliminar">
                                                    <Trash2 size={18} />
                                                </button>
                                                <button onClick={() => handleExpandMedico(m.id)} className="action-button view" title="Ver Consultas">
                                                    <Eye size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                {expandedMedicoId === m.id && (
                                    <tr>
                                        <td colSpan="4">
                                            <div className="medico-details-expanded-area">
                                                <h4>Consultas para o {m.name}</h4>
                                                {medicoConsultasError && <div className="error-message">{medicoConsultasError}</div>}
                                                {medicoConsultas.length > 0 ? (
                                                    <ul className="consultas-list-small">
                                                        {medicoConsultas.map(c => (
                                                            <li key={c.id} className="card-text small-text">
                                                                {c.dataDisplay} - Paciente: {c.pacienteName} - Notas: {c.notes || 'N/A'}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="card-text">Nenhuma consulta encontrada para este médico.</p>
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

export default MedicosList;