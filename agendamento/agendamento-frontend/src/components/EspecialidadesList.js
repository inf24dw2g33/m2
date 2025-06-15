import React, { useEffect, useState } from 'react';
import './components.css';
import api from '../api/api';

function EspecialidadesList({ user, showMessage }) {
  const [specialties, setSpecialties] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  // Renomear 'doctors' para 'expandedSpecialtyDoctors' para maior clareza
  const [expandedSpecialtyDoctors, setExpandedSpecialtyDoctors] = useState([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false); // Novo estado de carregamento para médicos
  const [erro, setErro] = useState('');
  const [doctorsError, setDoctorsError] = useState(''); // Erro específico para médicos
  const [loading, setLoading] = useState(true); // Carregamento inicial de especialidades

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
    const token = localStorage.getItem('token');
    api.get('/specialties', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
        setSpecialties(sorted);
        setLoading(false);
        setErro(''); // Limpa erro geral se a busca de especialidades for bem-sucedida
      })
      .catch(() => {
        setErro('Erro ao carregar especialidades. Tente novamente mais tarde.');
        setLoading(false);
      });
  };

  // Consulta médicos da especialidade
  const fetchDoctors = (id) => {
    setIsDoctorsLoading(true); // Inicia carregamento
    setExpandedSpecialtyDoctors([]); // Limpa a lista de médicos da especialidade atual
    setDoctorsError(''); // Limpa qualquer erro anterior de médicos

    const token = localStorage.getItem('token');
    api.get(`/specialties/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setExpandedSpecialtyDoctors(res.data.doctors || []);
        setIsDoctorsLoading(false); // Finaliza carregamento com sucesso
      })
      .catch(() => {
        setDoctorsError('Erro ao carregar médicos desta especialidade.');
        setIsDoctorsLoading(false); // Finaliza carregamento com erro
      });
  };

  // Adicionar especialidade
  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showMessage && showMessage('O nome da especialidade não pode ser vazio.', 'warning');
      return;
    }
    const token = localStorage.getItem('token');
    api.post('/specialties', { name: newName }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setNewName('');
        fetchSpecialties();
        showMessage && showMessage('Especialidade adicionada com sucesso!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao adicionar especialidade.', 'error');
      });
  };

  // Editar especialidade
  const handleEdit = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showMessage && showMessage('O nome da especialidade não pode ser vazio.', 'warning');
      return;
    }
    const token = localStorage.getItem('token');
    api.put(`/specialties/${editId}`, { name: editName }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setEditId(null);
        setEditName('');
        fetchSpecialties();
        showMessage && showMessage('Especialidade atualizada com sucesso!', 'success');
      })
      .catch(err => {
        showMessage && showMessage(err.response?.data?.error || 'Erro ao atualizar especialidade.', 'error');
      });
  };

  // Eliminar especialidade
  const handleDelete = (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar esta especialidade?')) {
      return;
    }
    const token = localStorage.getItem('token');
    api.delete(`/specialties/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        fetchSpecialties();
        showMessage && showMessage('Especialidade eliminada com sucesso!', 'success');
        // Se a especialidade eliminada era a expandida, fechar
        if (expandedId === id) {
          setExpandedId(null);
          setExpandedSpecialtyDoctors([]);
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
      setExpandedSpecialtyDoctors([]); // Limpa a lista quando colapsa
      setDoctorsError(''); // Limpa o erro de médicos
    } else {
      setExpandedId(id);
      fetchDoctors(id);
    }
  };

  if (loading) return <div className="especialidades-container"><div className="especialidades-card">A carregar especialidades...</div></div>;
  if (erro) return <div className="especialidades-container"><div className="especialidades-card">{erro}</div></div>;

  return (
    <div className="especialidades-container">
      <div className="especialidades-card">
        <h2>Gestão de Especialidades</h2> {/* Título ajustado para corresponder à imagem */}

        {/* Formulário para adicionar (apenas admin) */}
        {user?.role === 'admin' && (
          <form onSubmit={handleAdd} className="especialidade-form">
            <input
              type="text"
              placeholder="Nome da Especialidade" // Placeholder ajustado para corresponder à imagem
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="especialidade-input"
            />
            <button type="submit" className="especialidade-btn add">Adicionar</button>
          </form>
        )}

        <ul className="especialidades-list">
          {specialties.map(spec => (
            <li key={spec.id} className="especialidade-item"> {/* Alterado de especialidade-link-item para especialidade-item */}
              <div className="especialidade-header" onClick={() => handleExpand(spec.id)}> {/* Adicionado div para o header clicável */}
                <span>{spec.name}</span>
                <button
                  className="especialidade-btn view-details" // Nova classe para o botão de visualização
                  onClick={(e) => { e.stopPropagation(); handleExpand(spec.id); }} // Previne a propagação para evitar duplo clique
                  aria-expanded={expandedId === spec.id}
                  aria-controls={`details-${spec.id}`}
                >
                  {/* Ícone de olho ou seta para indicar expand/collapse */}
                  {expandedId === spec.id ? (
                      <i className="fa-solid fa-eye-slash"></i> // Exemplo: ícone para fechar
                  ) : (
                      <i className="fa-solid fa-eye"></i> // Exemplo: ícone para abrir
                  )}
                </button>
              </div>

              {expandedId === spec.id && (
                <div id={`details-${spec.id}`} className="especialidade-details"> {/* Classe ajustada e ID para acessibilidade */}
                  {editId === spec.id ? (
                    <form onSubmit={handleEdit} className="especialidade-edit-form"> {/* Nova classe para formulário de edição */}
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="especialidade-input"
                      />
                      <button type="submit" className="especialidade-btn save">Guardar</button>
                      <button type="button" className="especialidade-btn cancel" onClick={() => setEditId(null)}>Cancelar</button>
                    </form>
                  ) : (
                    <>
                      {user?.role === 'admin' && (
                        <div className="especialidade-actions-row"> {/* Agrupamento de botões de ação */}
                          <button className="especialidade-btn edit" onClick={() => { setEditId(spec.id); setEditName(spec.name); }}>Editar</button>
                          <button className="especialidade-btn delete" onClick={() => handleDelete(spec.id)}>Eliminar</button>
                        </div>
                      )}
                      <div style={{ marginTop: 10 }}>
                        <strong>Médicos desta especialidade:</strong>
                        {isDoctorsLoading ? (
                            <div className="sem-medicos">A carregar médicos...</div>
                        ) : doctorsError ? (
                            <div className="sem-medicos">{doctorsError}</div>
                        ) : expandedSpecialtyDoctors.length === 0 ? ( // Usa o novo estado
                          <div className="sem-medicos">Sem médicos associados.</div>
                        ) : (
                          <ul className="doctors-list-inline"> {/* Classe adicionada para formatar como pills */}
                            {expandedSpecialtyDoctors.map(doc => ( // Usa o novo estado
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