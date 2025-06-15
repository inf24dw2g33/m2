const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Assumindo que este middleware verifica autenticação e adiciona req.user
const { Appointment, User, Doctor, Specialty } = require('../models'); // Importa os modelos Doctor e Specialty

// GET /doctors - Lista todos os médicos, incluindo a especialidade
// Esta rota já existia, removemos apenas o 'auth' inline pois é gerido pelo router.use
router.get('/', async (req, res) => {
  try {
 const doctors = await Doctor.findAll({
 // >>> CORREÇÃO: Use um array no include, especificando o modelo e o alias 'as' <<<
include: [{
 model: Specialty, // <-- O Modelo que quer incluir
 as: 'specialty', // <-- O ALIAS definido na associação Doctor.belongsTo(Specialty, { as: 'specialty', ... })
 attributes: ['id', 'name'] // <-- Selecione os campos da especialidade que quer incluir
 }],
 // Opcional: Limite os campos retornados para o próprio médico
 attributes: ['id', 'name'],
    });
    res.json(doctors);
  } catch (error) {
    console.error('Erro ao buscar médicos:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar médicos.' });
  }
});

// Middleware de verificação de autenticação e admin (aplicado a todas as rotas abaixo)
router.use(auth, (req, res, next) => {
  // Verifica se o utilizador está autenticado (middleware 'auth' deve adicionar req.user)
  // e se tem a role 'admin'
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem gerir médicos.' });
  }
  next(); // Se for admin autenticado, continua para a próxima middleware/rota
});



// POST /doctors - Adiciona um novo médico (Requer admin)
// Esta rota já existia, removemos a verificação de admin inline pois é gerida pelo router.use
router.post('/', async (req, res) => {
  const { name, specialty_id } = req.body; // Pega os dados do corpo da requisição

  // Validação básica dos campos necessários
  if (!name || !specialty_id) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando: name, specialty_id.' });
  }

  try {
    const specialty = await Specialty.findByPk(specialty_id);
     if (!specialty) {
         return res.status(400).json({ error: 'ID de especialidade inválido.' });
     }
    // Cria o novo médico no banco de dados
    const newDoctor = await Doctor.create({ name, specialty_id });

    // Opcional: buscar o médico criado com a especialidade para retornar na resposta
    const doctorWithSpecialty = await Doctor.findByPk(newDoctor.id, {
        attributes: ['id', 'name'], // Seleciona os campos do Doutor para retornar
 include: [{
 model: Specialty, // <-- O Modelo que quer incluir
 as: 'specialty', // <<< Use o ALIAS definido na associação Doctor.belongsTo(Specialty, { as: 'specialty', ... })
 attributes: ['id', 'name'] // <<< Selecione os campos da especialidade que quer incluir
}]
    });

    res.status(201).json(doctorWithSpecialty); // 201 Created

  } catch (error) {
    console.error('Erro ao criar médico:', error);
    // Pode adicionar tratamento de erro específico para specialty_id que não existe (ForeignKeyConstraintError)
    res.status(500).json({ error: 'Erro interno do servidor ao criar médico.' });
  }
});

// GET /doctors/:id - Retorna um médico específico pelo ID, incluindo a especialidade (Requer admin)
router.get('/:id', async (req, res) => {
  const doctorId = req.params.id; // Pega o ID dos parâmetros do URL

  try {
    // Busca o médico pelo ID e inclui a especialidade
    const doctor = await Doctor.findByPk(doctorId, {
      include: {
        model: Specialty,
        as: 'specialty', // <<-- Usa o alias definido na associação Doctor.belongsTo(Specialty, { as: 'specialty', ... })
        attributes: ['id', 'name'] // Inclui os campos da especialidade
      }
      
    });

    // Se o médico não for encontrado
    if (!doctor) {
      return res.status(404).json({ error: 'Médico não encontrado.' });
    }

    // Retorna o médico encontrado com a especialidade
    res.json(doctor);

  } catch (error) {
    console.error(`Erro ao buscar médico com ID ${doctorId}:`, error);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar médico.' });
  }
});

// PUT /doctors/:id - Atualiza os dados de um médico pelo ID (Requer admin)
router.put('/:id', async (req, res) => {
  const doctorId = req.params.id; // Pega o ID dos parâmetros do URL
  const { name, specialty_id } = req.body; // Pega os campos a serem atualizados do corpo da requisição

  try {
    // Busca o médico pelo ID
    const doctor = await Doctor.findByPk(doctorId);

    // Se o médico não for encontrado
    if (!doctor) {
      return res.status(404).json({ error: 'Médico não encontrado.' });
    }

    // Atualiza os dados do médico
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (specialty_id !== undefined) updateFields.specialty_id = specialty_id;

    // Se não houver campos para atualizar no body, retorna 400
    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo de atualização fornecido.' });
    }

    await doctor.update(updateFields);

    // Opcional: buscar o médico atualizado com a especialidade para retornar na resposta
    const updatedDoctorWithSpecialty = await Doctor.findByPk(doctor.id, {
       include: {
        model: Specialty,
        as: 'specialty', // <<-- Usa o alias definido na associação Doctor.belongsTo(Specialty, { as: 'specialty', ... })
        attributes: ['id', 'name'] // Inclui os campos da especialidade
      }
    });

    // Retorna o médico atualizado com a especialidade
    res.json(updatedDoctorWithSpecialty);

  } catch (error) {
    console.error(`Erro ao atualizar médico com ID ${doctorId}:`, error);
    // Pode adicionar tratamento de erro específico para specialty_id inválido
    res.status(500).json({ error: 'Erro interno do servidor ao atualizar médico.' });
  }
});


router.get('/:id/appointments', async (req, res) => {
    const doctorId = req.params.id; // Pega o ID do médico dos parâmetros do URL

    try {
        // Opcional: Verificar se o médico com este ID existe antes de buscar as consultas
        const doctor = await Doctor.findByPk(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Médico não encontrado.' });
        }

        // Buscar todas as consultas para este médico (filtrando por doctor_id)
        // E incluir os dados do Utilizador (Paciente) associado a cada consulta
        const appointments = await Appointment.findAll({
            where: { doctor_id: doctorId }, // Filtra as consultas pelo ID do médico
            attributes: ['id', 'date', 'time', 'notes'], // Seleciona os campos da consulta
            include: [
                {
                    model: User,
                    as: 'paciente', // <<-- Usa o alias definido em Appointment.belongsTo(User)
                    attributes: ['id', 'name', 'email'] // Inclui os campos do paciente que quer mostrar
                    // Pode adicionar mais atributos se necessário, mas evite dados sensíveis
                },
                {
                    model: Doctor, // Inclui o Doutor associado a cada consulta
                    as: 'medico', // <<-- Usa o alias definido em Appointment.belongsTo(Doctor, { as: 'medico', ... })
                    attributes: ['id', 'name'], // Inclui os campos do médico que quer mostrar
                    // Opcional: required: true se a consulta DEVE ter um médico
                    include: [ // >>> Inclui a Especialidade DENTRO do Doutor <<<
                        {
                            model: Specialty, // O modelo Specialty
                            as: 'specialty', // <<-- Usa o alias definido em Doctor.belongsTo(Specialty, { as: 'specialty', ... })
                            attributes: ['id', 'name'] // Inclui os campos da especialidade
                            // Opcional: required: true se o médico DEVE ter uma especialidade
                        }
                    ]
                }
            ],
            order: [['date', 'ASC'], ['time', 'ASC']] 
        });


        res.json(appointments); // Envia a lista de consultas com pacientes

    } catch (error) {
        console.error(`Erro ao buscar consultas para o médico com ID ${doctorId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar consultas do médico.' });
    }
});

// DELETE /doctors/:id - Deleta um médico pelo ID (Requer admin)
router.delete('/:id', async (req, res) => {
  const doctorId = req.params.id; // Pega o ID dos parâmetros do URL

  try {
    // Deleta o médico pelo ID
    // A função destroy retorna o número de linhas afetadas
    const deletedRowCount = await Doctor.destroy({
      where: { id: doctorId }
    });

    // Se nenhuma linha foi afetada, significa que o médico não foi encontrado
    if (deletedRowCount === 0) {
      return res.status(404).json({ error: 'Médico não encontrado.' });
    }

    // Retorna uma resposta de sucesso (usando 204 No Content)
    res.status(204).send(); // 204 significa sucesso e sem corpo na resposta

  } catch (error) {
    console.error(`Erro ao deletar médico com ID ${doctorId}:`, error);
    // Considere tratamento de erro se o médico tiver appointments associados (ForeignKeyConstraintError)
    res.status(500).json({ error: 'Erro interno do servidor ao deletar médico.' });
  }
});


module.exports = router;