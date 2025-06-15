const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware de autenticação
const { Specialty, Doctor } = require('../models'); // Importa os modelos Specialty e Doctor

// Middleware específico para verificar se é admin para operações de escrita
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem gerir especialidades.' });
  }
  next();
};

// GET /specialties - Lista todas as especialidades
// Requer autenticação (pelo router.use), mas não requer ser admin
router.get('/', async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
        // Opcional: pode incluir médicos associados se tiver a relação N:M configurada
        // include: [{ model: Doctor, as: 'doctors', attributes: ['id', 'name'], through: { attributes: [] } }]
    });
    res.json(specialties);
  } catch (error) {
    console.error('Erro ao buscar especialidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar especialidades.' });
  }
});

// Middleware de autenticação aplicado a todas as rotas neste ficheiro
router.use(auth);


// POST /specialties - Adiciona uma nova especialidade (Requer admin)
router.post('/', adminOnly, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O nome da especialidade é obrigatório.' });
  }

  try {
    const newSpecialty = await Specialty.create({ name });
    res.status(201).json(newSpecialty); // 201 Created
  } catch (error) {
    console.error('Erro ao criar especialidade:', error);
     if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Especialidade com este nome já existe.' });
    }
    res.status(500).json({ error: 'Erro interno do servidor ao criar especialidade.' });
  }
});

// GET /specialties/:id - Retorna uma especialidade específica pelo ID
// Requer autenticação, mas não requer ser admin
router.get('/:id', async (req, res) => {
  const specialtyId = req.params.id;

  try {
    const specialty = await Specialty.findByPk(specialtyId, {
         include: [{
               model: Doctor,
               as: 'doctors', // Alias definido em Specialty.hasMany(Doctor, { as: 'doctors', ... })
               attributes: ['id', 'name'] // Campos dos médicos a incluir

           }]
    });

    if (!specialty) {
      return res.status(404).json({ error: 'Especialidade não encontrada.' });
    }

    res.json(specialty);

  } catch (error) {
    console.error(`Erro ao buscar especialidade com ID ${specialtyId}:`, error);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar especialidade.' });
  }
});

// PUT /specialties/:id - Atualiza uma especialidade pelo ID (Requer admin)
router.put('/:id', adminOnly, async (req, res) => {
  const specialtyId = req.params.id;
  const { name } = req.body;

  if (!name) {
      return res.status(400).json({ error: 'O nome da especialidade é obrigatório para atualização.' });
  }

  try {
    const specialty = await Specialty.findByPk(specialtyId);

    if (!specialty) {
      return res.status(404).json({ error: 'Especialidade não encontrada.' });
    }

    await specialty.update({ name });

    res.json(specialty);

  } catch (error) {
    console.error(`Erro ao atualizar especialidade com ID ${specialtyId}:`, error);
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Especialidade com este nome já existe.' });
    }
    res.status(500).json({ error: 'Erro interno do servidor ao atualizar especialidade.' });
  }
});

// DELETE /specialties/:id - Deleta uma especialidade pelo ID (Requer admin)
router.delete('/:id', adminOnly, async (req, res) => {
  const specialtyId = req.params.id;

  try {
    const deletedRowCount = await Specialty.destroy({
      where: { id: specialtyId }
    });

    if (deletedRowCount === 0) {
      return res.status(404).json({ error: 'Especialidade não encontrada.' });
    }

    // Se a especialidade estiver associada a médicos (na relação 1:M ou N:M),
    // a ação ON DELETE na chave estrangeira na tabela 'doctors' (ou 'doctor_specialties')
    // determinará o que acontece. Com ON DELETE SET NULL ou CASCADE, não haverá erro aqui.

    res.status(204).send(); // 204 No Content

  } catch (error) {
    console.error(`Erro ao deletar especialidade com ID ${specialtyId}:`, error);
    res.status(500).json({ error: 'Erro interno do servidor ao eliminar especialidade.' });
  }
});


module.exports = router;
