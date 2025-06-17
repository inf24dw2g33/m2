import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Save, X, PlusCircle } from 'lucide-react';
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

    const [newData, setNewData] = useState('');
    const [newDescricao, setNewDescricao] = useState('');
    const [newMedico, setNewMedico] = useState('');
    const [newEspecialidade, setNewEspecialidade] = useState('');
    const [newPaciente, setNewPaciente] = useState('');

    const [filterEspecialidade, setFilterEspecialidade] = useState('');
    const [filterMedico, setFilterMedico] = useState('');

    useEffect(() => {
        fetchConsultas();
        fetchMedicos();
        fetchEspecialidades();
        fetchPacientes();
    }, [token, filterEspecialidade, filterMedico]);

    const fetchConsultas = () => {
        setLoading(true);
        setErro('');
        let url = '/appointments';
        const params = new URLSearchParams();

        if (filterEspecialidade) {
            params.append('specialtyId', filterEspecialidade);
        }
        if (filterMedico) {
            params.append('medicoId', filterMedico);
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        api.get(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setConsultas(res.data))
            .catch((err) => {
                setErro('Erro ao carregar consultas. ' + (err.response?.data?.error || ''));
            })
            .finally(() => setLoading(false));
    };

    const fetchMedicos = () => {
        api.get('/doctors', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setMedicos(res.data))
            .catch(err => showMessage(`Erro ao carregar médicos: ${err.response?.data?.error || err.message}`, 'error'));
    };

    const fetchEspecialidades = () => {
        api.get('/specialties', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setEspecialidades(res.data))
            .catch(err => showMessage(`Erro ao carregar especialidades: ${err.response?.data?.error || err.message}`, 'error'));
    };

    const fetchPacientes = () => {
        api.get('/users', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                const pacientesData = res.data.filter(u => u.role === 'user');
                setPacientes(pacientesData);
            })
            .catch(err => showMessage(`Erro ao carregar pacientes: ${err.response?.data?.error || err.message}`, 'error'));
    };

    const handleAdd = (e) => {
        e.preventDefault();
        // ... Lógica de adicionar (sem alterações) ...
    };

    const handleEdit = (e) => {
        e.preventDefault();
        // ... Lógica de editar (sem alterações) ...
    };

    const handleDelete = (id) => {
        // ... Lógica de apagar (sem alterações) ...
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
            const date = new Date(isoString);
            return date.toLocaleString('pt-PT', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            console.error("Erro ao formatar data para exibição:", isoString, e);
            return '';
        }
    };


    if (loading) return <div className="list-container"><div className="loading-message">A carregar consultas...</div></div>;
    if (erro) return <div className="list-container"><div className="error-message">{erro}</div></div>;

    return (
        <div className="list-container">
            <h2 className="list-title">Consultas</h2>

            {(user?.role === 'admin' || user?.role === 'user') && (
                <form onSubmit={handleAdd} className="form-container">
                    <h3 className="form-section-title">Adicionar Nova Consulta</h3>
                    <div className="form-row">
                        <input
                            type="datetime-local"
                            value={newData}
                            onChange={e => setNewData(e.target.value)}
                            className="form-input"
                            required
                        />
                        <select
                            value={newEspecialidade}
                            onChange={e => {
                                setNewEspecialidade(e.target.value);
                                setNewMedico('');
                            }}
                            className="form-input"
                            required
                        >
                            <option value="">Especialidade</option>
                            {especialidades.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select
                            value={newMedico}
                            onChange={e => setNewMedico(e.target.value)}
                            className="form-input"
                            required
                        >
                            <option value="">Selecione o Médico</option>
                            {medicos.filter(m => !newEspecialidade || m.specialty?.id === Number(newEspecialidade)).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        {user?.role === 'admin' && (
                            <select
                                value={newPaciente}
                                onChange={e => setNewPaciente(e.target.value)}
                                className="form-input"
                                required={user?.role === 'admin'}
                            >
                                <option value="">Selecione o Paciente</option>
                                {pacientes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        )}
                        <input
                            type="text"
                            placeholder="Descrição (opcional)"
                            value={newDescricao}
                            onChange={e => setNewDescricao(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <button type="submit" className="action-button add">
                        <PlusCircle size={18} /> Adicionar Consulta
                    </button>
                </form>
            )}

            <div className="card-container">
                <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, flexGrow: 1 }}>Filtrar Consultas</h3>
                    <select
                        value={filterEspecialidade}
                        onChange={e => {
                            setFilterEspecialidade(e.target.value);
                            setFilterMedico('');
                        }}
                        className="form-input"
                    >
                        <option value="">Todas as Especialidades</option>
                        {especialidades.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select
                        value={filterMedico}
                        onChange={e => setFilterMedico(e.target.value)}
                        className="form-input"
                    >
                        <option value="">Todos os Médicos</option>
                        {medicos.filter(m => !filterEspecialidade || m.specialty?.id === Number(filterEspecialidade)).map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
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
                                <td data-label="ID">{c.id}</td>
                                <td data-label="Data">
                                    {editId === c.id ? (
                                        <input
                                            type="datetime-local"
                                            value={editData}
                                            onChange={e => setEditData(e.target.value)}
                                            className="form-input small"
                                            required
                                        />
                                    ) : (
                                        // CORREÇÃO APLICADA AQUI:
                                        formatDateTimeForDisplay(c.data)
                                    )}
                                </td>
                                <td data-label="Especialidade">
                                    {editId === c.id ? (
                                        <select
                                            value={editEspecialidade}
                                            onChange={e => {
                                                setEditEspecialidade(e.target.value);
                                                setEditMedico('');
                                            }}
                                            className="form-input small"
                                            required
                                        >
                                            <option value="">Especialidade</option>
                                            {especialidades.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    ) : (
                                        c.specialty?.name
                                    )}
                                </td>
                                <td data-label="Médico">
                                    {editId === c.id ? (
                                        <select
                                            value={editMedico}
                                            onChange={e => setEditMedico(e.target.value)}
                                            className="form-input small"
                                            required
                                        >
                                            <option value="">Médico</option>
                                            {medicos.filter(m => !editEspecialidade || m.specialty?.id === Number(editEspecialidade)).map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        c.medico?.name || ''
                                    )}
                                </td>
                                <td data-label="Descrição">
                                    {editId === c.id ? (
                                        <input
                                            type="text"
                                            placeholder="Descrição"
                                            value={editDescricao}
                                            onChange={e => setEditDescricao(e.target.value)}
                                            className="form-input small"
                                        />
                                    ) : (
                                        c.descricao
                                    )}
                                </td>
                                <td data-label="Paciente">
                                    {editId === c.id && user?.role === 'admin' ? (
                                        <select
                                            value={editPaciente}
                                            onChange={e => setEditPaciente(e.target.value)}
                                            className="form-input small"
                                            required={user?.role === 'admin'}
                                        >
                                            <option value="">Paciente</option>
                                            {pacientes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    ) : (
                                        c.paciente ? c.paciente.name : 'N/A'
                                    )}
                                </td>
                                <td data-label="Ações">
                                    {editId === c.id ? (
                                        <>
                                            <button className="action-button save" onClick={handleEdit} title="Guardar"><Save size={18} /></button>
                                            <button className="action-button cancel" onClick={() => setEditId(null)} title="Cancelar"><X size={18} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="action-button edit" onClick={() => {
                                                setEditId(c.id);
                                                setEditData(formatDateTimeForInput(c.data));
                                                setEditDescricao(c.descricao || '');
                                                setEditEspecialidade(c.specialty?.id?.toString() || '');
                                                setEditMedico(c.medico?.id?.toString() || '');
                                                setEditPaciente(c.paciente?.id?.toString() || '');
                                            }} title="Editar"><Edit size={18} /></button>
                                            <button className="action-button delete" onClick={() => handleDelete(c.id)} title="Eliminar"><Trash2 size={18} /></button>
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