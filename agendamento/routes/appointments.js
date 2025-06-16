const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware de autenticação

const { Appointment, User, Doctor, Specialty } = require('../models');

// Aplicar middleware de autenticação a todas as rotas de agendamentos
router.use(auth);

// Helper para formatar a resposta da consulta para o formato da API (id, data, descricao, specialty, medico, paciente)
const formatAppointmentResponse = (appointment) => {
    if (!appointment) return null;

    const doctor = appointment.medico;
    const specialty = doctor && doctor.specialty;
    const patient = appointment.paciente; // Adiciona o paciente

    const timePart = appointment.time ? appointment.time : '00:00:00';
    const apiData = appointment.date ? `${appointment.date}T${timePart}${timePart.includes('Z') ? '' : 'Z'}` : null;

    return {
        id: appointment.id,
        data: apiData,
        descricao: appointment.notes,
        specialty: specialty ? {
            id: specialty.id,
            name: specialty.name
        } : null,
        // *** NOVO: Incluir medico e paciente na resposta formatada ***
        medico: doctor ? {
            id: doctor.id,
            name: doctor.name
        } : null,
        paciente: patient ? {
            id: patient.id,
            name: patient.name
        } : null
    };
};

// Helper para garantir que o utilizador autenticado é o dono da consulta ou é admin
const authorizeAppointmentAccess = (req, appointment) => {
    if (!appointment) return false;
    if (!req.user || !req.user.role) return false;
    if (req.user.role === 'admin') {
        return true;
    }
    const appointmentUserId = appointment.user_id;
    if (req.user.id === appointmentUserId) {
        return true;
    }
    return false;
};

// GET /appointments - Retorna uma lista de consultas do utilizador autenticado (ou todas para admin), incluindo especialidade
// Suporta filtragem por especialidadeId e/ou medicoId via query parameters
router.get('/', async (req, res) => {
    try {
        const { specialtyId, medicoId } = req.query; // Pega os parâmetros de query

        const where = req.user.role === 'admin' ? {} : { user_id: req.user.id };

        const include = [
            {
                model: Doctor,
                as: 'medico',
                attributes: ['id', 'name', 'specialty_id'],
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name'],
                    // *** NOVO: Condição de filtro para especialidade aqui ***
                    where: specialtyId ? { id: specialtyId } : {}
                }]
            },
            {
                model: User,
                as: 'paciente',
                attributes: ['id', 'name']
            }
        ];

        // *** NOVO: Adiciona filtro por medicoId no where principal se for fornecido ***
        if (medicoId) {
            where.doctor_id = medicoId;
        }

        const appointments = await Appointment.findAll({
            where,
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'],
            include,
            order: [['date', 'ASC'], ['time', 'ASC']]
        });

        const formattedAppointments = appointments.map(formatAppointmentResponse);

        res.json(formattedAppointments);

    } catch (error) {
        console.error('Erro ao listar consultas:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao listar consultas.' });
    }
});

// POST /appointments - Cria uma nova consulta
router.post('/', auth, async (req, res) => {
    const pacienteId = req.user.role === 'admin' && req.body.pacienteId ? req.body.pacienteId : req.user.id; // Permite admin definir pacienteId
    const { data, medicoId, especialidadeId, descricao } = req.body;

    if (!data || !medicoId || !especialidadeId) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando: data, medicoId, especialidadeId.' });
    }

    try {
        const doctor = await Doctor.findByPk(medicoId, {
            include: [{
                model: Specialty,
                as: 'specialty',
                attributes: ['id']
            }],
            rejectOnEmpty: true
        });

        if (!doctor.specialty || doctor.specialty.id !== especialidadeId) {
            return res.status(400).json({ error: 'Médico não encontrado ou não associado à especialidade fornecida.' });
        }

        // Validação se o pacienteId fornecido é válido, caso seja admin
        if (req.user.role === 'admin' && req.body.pacienteId) {
            const patientExists = await User.findByPk(pacienteId);
            if (!patientExists) {
                return res.status(400).json({ error: 'Paciente fornecido não encontrado.' });
            }
        }


        const appointmentDateTime = new Date(data);

        if (isNaN(appointmentDateTime.getTime())) {
            return res.status(400).json({ error: 'Formato de data e hora inválido.' });
        }

        const dbDate = appointmentDateTime.toISOString().split('T')[0];
        const dbTime = appointmentDateTime.toTimeString().split(' ')[0];

        const appointment = await Appointment.create({
            date: dbDate,
            time: dbTime,
            notes: descricao,
            user_id: pacienteId,
            doctor_id: medicoId
        });

        const createdAppointmentDetails = await Appointment.findByPk(appointment.id, {
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'],
            include: [
                {
                    model: Doctor,
                    as: 'medico',
                    attributes: ['id', 'name'],
                    include: [{
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: User,
                    as: 'paciente',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.status(201).json(formatAppointmentResponse(createdAppointmentDetails)); // Retorna formatado

    } catch (error) {
        console.error('Erro ao criar consulta:', error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'ID de médico ou paciente inválido.' });
        }
        if (error.name === 'SequelizeEmptyResultError') {
            return res.status(400).json({ error: 'Médico não encontrado com o ID fornecido.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao criar consulta.' });
    }
});

// GET /appointments/:id - Retorna uma consulta específica pelo ID
router.get('/:id', async (req, res) => {
    const appointmentId = req.params.id;

    try {
        const appointment = await Appointment.findByPk(appointmentId, {
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'],
            include: [
                {
                    model: Doctor,
                    as: 'medico',
                    attributes: ['id', 'name'],
                    include: [{
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: User,
                    as: 'paciente',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Consulta não encontrada.' });
        }

        if (!authorizeAppointmentAccess(req, appointment)) {
            return res.status(403).json({ error: 'Acesso negado. Não tem permissão para visualizar esta consulta.' });
        }

        res.json(formatAppointmentResponse(appointment)); // Retorna a consulta formatada

    } catch (error) {
        console.error(`Erro ao buscar consulta com ID ${appointmentId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar consulta.' });
    }
});

// PUT /appointments/:id - Atualiza os dados de uma consulta
router.put('/:id', async (req, res) => {
    const appointmentId = req.params.id;
    const { data, descricao, medicoId, especialidadeId, pacienteId } = req.body; // Adiciona pacienteId ao destructuring do body

    try {
        const appointment = await Appointment.findByPk(appointmentId);

        if (!appointment) {
            return res.status(404).json({ error: 'Consulta não encontrada' });
        }

        if (!authorizeAppointmentAccess(req, appointment)) {
            return res.status(403).json({ error: 'Acesso negado. Não tem permissão para editar esta consulta.' });
        }

        const updateFields = {};

        if (data !== undefined) {
            const appointmentDateTime = new Date(data);
            if (isNaN(appointmentDateTime.getTime())) {
                return res.status(400).json({ error: 'Formato de data e hora inválido.' });
            }
            updateFields.date = appointmentDateTime.toISOString().split('T')[0];
            updateFields.time = appointmentDateTime.toTimeString().split(' ')[0];
        }

        if (descricao !== undefined) {
            updateFields.notes = descricao;
        }

        if (medicoId !== undefined) {
            const doctor = await Doctor.findByPk(medicoId, {
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id']
                }]
            });

            if (!doctor) {
                return res.status(400).json({ error: 'ID do médico inválido.' });
            }

            if (especialidadeId !== undefined) {
                if (!doctor.specialty || doctor.specialty.id !== especialidadeId) {
                    return res.status(400).json({ error: 'Novo médico não associado à especialidade fornecida.' });
                }
            }
            updateFields.doctor_id = medicoId;
        }

        // *** NOVO: Permite ao admin alterar o user_id (paciente) ***
        if (req.user.role === 'admin' && pacienteId !== undefined) {
            const patientExists = await User.findByPk(pacienteId);
            if (!patientExists) {
                return res.status(400).json({ error: 'ID do paciente inválido.' });
            }
            updateFields.user_id = pacienteId;
        }


        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: 'Nenhum campo de atualização válido fornecido (data, descricao, medicoId, pacienteId).' });
        }

        await appointment.update(updateFields);

        const updatedAppointmentDetails = await Appointment.findByPk(appointment.id, {
            attributes: ['id', 'date', 'time', 'notes', 'user_id', 'doctor_id'],
            include: [
                {
                    model: Doctor,
                    as: 'medico',
                    attributes: ['id', 'name'],
                    include: [{
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: User,
                    as: 'paciente',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.json(formatAppointmentResponse(updatedAppointmentDetails));

    } catch (error) {
        console.error(`Erro ao editar consulta com ID ${appointmentId}:`, error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'ID de médico ou paciente inválido na atualização.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao editar consulta.' });
    }
});

// Eliminar consulta
router.delete('/:id', async (req, res) => {
    const appointmentId = req.params.id;

    try {
        const appointment = await Appointment.findByPk(appointmentId);

        if (!appointment) {
            return res.status(404).json({ error: 'Consulta não encontrada' });
        }

        if (!authorizeAppointmentAccess(req, appointment)) {
            return res.status(403).json({ error: 'Acesso negado. Não tem permissão para eliminar esta consulta.' });
        }

        await appointment.destroy();
        res.status(204).send();

    } catch (error) {
        console.error(`Erro ao eliminar consulta com ID ${appointmentId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor ao eliminar consulta.' });
    }
});

module.exports = router;